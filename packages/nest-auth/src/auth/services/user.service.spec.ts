import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DefaultUserService } from './user.service';
import { CredentialService } from './credential.service';
import { ActionService } from './action.service';
import { ScopeService } from './scope.service';
import { JwtService } from './jwt.service';
import { UserEntity, UserAccountEntity } from '../entities';
import { DataSource } from 'typeorm';
import {
  CreateUserRequest,
  PatchUserRequest,
  UpdateUserRequest,
  UserQueryParams,
} from '@devlab-io/nest-auth-types';
import { UserConfig, UserConfigToken } from '../config/user.config';

describe('UserService', () => {
  let service: DefaultUserService;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    exists: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserAccountRepository = {
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  let mockCredentialService: {
    createPasswordCredential: jest.Mock;
    createGoogleCredential: jest.Mock;
    setPasswordCredential: jest.Mock;
  };

  const mockActionService = {
    create: jest.fn(),
  };

  const mockScopeService = {
    getScopeFromRequest: jest.fn().mockReturnValue(null),
  };

  const mockJwtService = {};

  const mockUserConfig: UserConfig = {
    user: {
      canSignUp: true,
      defaultRoles: ['user'],
    },
  };

  // Helper function to create a complete mock UserEntity
  const createMockUser = (overrides: Partial<UserEntity> = {}): UserEntity => {
    const now = new Date();
    return {
      id: 'user-id',
      email: 'test@example.com',
      username: 'testuser#123456',
      emailValidated: false,
      enabled: true,
      acceptedTerms: true,
      acceptedPrivacyPolicy: true,
      createdAt: now,
      updatedAt: now,
      credentials: [],
      actions: [],
      accounts: [],
      ...overrides,
    } as UserEntity;
  };

  beforeEach(async () => {
    mockCredentialService = {
      createPasswordCredential: jest.fn().mockResolvedValue(undefined),
      createGoogleCredential: jest.fn().mockResolvedValue(undefined),
      setPasswordCredential: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DefaultUserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserAccountEntity),
          useValue: mockUserAccountRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: CredentialService,
          useValue: mockCredentialService,
        },
        {
          provide: ActionService,
          useValue: mockActionService,
        },
        {
          provide: ScopeService,
          useValue: mockScopeService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UserConfigToken,
          useValue: mockUserConfig,
        },
      ],
    }).compile();

    service = module.get<DefaultUserService>(DefaultUserService);
  });

  describe('create', () => {
    it('should create a new user with generated username and credentials', async () => {
      const request: CreateUserRequest = {
        email: 'test@example.com',
        credentials: [{ type: 'password', password: 'password123' }],
        firstName: 'John',
        lastName: 'Doe',
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        enabled: true,
      };

      const generatedUsername = 'johndoe#123456';
      const createdUser = createMockUser({
        id: 'user-id',
        email: 'test@example.com',
        username: generatedUsername,
        firstName: 'John',
        lastName: 'DOE',
      });

      mockUserRepository.exists.mockResolvedValue(false);
      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);
      mockCredentialService.createPasswordCredential.mockResolvedValue(
        undefined,
      );

      const result = await service.create(request);

      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(
        mockCredentialService.createPasswordCredential,
      ).toHaveBeenCalledWith('user-id', 'password123');
      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('DOE');
    });

    it('should create user with provided username', async () => {
      const request: CreateUserRequest = {
        email: 'test@example.com',
        credentials: [{ type: 'password', password: 'password123' }],
        username: 'johndoe',
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        enabled: true,
      };

      const generatedUsername = 'johndoe#123456';
      const createdUser = createMockUser({
        id: 'user-id',
        email: 'test@example.com',
        username: generatedUsername,
      });

      mockUserRepository.exists.mockResolvedValue(false);
      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);
      mockCredentialService.createPasswordCredential.mockResolvedValue(
        undefined,
      );

      await service.create(request);

      expect(mockUserRepository.exists).toHaveBeenCalled();
    });

    it('should normalize email to lowercase', async () => {
      const request: CreateUserRequest = {
        email: 'TEST@EXAMPLE.COM',
        credentials: [{ type: 'password', password: 'password123' }],
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        enabled: true,
      };

      const createdUser = createMockUser({
        id: 'user-id',
        email: 'test@example.com',
        username: 'testexamplecom#123456',
      });

      mockUserRepository.exists.mockResolvedValue(false);
      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);
      mockCredentialService.createPasswordCredential.mockResolvedValue(
        undefined,
      );

      const result = await service.create(request);

      expect(result.email).toBe('test@example.com');
    });

    it('should capitalize firstName and uppercase lastName', async () => {
      const request: CreateUserRequest = {
        email: 'test@example.com',
        credentials: [{ type: 'password', password: 'password123' }],
        firstName: 'john',
        lastName: 'doe',
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        enabled: true,
      };

      const createdUser = createMockUser({
        id: 'user-id',
        email: 'test@example.com',
        username: 'johndoe#123456',
        firstName: 'John',
        lastName: 'DOE',
      });

      mockUserRepository.exists.mockResolvedValue(false);
      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);
      mockCredentialService.createPasswordCredential.mockResolvedValue(
        undefined,
      );

      const result = await service.create(request);

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('DOE');
    });

    it('should throw BadRequestException if unable to generate unique username', async () => {
      const request: CreateUserRequest = {
        email: 'test@example.com',
        credentials: [{ type: 'password', password: 'password123' }],
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        enabled: true,
      };

      mockUserRepository.exists.mockResolvedValue(true); // Always exists

      await expect(service.create(request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(request)).rejects.toThrow(
        'Unable to generate a unique username',
      );
    });
  });

  describe('patch', () => {
    it('should patch user fields', async () => {
      const userId = 'user-id';
      const existingUser = createMockUser({
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'DOE',
        phone: '1234567890',
        profilePicture: 'old-picture.jpg',
      });

      const request: PatchUserRequest = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '9876543210',
        profilePicture: 'new-picture.jpg',
      };

      const updatedUser = {
        ...existingUser,
        ...request,
        firstName: 'Jane',
        lastName: 'SMITH',
        phone: '9876543210',
      } as UserEntity;

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingUser),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.patch(userId, request);

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledWith(
        'user',
      );
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('SMITH');
      expect(result.phone).toBe('9876543210');
    });

    it('should throw NotFoundException if user not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(
        service.patch('nonexistent-id', { firstName: 'John' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update all user fields', async () => {
      const userId = 'user-id';
      const existingUser = createMockUser({
        id: userId,
        email: 'old@example.com',
        username: 'olduser#123456',
        firstName: 'John',
        lastName: 'DOE',
        enabled: true,
        acceptedTerms: false,
        acceptedPrivacyPolicy: false,
      });

      const request: UpdateUserRequest = {
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        credentials: [{ type: 'password', password: 'newPassword' }],
        enabled: false,
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
      };

      const updatedUser = {
        ...existingUser,
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'SMITH',
        enabled: false,
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
      } as UserEntity;

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingUser),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockUserRepository.exists.mockResolvedValue(false);
      mockUserRepository.save.mockResolvedValue(updatedUser);
      mockCredentialService.setPasswordCredential.mockResolvedValue(undefined);

      const result = await service.update(userId, request);

      expect(mockCredentialService.setPasswordCredential).toHaveBeenCalledWith(
        userId,
        'newPassword',
      );
      expect(result.email).toBe('new@example.com');
      expect(result.firstName).toBe('Jane');
      expect(result.enabled).toBe(false);
      expect(result.acceptedTerms).toBe(true);
    });

    it('should throw NotFoundException if user not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(
        service.update('nonexistent-id', { email: 'new@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should return paginated users', async () => {
      const users = [
        {
          id: 'user1',
          email: 'user1@example.com',
          username: 'user1#123456',
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          username: 'user2#123456',
        },
      ] as UserEntity[];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([users, 2]),
      };

      mockUserRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.search({}, 1, 10);

      expect(result.contents).toEqual(users);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
    });

    it('should filter by email', async () => {
      const users = [
        {
          id: 'user1',
          email: 'test@example.com',
        },
      ] as UserEntity[];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([users, 1]),
      };

      mockUserRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const params: UserQueryParams = { email: 'test' };
      await service.search(params, 1, 10);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.email ILIKE :email',
        { email: '%test%' },
      );
    });

    it('should filter by roles', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockUserRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const user = createMockUser();

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByEmail('test@example.com');

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledWith(
        'user',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'user.email = :email',
        { email: 'test@example.com' },
      );
      expect(result).toEqual(user);
    });

    it('should normalize email to lowercase', async () => {
      const user = createMockUser();

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findByEmail('TEST@EXAMPLE.COM');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'user.email = :email',
        { email: 'test@example.com' },
      );
    });

    it('should return null if user not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      const user = createMockUser();

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findById('user-id');

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledWith(
        'user',
      );
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      const user = createMockUser();

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getById('user-id');

      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.getById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getById('nonexistent-id')).rejects.toThrow(
        'User with id nonexistent-id not found',
      );
    });
  });

  describe('exists', () => {
    it('should return true if user exists', async () => {
      mockUserRepository.exists.mockResolvedValue(true);

      const result = await service.exists('test@example.com');

      expect(mockUserRepository.exists).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toBe(true);
    });

    it('should return false if user does not exist', async () => {
      mockUserRepository.exists.mockResolvedValue(false);

      const result = await service.exists('nonexistent@example.com');

      expect(result).toBe(false);
    });

    it('should normalize email to lowercase', async () => {
      mockUserRepository.exists.mockResolvedValue(false);

      await service.exists('TEST@EXAMPLE.COM');

      expect(mockUserRepository.exists).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('enable', () => {
    it('should enable a user', async () => {
      const user = createMockUser({ enabled: false });
      const enabledUser = createMockUser({ enabled: true });

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockUserRepository.save.mockResolvedValue(enabledUser);

      const result = await service.enable('user-id');

      expect(result.enabled).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true }),
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.enable('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('disable', () => {
    it('should disable a user and all associated user accounts', async () => {
      const user = createMockUser({ enabled: true });
      const disabledUser = createMockUser({ enabled: false });
      const userAccounts = [
        {
          id: 'account-1',
          enabled: true,
          user: { id: 'user-id' },
        },
        {
          id: 'account-2',
          enabled: true,
          user: { id: 'user-id' },
        },
      ] as UserAccountEntity[];

      // Mock for getById call before transaction
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const mockManager = {
        findOne: jest.fn(),
        find: jest.fn(),
        save: jest.fn(),
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      mockManager.findOne.mockResolvedValue(user);
      mockManager.save
        .mockResolvedValueOnce(disabledUser)
        .mockResolvedValueOnce(userAccounts);
      mockManager.find.mockResolvedValue(userAccounts);

      const result = await service.disable('user-id');

      expect(result.enabled).toBe(false);
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalledTimes(2);
      expect(mockManager.save).toHaveBeenCalledWith(
        UserEntity,
        expect.objectContaining({ enabled: false }),
      );
      expect(mockManager.save).toHaveBeenCalledWith(
        UserAccountEntity,
        expect.arrayContaining([
          expect.objectContaining({ enabled: false }),
          expect.objectContaining({ enabled: false }),
        ]),
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      // Mock for getById - returns null
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.disable('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const user = createMockUser();

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockUserRepository.remove.mockResolvedValue(user);

      await service.delete('user-id');

      expect(mockUserRepository.remove).toHaveBeenCalledWith(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.delete('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
