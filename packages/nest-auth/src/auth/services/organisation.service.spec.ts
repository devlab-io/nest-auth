import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DefaultOrganisationService } from './organisation.service';
import { ScopeService } from './scope.service';
import { OrganisationEntity } from '../entities';
import {
  CreateOrganisationRequest,
  UpdateOrganisationRequest,
  OrganisationQueryParams,
} from '@devlab-io/nest-auth-types';

describe('OrganisationService', () => {
  let service: DefaultOrganisationService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockScopeService = {
    getScopeFromRequest: jest.fn().mockReturnValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DefaultOrganisationService,
        {
          provide: getRepositoryToken(OrganisationEntity),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ScopeService,
          useValue: mockScopeService,
        },
      ],
    }).compile();

    service = module.get<DefaultOrganisationService>(
      DefaultOrganisationService,
    );
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
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as OrganisationEntity;

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockRepository.create.mockReturnValue(createdOrg);
      mockRepository.save.mockResolvedValue(createdOrg);

      const result = await service.create(request);

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

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingOrg),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

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
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as OrganisationEntity;

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(organisation),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getById(id);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'organisation',
      );
      expect(result).toEqual(organisation);
    });

    it('should throw NotFoundException if organisation not found', async () => {
      const id = 'non-existent-id';

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

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
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as OrganisationEntity;

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(organisation),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findById(id);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'organisation',
      );
      expect(result).toEqual(organisation);
    });

    it('should return null if organisation not found', async () => {
      const id = 'non-existent-id';

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

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
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as OrganisationEntity;

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(organisation),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByName(name);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'organisation',
      );
      expect(result).toEqual(organisation);
    });

    it('should return null if organisation not found', async () => {
      const name = 'Non-existent Organisation';

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByName(name);

      expect(result).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true if organisation exists', async () => {
      const id = 'org-id';

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.exists(id);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'organisation',
      );
      expect(result).toBe(true);
    });

    it('should return false if organisation does not exist', async () => {
      const id = 'non-existent-id';

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

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
          createdAt: new Date(),
          updatedAt: new Date(),
          enabled: true,
        },
        {
          id: 'org-id-2',
          name: 'Test Organisation 2',
          establishments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          enabled: true,
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
      expect(result.contents).toEqual(organisations);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
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
          createdAt: new Date(),
          updatedAt: new Date(),
          enabled: true,
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
      expect(result.contents).toEqual(organisations);
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
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as OrganisationEntity;
      const updatedOrg = {
        ...existingOrg,
        name: request.name,
      } as OrganisationEntity;

      let callCount = 0;
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) return Promise.resolve(existingOrg);
          return Promise.resolve(null);
        }),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockRepository.save.mockResolvedValue(updatedOrg);

      const result = await service.update(id, request);

      expect(mockRepository.save).toHaveBeenCalled();
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
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as OrganisationEntity;
      const conflictingOrg = {
        id: 'other-id',
        name: 'Existing Organisation',
        establishments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as OrganisationEntity;

      let callCount = 0;
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) return Promise.resolve(existingOrg);
          return Promise.resolve(conflictingOrg);
        }),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

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
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as OrganisationEntity;

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingOrg),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
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
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled: true,
      } as OrganisationEntity;

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(organisation),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockRepository.remove.mockResolvedValue(organisation);

      await service.delete(id);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'organisation',
      );
      expect(mockRepository.remove).toHaveBeenCalledWith(organisation);
    });

    it('should throw NotFoundException if organisation not found', async () => {
      const id = 'non-existent-id';

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.delete(id)).rejects.toThrow(NotFoundException);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });
});
