import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UserAccountService } from './user-account.service';
import { UserService } from './user.service';
import { OrganisationService } from './organisation.service';
import { EstablishmentService } from './establishment.service';
import { RoleService } from './role.service';
import {
  UserAccountEntity,
  UserEntity,
  OrganisationEntity,
  EstablishmentEntity,
  RoleEntity,
} from '../entities';
import {
  CreateUserAccountRequest,
  UpdateUserAccountRequest,
  UserAccountQueryParams,
} from '../types';

describe('UserAccountService', () => {
  let service: UserAccountService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserService = {
    getById: jest.fn(),
  };

  const mockOrganisationService = {
    getById: jest.fn(),
  };

  const mockEstablishmentService = {
    getById: jest.fn(),
  };

  const mockRoleService = {
    getAllByNames: jest.fn(),
  };

  const mockUser: UserEntity = {
    id: 'user-id',
    email: 'test@example.com',
    username: 'testuser',
    emailValidated: true,
    enabled: true,
    acceptedTerms: true,
    acceptedPrivacyPolicy: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    credentials: [],
    actions: [],
    userAccounts: [],
  } as UserEntity;

  const mockOrganisation: OrganisationEntity = {
    id: 'org-id',
    name: 'Test Organisation',
    establishments: [],
  } as OrganisationEntity;

  const mockEstablishment: EstablishmentEntity = {
    id: 'est-id',
    name: 'Test Establishment',
    organisation: mockOrganisation,
    userAccounts: [],
  } as EstablishmentEntity;

  const mockRoles: RoleEntity[] = [
    { id: 1, name: 'user' },
    { id: 2, name: 'admin' },
  ] as RoleEntity[];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAccountService,
        {
          provide: getRepositoryToken(UserAccountEntity),
          useValue: mockRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: OrganisationService,
          useValue: mockOrganisationService,
        },
        {
          provide: EstablishmentService,
          useValue: mockEstablishmentService,
        },
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
      ],
    }).compile();

    service = module.get<UserAccountService>(UserAccountService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user account', async () => {
      const request: CreateUserAccountRequest = {
        userId: 'user-id',
        organisationId: 'org-id',
        establishmentId: 'est-id',
        roles: ['user', 'admin'],
      };
      const createdUserAccount = {
        id: 'user-account-id',
        user: mockUser,
        organisation: mockOrganisation,
        establishment: mockEstablishment,
        roles: mockRoles,
      } as UserAccountEntity;

      mockUserService.getById.mockResolvedValue(mockUser);
      mockOrganisationService.getById.mockResolvedValue(mockOrganisation);
      mockEstablishmentService.getById.mockResolvedValue(mockEstablishment);
      mockRoleService.getAllByNames.mockResolvedValue(mockRoles);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdUserAccount);
      mockRepository.save.mockResolvedValue(createdUserAccount);

      const result = await service.create(request);

      expect(mockUserService.getById).toHaveBeenCalledWith('user-id');
      expect(mockOrganisationService.getById).toHaveBeenCalledWith('org-id');
      expect(mockEstablishmentService.getById).toHaveBeenCalledWith('est-id');
      expect(mockRoleService.getAllByNames).toHaveBeenCalledWith([
        'user',
        'admin',
      ]);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(createdUserAccount);
    });

    it('should throw BadRequestException if establishment does not belong to organisation', async () => {
      const request: CreateUserAccountRequest = {
        userId: 'user-id',
        organisationId: 'org-id',
        establishmentId: 'est-id',
      };
      const otherOrganisation = {
        id: 'other-org-id',
        name: 'Other Organisation',
        establishments: [],
      } as OrganisationEntity;
      const establishmentWithOtherOrg = {
        ...mockEstablishment,
        organisation: otherOrganisation,
      } as EstablishmentEntity;

      mockUserService.getById.mockResolvedValue(mockUser);
      mockOrganisationService.getById.mockResolvedValue(mockOrganisation);
      mockEstablishmentService.getById.mockResolvedValue(
        establishmentWithOtherOrg,
      );

      await expect(service.create(request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(request)).rejects.toThrow(
        'Establishment est-id does not belong to organisation org-id',
      );
    });

    it('should throw BadRequestException if user account already exists', async () => {
      const request: CreateUserAccountRequest = {
        userId: 'user-id',
        organisationId: 'org-id',
        establishmentId: 'est-id',
      };
      const existingUserAccount = {
        id: 'existing-user-account-id',
        user: mockUser,
        organisation: mockOrganisation,
        establishment: mockEstablishment,
        roles: [],
      } as UserAccountEntity;

      mockUserService.getById.mockResolvedValue(mockUser);
      mockOrganisationService.getById.mockResolvedValue(mockOrganisation);
      mockEstablishmentService.getById.mockResolvedValue(mockEstablishment);
      mockRepository.findOne.mockResolvedValue(existingUserAccount);

      await expect(service.create(request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(request)).rejects.toThrow(
        'User account already exists for this user in this organisation and establishment',
      );
    });
  });

  describe('getById', () => {
    it('should return a user account by ID', async () => {
      const id = 'user-account-id';
      const userAccount = {
        id,
        user: mockUser,
        organisation: mockOrganisation,
        establishment: mockEstablishment,
        roles: mockRoles,
      } as UserAccountEntity;

      mockRepository.findOne.mockResolvedValue(userAccount);

      const result = await service.getById(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['user', 'organisation', 'establishment', 'roles'],
      });
      expect(result).toEqual(userAccount);
    });

    it('should throw NotFoundException if user account not found', async () => {
      const id = 'non-existent-id';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getById(id)).rejects.toThrow(NotFoundException);
      await expect(service.getById(id)).rejects.toThrow(
        `User account with ID ${id} not found`,
      );
    });
  });

  describe('findById', () => {
    it('should find a user account by ID', async () => {
      const id = 'user-account-id';
      const userAccount = {
        id,
        user: mockUser,
        organisation: mockOrganisation,
        establishment: mockEstablishment,
        roles: mockRoles,
      } as UserAccountEntity;

      mockRepository.findOne.mockResolvedValue(userAccount);

      const result = await service.findById(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['user', 'organisation', 'establishment', 'roles'],
      });
      expect(result).toEqual(userAccount);
    });
  });

  describe('findByUserAndOrganisationAndEstablishment', () => {
    it('should find a user account by user, organisation and establishment', async () => {
      const userId = 'user-id';
      const organisationId = 'org-id';
      const establishmentId = 'est-id';
      const userAccount = {
        id: 'user-account-id',
        user: mockUser,
        organisation: mockOrganisation,
        establishment: mockEstablishment,
        roles: mockRoles,
      } as UserAccountEntity;

      mockRepository.findOne.mockResolvedValue(userAccount);

      const result = await service.findByUserAndOrganisationAndEstablishment(
        userId,
        organisationId,
        establishmentId,
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          user: { id: userId },
          organisation: { id: organisationId },
          establishment: { id: establishmentId },
        },
        relations: ['user', 'organisation', 'establishment', 'roles'],
      });
      expect(result).toEqual(userAccount);
    });
  });

  describe('search', () => {
    it('should search user accounts with filters', async () => {
      const params: UserAccountQueryParams = {
        userId: 'user-id',
      };
      const userAccounts = [
        {
          id: 'user-account-id',
          user: mockUser,
          organisation: mockOrganisation,
          establishment: mockEstablishment,
          roles: mockRoles,
        },
      ] as UserAccountEntity[];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([userAccounts, 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.search(params, 1, 10);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'userAccount',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.id = :userId',
        { userId: 'user-id' },
      );
      expect(result.data).toEqual(userAccounts);
      expect(result.total).toBe(1);
    });
  });

  describe('update', () => {
    it('should update a user account', async () => {
      const id = 'user-account-id';
      const request: UpdateUserAccountRequest = {
        roles: ['user'],
      };
      const existingUserAccount = {
        id,
        user: mockUser,
        organisation: mockOrganisation,
        establishment: mockEstablishment,
        roles: [],
      } as UserAccountEntity;
      const updatedRoles = [mockRoles[0]] as RoleEntity[];
      const updatedUserAccount = {
        ...existingUserAccount,
        roles: updatedRoles,
      } as UserAccountEntity;

      mockRepository.findOne.mockResolvedValue(existingUserAccount);
      mockRoleService.getAllByNames.mockResolvedValue(updatedRoles);
      mockRepository.save.mockResolvedValue(updatedUserAccount);

      const result = await service.update(id, request);

      expect(mockRoleService.getAllByNames).toHaveBeenCalledWith(['user']);
      expect(mockRepository.save).toHaveBeenCalledWith(updatedUserAccount);
      expect(result.roles).toEqual(updatedRoles);
    });

    it('should update organisation and establishment', async () => {
      const id = 'user-account-id';
      const newOrganisation = {
        id: 'new-org-id',
        name: 'New Organisation',
        establishments: [],
      } as OrganisationEntity;
      const newEstablishment = {
        id: 'new-est-id',
        name: 'New Establishment',
        organisation: newOrganisation,
        userAccounts: [],
      } as EstablishmentEntity;
      const request: UpdateUserAccountRequest = {
        organisationId: 'new-org-id',
        establishmentId: 'new-est-id',
      };
      const existingUserAccount = {
        id,
        user: mockUser,
        organisation: mockOrganisation,
        establishment: mockEstablishment,
        roles: [],
      } as UserAccountEntity;

      mockRepository.findOne.mockResolvedValue(existingUserAccount);
      mockOrganisationService.getById.mockResolvedValue(newOrganisation);
      mockEstablishmentService.getById.mockResolvedValue(newEstablishment);
      mockRepository.save.mockResolvedValue({
        ...existingUserAccount,
        organisation: newOrganisation,
        establishment: newEstablishment,
      } as UserAccountEntity);

      const result = await service.update(id, request);

      expect(result.organisation.id).toBe('new-org-id');
      expect(result.establishment.id).toBe('new-est-id');
    });
  });

  describe('delete', () => {
    it('should delete a user account', async () => {
      const id = 'user-account-id';
      const userAccount = {
        id,
        user: mockUser,
        organisation: mockOrganisation,
        establishment: mockEstablishment,
        roles: mockRoles,
      } as UserAccountEntity;

      mockRepository.findOne.mockResolvedValue(userAccount);
      mockRepository.remove.mockResolvedValue(userAccount);

      await service.delete(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['user', 'organisation', 'establishment', 'roles'],
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(userAccount);
    });

    it('should throw NotFoundException if user account not found', async () => {
      const id = 'non-existent-id';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(id)).rejects.toThrow(NotFoundException);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });
});
