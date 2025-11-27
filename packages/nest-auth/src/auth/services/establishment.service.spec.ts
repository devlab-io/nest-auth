import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DefaultEstablishmentService } from './establishment.service';
import { OrganisationServiceToken } from './organisation.service';
import { EstablishmentEntity, OrganisationEntity } from '../entities';
import {
  CreateEstablishmentRequest,
  UpdateEstablishmentRequest,
  EstablishmentQueryParams,
} from '@devlab-io/nest-auth-types';

describe('EstablishmentService', () => {
  let service: DefaultEstablishmentService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockOrganisationService = {
    getById: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockOrganisation: OrganisationEntity = {
    id: 'org-id',
    name: 'Test Organisation',
    establishments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    enabled: true,
  } as OrganisationEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DefaultEstablishmentService,
        {
          provide: getRepositoryToken(EstablishmentEntity),
          useValue: mockRepository,
        },
        {
          provide: OrganisationServiceToken,
          useValue: mockOrganisationService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<DefaultEstablishmentService>(
      DefaultEstablishmentService,
    );
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new establishment', async () => {
      const request: CreateEstablishmentRequest = {
        name: 'Test Establishment',
        organisationId: 'org-id',
      };
      const createdEstablishment = {
        id: 'est-id',
        name: 'Test Establishment',
        organisation: mockOrganisation,
        accounts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as EstablishmentEntity;

      mockOrganisationService.getById.mockResolvedValue(mockOrganisation);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdEstablishment);
      mockRepository.save.mockResolvedValue(createdEstablishment);

      const result = await service.create(request);

      expect(mockOrganisationService.getById).toHaveBeenCalledWith('org-id');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          name: request.name,
          organisation: { id: 'org-id' },
        },
        relations: ['organisation', 'accounts'],
      });
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: request.name,
        organisation: mockOrganisation,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdEstablishment);
      expect(result).toEqual(createdEstablishment);
    });

    it('should throw NotFoundException if organisation not found', async () => {
      const request: CreateEstablishmentRequest = {
        name: 'Test Establishment',
        organisationId: 'non-existent-org-id',
      };

      mockOrganisationService.getById.mockRejectedValue(
        new NotFoundException('Organisation not found'),
      );

      await expect(service.create(request)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if establishment with same name exists', async () => {
      const request: CreateEstablishmentRequest = {
        name: 'Existing Establishment',
        organisationId: 'org-id',
      };
      const existingEstablishment = {
        id: 'existing-est-id',
        name: 'Existing Establishment',
        organisation: mockOrganisation,
      } as EstablishmentEntity;

      mockOrganisationService.getById.mockResolvedValue(mockOrganisation);
      mockRepository.findOne.mockResolvedValue(existingEstablishment);

      await expect(service.create(request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(request)).rejects.toThrow(
        'Establishment with name "Existing Establishment" already exists in this organisation',
      );
    });
  });

  describe('getById', () => {
    it('should return an establishment by ID', async () => {
      const id = 'est-id';
      const establishment = {
        id,
        name: 'Test Establishment',
        organisation: mockOrganisation,
        accounts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as EstablishmentEntity;

      mockRepository.findOne.mockResolvedValue(establishment);

      const result = await service.getById(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['organisation', 'accounts'],
      });
      expect(result).toEqual(establishment);
    });

    it('should throw NotFoundException if establishment not found', async () => {
      const id = 'non-existent-id';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getById(id)).rejects.toThrow(NotFoundException);
      await expect(service.getById(id)).rejects.toThrow(
        `Establishment with ID ${id} not found`,
      );
    });
  });

  describe('findById', () => {
    it('should find an establishment by ID', async () => {
      const id = 'est-id';
      const establishment = {
        id,
        name: 'Test Establishment',
        organisation: mockOrganisation,
        accounts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as EstablishmentEntity;

      mockRepository.findOne.mockResolvedValue(establishment);

      const result = await service.findById(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['organisation', 'accounts'],
      });
      expect(result).toEqual(establishment);
    });

    it('should return null if establishment not found', async () => {
      const id = 'non-existent-id';

      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(id);

      expect(result).toBeNull();
    });
  });

  describe('findByNameAndOrganisation', () => {
    it('should find an establishment by name and organisation', async () => {
      const name = 'Test Establishment';
      const organisationId = 'org-id';
      const establishment = {
        id: 'est-id',
        name,
        organisation: mockOrganisation,
        accounts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as EstablishmentEntity;

      mockRepository.findOne.mockResolvedValue(establishment);

      const result = await service.findByNameAndOrganisation(
        name,
        organisationId,
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          name,
          organisation: { id: organisationId },
        },
        relations: ['organisation', 'accounts'],
      });
      expect(result).toEqual(establishment);
    });
  });

  describe('exists', () => {
    it('should return true if establishment exists', async () => {
      const id = 'est-id';

      mockRepository.count.mockResolvedValue(1);

      const result = await service.exists(id);

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toBe(true);
    });

    it('should return false if establishment does not exist', async () => {
      const id = 'non-existent-id';

      mockRepository.count.mockResolvedValue(0);

      const result = await service.exists(id);

      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    it('should search establishments with filters', async () => {
      const params: EstablishmentQueryParams = {
        name: 'Test',
      };
      const establishments = [
        {
          id: 'est-id-1',
          name: 'Test Establishment 1',
          organisation: mockOrganisation,
          accounts: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          enabled: true,
        },
      ] as EstablishmentEntity[];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([establishments, 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.search(params, 1, 10);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'establishment',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'establishment.name ILIKE :name',
        { name: '%Test%' },
      );
      expect(result.data).toEqual(establishments);
      expect(result.total).toBe(1);
    });
  });

  describe('update', () => {
    it('should update an establishment', async () => {
      const id = 'est-id';
      const request: UpdateEstablishmentRequest = {
        name: 'Updated Establishment',
      };
      const existingEstablishment = {
        id,
        name: 'Test Establishment',
        organisation: mockOrganisation,
        accounts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as EstablishmentEntity;
      const updatedEstablishment = {
        ...existingEstablishment,
        name: request.name,
      } as EstablishmentEntity;

      mockRepository.findOne
        .mockResolvedValueOnce(existingEstablishment) // getById
        .mockResolvedValueOnce(null); // findByNameAndOrganisation (no conflict)
      mockRepository.save.mockResolvedValue(updatedEstablishment);

      const result = await service.update(id, request);

      expect(mockRepository.save).toHaveBeenCalledWith(updatedEstablishment);
      expect(result.name).toBe(request.name);
    });

    it('should update organisation if provided', async () => {
      const id = 'est-id';
      const newOrganisation = {
        id: 'new-org-id',
        name: 'New Organisation',
        establishments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as OrganisationEntity;
      const request: UpdateEstablishmentRequest = {
        organisationId: 'new-org-id',
      };
      const existingEstablishment = {
        id,
        name: 'Test Establishment',
        organisation: mockOrganisation,
        accounts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as EstablishmentEntity;

      mockRepository.findOne.mockResolvedValue(existingEstablishment);
      mockOrganisationService.getById.mockResolvedValue(newOrganisation);
      mockRepository.save.mockResolvedValue({
        ...existingEstablishment,
        organisation: newOrganisation,
      } as EstablishmentEntity);

      const result = await service.update(id, request);

      expect(mockOrganisationService.getById).toHaveBeenCalledWith(
        'new-org-id',
      );
      expect(result.organisation.id).toBe('new-org-id');
    });

    it('should throw BadRequestException if new name conflicts', async () => {
      const id = 'est-id';
      const request: UpdateEstablishmentRequest = {
        name: 'Existing Establishment',
      };
      const existingEstablishment = {
        id,
        name: 'Test Establishment',
        organisation: mockOrganisation,
        accounts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as EstablishmentEntity;
      const conflictingEstablishment = {
        id: 'other-est-id',
        name: 'Existing Establishment',
        organisation: mockOrganisation,
        accounts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as EstablishmentEntity;

      mockRepository.findOne
        .mockResolvedValueOnce(existingEstablishment) // getById
        .mockResolvedValueOnce(conflictingEstablishment); // findByNameAndOrganisation (conflict)

      try {
        await service.update(id, request);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe(
          'Establishment with name "Existing Establishment" already exists in this organisation',
        );
      }
    });
  });

  describe('delete', () => {
    it('should delete an establishment', async () => {
      const id = 'est-id';
      const establishment = {
        id,
        name: 'Test Establishment',
        organisation: mockOrganisation,
        accounts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as EstablishmentEntity;

      mockRepository.findOne.mockResolvedValue(establishment);
      mockRepository.remove.mockResolvedValue(establishment);

      await service.delete(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['organisation', 'accounts'],
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(establishment);
    });

    it('should throw NotFoundException if establishment not found', async () => {
      const id = 'non-existent-id';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(id)).rejects.toThrow(NotFoundException);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });
});
