import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrganisationService } from './organisation.service';
import { OrganisationEntity } from '../entities';
import {
  CreateOrganisationRequest,
  UpdateOrganisationRequest,
  OrganisationQueryParams,
} from '../types';

describe('OrganisationService', () => {
  let service: OrganisationService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganisationService,
        {
          provide: getRepositoryToken(OrganisationEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<OrganisationService>(OrganisationService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new organisation', async () => {
      const request: CreateOrganisationRequest = {
        name: 'Test Organisation',
      };
      const createdOrg = {
        id: 'org-id',
        name: 'Test Organisation',
        establishments: [],
      } as OrganisationEntity;

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdOrg);
      mockRepository.save.mockResolvedValue(createdOrg);

      const result = await service.create(request);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: request.name },
        relations: ['establishments'],
      });
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: request.name,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdOrg);
      expect(result).toEqual(createdOrg);
    });

    it('should throw BadRequestException if organisation with same name exists', async () => {
      const request: CreateOrganisationRequest = {
        name: 'Existing Organisation',
      };
      const existingOrg = {
        id: 'existing-id',
        name: 'Existing Organisation',
      } as OrganisationEntity;

      mockRepository.findOne.mockResolvedValue(existingOrg);

      await expect(service.create(request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(request)).rejects.toThrow(
        'Organisation with name "Existing Organisation" already exists',
      );
    });
  });

  describe('getById', () => {
    it('should return an organisation by ID', async () => {
      const id = 'org-id';
      const organisation = {
        id,
        name: 'Test Organisation',
        establishments: [],
      } as OrganisationEntity;

      mockRepository.findOne.mockResolvedValue(organisation);

      const result = await service.getById(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['establishments'],
      });
      expect(result).toEqual(organisation);
    });

    it('should throw NotFoundException if organisation not found', async () => {
      const id = 'non-existent-id';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getById(id)).rejects.toThrow(NotFoundException);
      await expect(service.getById(id)).rejects.toThrow(
        `Organisation with ID ${id} not found`,
      );
    });
  });

  describe('findById', () => {
    it('should find an organisation by ID', async () => {
      const id = 'org-id';
      const organisation = {
        id,
        name: 'Test Organisation',
        establishments: [],
      } as OrganisationEntity;

      mockRepository.findOne.mockResolvedValue(organisation);

      const result = await service.findById(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['establishments'],
      });
      expect(result).toEqual(organisation);
    });

    it('should return null if organisation not found', async () => {
      const id = 'non-existent-id';

      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(id);

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find an organisation by name', async () => {
      const name = 'Test Organisation';
      const organisation = {
        id: 'org-id',
        name,
        establishments: [],
      } as OrganisationEntity;

      mockRepository.findOne.mockResolvedValue(organisation);

      const result = await service.findByName(name);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name },
        relations: ['establishments'],
      });
      expect(result).toEqual(organisation);
    });

    it('should return null if organisation not found', async () => {
      const name = 'Non-existent Organisation';

      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByName(name);

      expect(result).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true if organisation exists', async () => {
      const id = 'org-id';

      mockRepository.count.mockResolvedValue(1);

      const result = await service.exists(id);

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toBe(true);
    });

    it('should return false if organisation does not exist', async () => {
      const id = 'non-existent-id';

      mockRepository.count.mockResolvedValue(0);

      const result = await service.exists(id);

      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    it('should search organisations with filters', async () => {
      const params: OrganisationQueryParams = {
        name: 'Test',
      };
      const organisations = [
        {
          id: 'org-id-1',
          name: 'Test Organisation 1',
          establishments: [],
        },
        {
          id: 'org-id-2',
          name: 'Test Organisation 2',
          establishments: [],
        },
      ] as OrganisationEntity[];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([organisations, 2]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.search(params, 1, 10);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'organisation',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'organisation.establishments',
        'establishments',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'organisation.name ILIKE :name',
        { name: '%Test%' },
      );
      expect(result.data).toEqual(organisations);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should search organisations by ID', async () => {
      const params: OrganisationQueryParams = {
        id: 'org-id',
      };
      const organisations = [
        {
          id: 'org-id',
          name: 'Test Organisation',
          establishments: [],
        },
      ] as OrganisationEntity[];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([organisations, 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.search(params);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'organisation.id = :id',
        { id: 'org-id' },
      );
      expect(result.data).toEqual(organisations);
      expect(result.total).toBe(1);
    });
  });

  describe('update', () => {
    it('should update an organisation', async () => {
      const id = 'org-id';
      const request: UpdateOrganisationRequest = {
        name: 'Updated Organisation',
      };
      const existingOrg = {
        id,
        name: 'Test Organisation',
        establishments: [],
      } as OrganisationEntity;
      const updatedOrg = {
        ...existingOrg,
        name: request.name,
      } as OrganisationEntity;

      mockRepository.findOne
        .mockResolvedValueOnce(existingOrg) // getById
        .mockResolvedValueOnce(null); // findByName (no conflict)
      mockRepository.save.mockResolvedValue(updatedOrg);

      const result = await service.update(id, request);

      expect(mockRepository.save).toHaveBeenCalledWith(updatedOrg);
      expect(result.name).toBe(request.name);
    });

    it('should throw BadRequestException if new name conflicts', async () => {
      const id = 'org-id';
      const request: UpdateOrganisationRequest = {
        name: 'Existing Organisation',
      };
      const existingOrg = {
        id,
        name: 'Test Organisation',
        establishments: [],
      } as OrganisationEntity;
      const conflictingOrg = {
        id: 'other-id',
        name: 'Existing Organisation',
        establishments: [],
      } as OrganisationEntity;

      mockRepository.findOne
        .mockResolvedValueOnce(existingOrg) // getById
        .mockResolvedValueOnce(conflictingOrg); // findByName (conflict)

      try {
        await service.update(id, request);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe(
          'Organisation with name "Existing Organisation" already exists',
        );
      }
    });

    it('should not throw if name is unchanged', async () => {
      const id = 'org-id';
      const request: UpdateOrganisationRequest = {
        name: 'Test Organisation',
      };
      const existingOrg = {
        id,
        name: 'Test Organisation',
        establishments: [],
      } as OrganisationEntity;

      mockRepository.findOne.mockResolvedValueOnce(existingOrg); // getById
      mockRepository.save.mockResolvedValue(existingOrg);

      const result = await service.update(id, request);

      expect(mockRepository.save).toHaveBeenCalledWith(existingOrg);
      expect(result).toEqual(existingOrg);
    });
  });

  describe('delete', () => {
    it('should delete an organisation', async () => {
      const id = 'org-id';
      const organisation = {
        id,
        name: 'Test Organisation',
        establishments: [],
      } as OrganisationEntity;

      // getById calls findById, which calls findOne
      mockRepository.findOne.mockResolvedValue(organisation);
      mockRepository.remove.mockResolvedValue(organisation);

      await service.delete(id);

      // getById is called which uses findById, which calls findOne
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['establishments'],
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(organisation);
    });

    it('should throw NotFoundException if organisation not found', async () => {
      const id = 'non-existent-id';

      // getById calls findById, which returns null
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(id)).rejects.toThrow(NotFoundException);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });
});
