import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult } from 'typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ActionService } from './action.service';
import { ActionEntity, RoleEntity, UserEntity } from '../entities';
import { ActionType, CreateActionRequest } from '@devlab-io/nest-auth-types';

describe('ActionService', () => {
  let service: ActionService;

  const mockActionTokenRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockRoleRepository = {
    find: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionService,
        {
          provide: getRepositoryToken(ActionEntity),
          useValue: mockActionTokenRepository,
        },
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: mockRoleRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<ActionService>(ActionService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an invite token with email', async () => {
      const request: CreateActionRequest = {
        type: ActionType.Invite,
        email: 'test@example.com',
        expiresIn: 24,
      };
      const token = 'generated-token';
      const email = request.email!;
      const createdToken = {
        token,
        type: request.type,
        email: email.toLowerCase(),
        expiresAt: expect.any(Date),
      } as ActionEntity;

      mockActionTokenRepository.findOne.mockResolvedValue(null);
      mockActionTokenRepository.create.mockReturnValue(createdToken);
      mockActionTokenRepository.save.mockResolvedValue(createdToken);

      const result = await service.create(request);

      expect(mockActionTokenRepository.findOne).toHaveBeenCalled();
      expect(mockActionTokenRepository.create).toHaveBeenCalled();
      expect(mockActionTokenRepository.save).toHaveBeenCalled();
      expect(result.email).toBe(email.toLowerCase());
    });

    it('should create a token with user', async () => {
      const user = {
        id: 'user-id',
        email: 'user@example.com',
      } as UserEntity;
      const request: CreateActionRequest = {
        type: ActionType.ResetPassword,
        user: user,
      };
      const token = 'generated-token';
      const createdToken = {
        token,
        type: request.type,
        email: user.email.toLowerCase(),
        user: user,
      } as ActionEntity;

      mockActionTokenRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(user);
      mockActionTokenRepository.create.mockReturnValue(createdToken);
      mockActionTokenRepository.save.mockResolvedValue(createdToken);

      const result = await service.create(request);

      expect(mockActionTokenRepository.findOne).toHaveBeenCalled();
      expect(mockUserRepository.findOne).toHaveBeenCalled();
      expect(mockActionTokenRepository.create).toHaveBeenCalled();
      expect(mockActionTokenRepository.save).toHaveBeenCalled();
      expect(result.email).toBe(user.email.toLowerCase());
    });

    it('should create an invite token with organisationId and establishmentId', async () => {
      const request: CreateActionRequest = {
        type: ActionType.Invite,
        email: 'test@example.com',
        expiresIn: 24,
        organisationId: 'org-id',
        establishmentId: 'est-id',
      };
      const token = 'generated-token';
      const email = request.email!;
      const createdToken = {
        token,
        type: request.type,
        email: email.toLowerCase(),
        expiresAt: expect.any(Date),
        organisationId: 'org-id',
        establishmentId: 'est-id',
      } as ActionEntity;

      mockActionTokenRepository.findOne.mockResolvedValue(null);
      mockActionTokenRepository.create.mockReturnValue(createdToken);
      mockActionTokenRepository.save.mockResolvedValue(createdToken);

      const result = await service.create(request);

      expect(mockActionTokenRepository.findOne).toHaveBeenCalled();
      expect(mockActionTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organisationId: 'org-id',
          establishmentId: 'est-id',
        }),
      );
      expect(mockActionTokenRepository.save).toHaveBeenCalled();
      expect(result.email).toBe(email.toLowerCase());
      expect(result.organisationId).toBe('org-id');
      expect(result.establishmentId).toBe('est-id');
    });

    it('should create a token with user', async () => {
      const testUser = {
        id: 'user-id',
        email: 'user@example.com',
      } as UserEntity;
      const request: CreateActionRequest = {
        type: ActionType.ResetPassword,
        user: testUser,
      };
      const token = 'generated-token';
      const createdToken = {
        token,
        type: request.type,
        email: testUser.email.toLowerCase(),
        user: testUser,
      } as ActionEntity;

      mockActionTokenRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(testUser);
      mockActionTokenRepository.create.mockReturnValue(createdToken);
      mockActionTokenRepository.save.mockResolvedValue(createdToken);

      const result = await service.create(request);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: testUser.id },
      });
      expect(result.user).toEqual(testUser);
    });

    it('should create a token with roles', async () => {
      const roles = [
        { id: 1, name: 'admin' },
        { id: 2, name: 'user' },
      ] as RoleEntity[];
      const request: CreateActionRequest = {
        type: ActionType.Invite,
        email: 'test@example.com',
        roles: ['admin', 'user'],
      };
      const token = 'generated-token';
      const email = request.email!;
      const createdToken = {
        token,
        type: request.type,
        email: email.toLowerCase(),
        roles: roles,
      } as ActionEntity;

      mockActionTokenRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.find.mockResolvedValue(roles);
      mockActionTokenRepository.create.mockReturnValue(createdToken);
      mockActionTokenRepository.save.mockResolvedValue(createdToken);

      const result = await service.create(request);

      expect(mockRoleRepository.find).toHaveBeenCalled();
      expect(result.roles).toEqual(roles);
    });

    it('should throw BadRequestException if neither email nor user provided', async () => {
      const request: CreateActionRequest = {
        type: ActionType.Invite,
      };

      await expect(service.create(request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(request)).rejects.toThrow(
        'An email is required for any action token',
      );
    });

    it('should throw BadRequestException if user-requiring action without user', async () => {
      const request: CreateActionRequest = {
        type: ActionType.ResetPassword,
        email: 'test@example.com',
      };

      await expect(service.create(request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(request)).rejects.toThrow(
        'A user is required for this action token type',
      );
    });

    it('should throw BadRequestException if invite combined with user-requiring actions', async () => {
      const request: CreateActionRequest = {
        type: ActionType.Invite | ActionType.ResetPassword,
        email: 'test@example.com',
        user: { id: 'user-id', email: 'test@example.com' } as UserEntity,
      };

      await expect(service.create(request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(request)).rejects.toThrow(
        'Invite action cannot be combined with actions requiring an existing user',
      );
    });

    it('should throw BadRequestException if roles not found', async () => {
      const request: CreateActionRequest = {
        type: ActionType.Invite,
        email: 'test@example.com',
        roles: ['admin', 'nonexistent'],
      };

      mockActionTokenRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.find.mockResolvedValue([
        { id: 1, name: 'admin' },
      ] as RoleEntity[]);

      await expect(service.create(request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(request)).rejects.toThrow(
        'One or more roles not found',
      );
    });

    it('should throw BadRequestException if user not found', async () => {
      const user = { id: 'user-id' } as UserEntity;
      const request: CreateActionRequest = {
        type: ActionType.ResetPassword,
        user: user,
      };

      mockActionTokenRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.create(request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(request)).rejects.toThrow(
        `User with id ${user.id} not found`,
      );
    });

    it('should calculate expiration date from expiresIn', async () => {
      const request: CreateActionRequest = {
        type: ActionType.Invite,
        email: 'test@example.com',
        expiresIn: 24,
      };
      const token = 'generated-token';
      const email = request.email!;
      const before = new Date();
      const expiresAt = new Date(before.getTime() + 24 * 60 * 60 * 1000);
      const createdToken = {
        token,
        type: request.type,
        email: email.toLowerCase(),
        expiresAt: expiresAt,
      } as ActionEntity;

      mockActionTokenRepository.findOne.mockResolvedValue(null);
      mockActionTokenRepository.create.mockReturnValue(createdToken);
      mockActionTokenRepository.save.mockResolvedValue(createdToken);

      const result = await service.create(request);
      const after = new Date();

      expect(result.expiresAt).toBeDefined();
      if (result.expiresAt) {
        const expectedTime = before.getTime() + 24 * 60 * 60 * 1000;
        expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(
          expectedTime - 1000,
        );
        expect(result.expiresAt.getTime()).toBeLessThanOrEqual(
          after.getTime() + 24 * 60 * 60 * 1000,
        );
      }
    });
  });

  describe('findByToken', () => {
    it('should return token if found', async () => {
      const token = 'test-token';
      const actionToken = {
        token,
        type: ActionType.Invite,
        email: 'test@example.com',
      } as ActionEntity;

      mockActionTokenRepository.findOne.mockResolvedValue(actionToken);

      const result = await service.findByToken(token);

      expect(mockActionTokenRepository.findOne).toHaveBeenCalledWith({
        where: { token },
        relations: ['user', 'roles'],
      });
      expect(result).toEqual(actionToken);
    });

    it('should return null if token not found', async () => {
      mockActionTokenRepository.findOne.mockResolvedValue(null);

      const result = await service.findByToken('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated tokens', async () => {
      const tokens = [
        { token: 'token1', type: ActionType.Invite },
        { token: 'token2', type: ActionType.ValidateEmail },
      ] as ActionEntity[];
      const total = 2;

      mockActionTokenRepository.findAndCount.mockResolvedValue([tokens, total]);

      const result = await service.findAll({}, 1, 10);

      expect(result.contents).toEqual(tokens);
      expect(result.total).toBe(total);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
    });

    it('should filter by type', async () => {
      const tokens = [
        { token: 'token1', type: ActionType.Invite },
      ] as ActionEntity[];

      mockActionTokenRepository.findAndCount.mockResolvedValue([tokens, 1]);

      const result = await service.findAll({ type: ActionType.Invite }, 1, 10);

      expect(mockActionTokenRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: ActionType.Invite }),
        }),
      );
      expect(result.contents).toEqual(tokens);
    });
  });

  describe('validate', () => {
    it('should return token if valid', async () => {
      const token = 'valid-token';
      const email = 'test@example.com';
      const actionToken = {
        token,
        type: ActionType.Invite,
        email: email.toLowerCase(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      } as ActionEntity;

      mockActionTokenRepository.findOne.mockResolvedValue(actionToken);

      const result = await service.validate(
        { token, email },
        ActionType.Invite,
      );

      expect(result).toEqual(actionToken);
    });

    it('should throw ForbiddenException if token not found', async () => {
      mockActionTokenRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validate(
          { token: 'invalid-token', email: 'test@example.com' },
          ActionType.Invite,
        ),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.validate(
          { token: 'invalid-token', email: 'test@example.com' },
          ActionType.Invite,
        ),
      ).rejects.toThrow('Invalid action token');
    });

    it('should throw ForbiddenException if email does not match', async () => {
      const actionToken = {
        token: 'valid-token',
        type: ActionType.Invite,
        email: 'other@example.com',
      } as ActionEntity;

      mockActionTokenRepository.findOne.mockResolvedValue(actionToken);

      await expect(
        service.validate(
          { token: 'valid-token', email: 'test@example.com' },
          ActionType.Invite,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if token does not contain required actions', async () => {
      const actionToken = {
        token: 'valid-token',
        type: ActionType.Invite,
        email: 'test@example.com',
      } as ActionEntity;

      mockActionTokenRepository.findOne.mockResolvedValue(actionToken);

      await expect(
        service.validate(
          { token: 'valid-token', email: 'test@example.com' },
          ActionType.ValidateEmail,
        ),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.validate(
          { token: 'valid-token', email: 'test@example.com' },
          ActionType.ValidateEmail,
        ),
      ).rejects.toThrow('Token does not contain all required actions');
    });

    it('should throw ForbiddenException and delete token if expired', async () => {
      const actionToken = {
        token: 'expired-token',
        type: ActionType.Invite,
        email: 'test@example.com',
        expiresAt: new Date(Date.now() - 1000),
      } as ActionEntity;

      mockActionTokenRepository.findOne.mockResolvedValue(actionToken);
      mockActionTokenRepository.remove.mockResolvedValue(actionToken);

      await expect(
        service.validate(
          { token: 'expired-token', email: 'test@example.com' },
          ActionType.Invite,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockActionTokenRepository.remove).toHaveBeenCalledWith(
        actionToken,
      );
    });
  });

  describe('revoke', () => {
    it('should delete token', async () => {
      const token = 'token-to-revoke';
      const actionToken = {
        token,
        type: ActionType.Invite,
      } as ActionEntity;

      mockActionTokenRepository.findOne.mockResolvedValue(actionToken);
      mockActionTokenRepository.remove.mockResolvedValue(actionToken);

      await service.revoke(token);

      expect(mockActionTokenRepository.findOne).toHaveBeenCalledWith({
        where: { token },
      });
      expect(mockActionTokenRepository.remove).toHaveBeenCalledWith(
        actionToken,
      );
    });

    it('should throw NotFoundException if token not found', async () => {
      mockActionTokenRepository.findOne.mockResolvedValue(null);

      await expect(service.revoke('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.revoke('nonexistent')).rejects.toThrow(
        'Action token with token nonexistent not found',
      );
    });
  });

  describe('purge', () => {
    it('should delete expired tokens', async () => {
      const deleteResult: DeleteResult = {
        affected: 5,
        raw: [],
      };

      mockActionTokenRepository.delete.mockResolvedValue(deleteResult);

      await service.purge();

      expect(mockActionTokenRepository.delete).toHaveBeenCalledWith({
        expiresAt: expect.any(Object),
      });
    });
  });
});
