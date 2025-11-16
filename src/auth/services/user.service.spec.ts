// Mock the mailer service before importing anything that uses it
jest.mock('@devlab-io/nest-mailer', () => {
  const MockMailerService = class MailerService {
    async send() {
      return Promise.resolve();
    }
  };
  return {
    MailerService: MockMailerService,
    MailerServiceToken: 'MailerServiceToken',
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { ActionTokenService } from './action-token.service';
import { RoleService } from './role.service';
import { UserEntity, RoleEntity, ActionTokenEntity } from '../entities';
import {
  ActionTokenType,
  InviteRequest,
  SignUpRequest,
  AcceptInvitationRequest,
  ResetPasswordRequest,
  ValidateEmailRequest,
  AcceptTermsRequest,
  AcceptPrivacyPolicyRequest,
  UserUpdateRequest,
} from '../types';
import { UserConfig, UserConfigToken } from '../config/user.config';
import { MailerServiceToken } from '@devlab-io/nest-mailer';
import * as bcrypt from 'bcryptjs';

describe('UserService', () => {
  let service: UserService;

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    exists: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockActionTokenService = {
    create: jest.fn(),
    validate: jest.fn(),
    revoke: jest.fn(),
  };

  const mockRoleService = {
    getAllByNames: jest.fn(),
  };

  const mockMailerService = {
    send: jest.fn(),
  };

  const mockUserConfig: UserConfig = {
    user: {
      canSignUp: true,
      defaultRoles: ['user'],
      actions: {
        invite: 48,
        validateEmail: 24,
        acceptTerms: 24,
        acceptPrivacyPolicy: 24,
        createPassword: 24,
        resetPassword: 24,
        changeEmail: 24,
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: ActionTokenService,
          useValue: mockActionTokenService,
        },
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
        {
          provide: MailerServiceToken,
          useValue: mockMailerService,
        },
        {
          provide: UserConfigToken,
          useValue: mockUserConfig,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  describe('getById', () => {
    it('should return user if found', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
      } as UserEntity;

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.getById('user-id');

      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        relations: ['roles', 'actionsTokens'],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getById('nonexistent')).rejects.toThrow(
        'User with id nonexistent not found',
      );
    });
  });

  describe('exists', () => {
    it('should return true if user exists', async () => {
      mockUserRepository.exists.mockResolvedValue(true);

      const result = await service.exists('test@example.com');

      expect(result).toBe(true);
      expect(mockUserRepository.exists).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return false if user does not exist', async () => {
      mockUserRepository.exists.mockResolvedValue(false);

      const result = await service.exists('test@example.com');

      expect(result).toBe(false);
    });
  });

  describe('sendInvitation', () => {
    it('should send invitation email', async () => {
      const invite: InviteRequest = {
        email: 'newuser@example.com',
        roles: ['admin'],
      };
      const actionToken = {
        token: 'invite-token',
        type: ActionTokenType.Invite,
        email: invite.email,
      } as ActionTokenEntity;

      mockUserRepository.exists.mockResolvedValue(false);
      mockActionTokenService.create.mockResolvedValue(actionToken);
      mockMailerService.send.mockResolvedValue(undefined);

      await service.sendInvitation(invite);

      expect(mockUserRepository.exists).toHaveBeenCalledWith({
        where: { email: invite.email.toLowerCase() },
      });
      expect(mockActionTokenService.create).toHaveBeenCalled();
      expect(mockMailerService.send).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user already exists', async () => {
      const invite: InviteRequest = {
        email: 'existing@example.com',
      };

      mockUserRepository.exists.mockResolvedValue(true);

      await expect(service.sendInvitation(invite)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.sendInvitation(invite)).rejects.toThrow(
        'A user with the same email already exists',
      );
    });
  });

  describe('acceptInvitation', () => {
    it('should create user from invitation', async () => {
      const request: AcceptInvitationRequest = {
        token: 'invite-token',
        email: 'newuser@example.com',
        password: 'password123',
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        firstName: 'John',
        lastName: 'Doe',
      };
      const roles = [{ id: 1, name: 'user' }] as RoleEntity[];
      const token = {
        token: request.token,
        type: ActionTokenType.Invite,
        email: request.email,
        roles: roles,
      } as ActionTokenEntity;
      const createdUser = {
        id: 'user-id',
        email: request.email.toLowerCase(),
        username: 'johndoe#123456',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'DOE',
        emailValidated: true,
        enabled: true,
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        roles: roles,
      } as UserEntity;

      mockActionTokenService.validate.mockResolvedValue(token);
      mockUserRepository.exists.mockResolvedValue(false);
      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);
      mockRoleService.getAllByNames.mockResolvedValue(roles);
      mockActionTokenService.revoke.mockResolvedValue(undefined);

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

      const result = await service.acceptInvitation(request);

      expect(mockActionTokenService.validate).toHaveBeenCalledWith(
        request.token,
        request.email,
        ActionTokenType.Invite,
      );
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockActionTokenService.revoke).toHaveBeenCalledWith(request.token);
      expect(result.email).toBe(request.email.toLowerCase());
    });
  });

  describe('signUp', () => {
    it('should create a new user', async () => {
      const request: SignUpRequest = {
        email: 'newuser@example.com',
        password: 'password123',
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        firstName: 'John',
        lastName: 'Doe',
      };
      const roles = [{ id: 1, name: 'user' }] as RoleEntity[];
      const createdUser = {
        id: 'user-id',
        email: request.email.toLowerCase(),
        username: 'johndoe#123456',
        password: 'hashed-password',
        emailValidated: false,
        enabled: true,
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        roles: roles,
      } as UserEntity;
      const actionToken = {
        token: 'validation-token',
        type: ActionTokenType.ValidateEmail,
      } as ActionTokenEntity;

      mockUserRepository.exists.mockResolvedValue(false);
      mockUserRepository.create.mockReturnValue(createdUser);
      // First save returns the created user, then getById is called which uses findOne
      mockUserRepository.save
        .mockResolvedValueOnce(createdUser)
        .mockResolvedValueOnce({ ...createdUser, emailValidated: false });
      // getById uses findOne with relations
      mockUserRepository.findOne.mockResolvedValue(createdUser);
      mockRoleService.getAllByNames.mockResolvedValue(roles);
      mockActionTokenService.create.mockResolvedValue(actionToken);
      mockMailerService.send.mockResolvedValue(undefined);

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

      const result = await service.signUp(request);

      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.emailValidated).toBe(false);
      expect(mockActionTokenService.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if terms not accepted', async () => {
      const request: SignUpRequest = {
        email: 'newuser@example.com',
        password: 'password123',
        acceptedTerms: false,
        acceptedPrivacyPolicy: true,
      };

      await expect(service.signUp(request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.signUp(request)).rejects.toThrow(
        'User must accept the terms and privacy policy',
      );
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      } as UserEntity;
      const request: UserUpdateRequest = {
        firstName: 'Jane',
        lastName: 'Smith',
      };
      const updatedUser = { ...user, ...request } as UserEntity;

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('user-id', request);

      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.firstName).toBe('Jane');
    });

    it('should update roles', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
      } as UserEntity;
      const roles = [{ id: 1, name: 'admin' }] as RoleEntity[];
      const request: UserUpdateRequest = {
        roles: ['admin'],
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockRoleService.getAllByNames.mockResolvedValue(roles);
      mockUserRepository.save.mockResolvedValue({
        ...user,
        roles,
      } as UserEntity);

      const result = await service.update('user-id', request);

      expect(mockRoleService.getAllByNames).toHaveBeenCalledWith(['admin']);
      expect(result.roles).toEqual(roles);
    });
  });

  describe('sendEmailValidation', () => {
    it('should send email validation token', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        emailValidated: true,
      } as UserEntity;
      const actionToken = {
        token: 'validation-token',
        type: ActionTokenType.ValidateEmail,
      } as ActionTokenEntity;

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue({
        ...user,
        emailValidated: false,
      } as UserEntity);
      mockActionTokenService.create.mockResolvedValue(actionToken);
      mockMailerService.send.mockResolvedValue(undefined);

      await service.sendEmailValidation('user-id');

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ emailValidated: false }),
      );
      expect(mockActionTokenService.create).toHaveBeenCalled();
      expect(mockMailerService.send).toHaveBeenCalled();
    });
  });

  describe('acceptEmailValidation', () => {
    it('should validate email', async () => {
      const request: ValidateEmailRequest = {
        token: 'validation-token',
        email: 'test@example.com',
      };
      const user = {
        id: 'user-id',
        email: request.email,
        emailValidated: false,
      } as UserEntity;
      const token = {
        token: request.token,
        type: ActionTokenType.ValidateEmail,
        email: request.email,
        user: user,
      } as ActionTokenEntity;

      mockActionTokenService.validate.mockResolvedValue(token);
      mockUserRepository.save.mockResolvedValue({
        ...user,
        emailValidated: true,
      } as UserEntity);
      mockActionTokenService.revoke.mockResolvedValue(undefined);

      await service.acceptEmailValidation(request);

      expect(mockActionTokenService.validate).toHaveBeenCalledWith(
        request.token,
        request.email,
        ActionTokenType.ValidateEmail,
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ emailValidated: true }),
      );
      expect(mockActionTokenService.revoke).toHaveBeenCalledWith(request.token);
    });
  });

  describe('sendResetPassword', () => {
    it('should send reset password email', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
      } as UserEntity;
      const actionToken = {
        token: 'reset-token',
        type: ActionTokenType.ResetPassword,
      } as ActionTokenEntity;

      mockUserRepository.findOne.mockResolvedValue(user);
      mockActionTokenService.create.mockResolvedValue(actionToken);
      mockMailerService.send.mockResolvedValue(undefined);

      await service.sendResetPassword('test@example.com');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockActionTokenService.create).toHaveBeenCalled();
      expect(mockMailerService.send).toHaveBeenCalled();
    });

    it('should return silently if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await service.sendResetPassword('nonexistent@example.com');

      expect(mockActionTokenService.create).not.toHaveBeenCalled();
    });
  });

  describe('acceptResetPassword', () => {
    it('should reset password', async () => {
      const request: ResetPasswordRequest = {
        token: 'reset-token',
        email: 'test@example.com',
        password: 'newpassword123',
      };
      const user = {
        id: 'user-id',
        email: request.email,
        password: 'old-password',
      } as UserEntity;
      const token = {
        token: request.token,
        type: ActionTokenType.ResetPassword,
        email: request.email,
        user: user,
      } as ActionTokenEntity;

      mockActionTokenService.validate.mockResolvedValue(token);
      mockUserRepository.save.mockResolvedValue({
        ...user,
        password: 'hashed-password',
      } as UserEntity);
      mockActionTokenService.revoke.mockResolvedValue(undefined);

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

      await service.acceptResetPassword(request);

      expect(mockActionTokenService.validate).toHaveBeenCalledWith(
        request.token,
        request.email,
        ActionTokenType.ResetPassword,
      );
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockActionTokenService.revoke).toHaveBeenCalledWith(request.token);
    });
  });

  describe('sendAcceptTerms', () => {
    it('should send accept terms email', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        acceptedTerms: true,
      } as UserEntity;
      const actionToken = {
        token: 'terms-token',
        type: ActionTokenType.AcceptTerms,
      } as ActionTokenEntity;

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue({
        ...user,
        acceptedTerms: false,
      } as UserEntity);
      mockActionTokenService.create.mockResolvedValue(actionToken);
      mockMailerService.send.mockResolvedValue(undefined);

      await service.sendAcceptTerms('user-id');

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ acceptedTerms: false }),
      );
      expect(mockActionTokenService.create).toHaveBeenCalled();
    });
  });

  describe('acceptAcceptTerms', () => {
    it('should accept terms', async () => {
      const request: AcceptTermsRequest = {
        token: 'terms-token',
        email: 'test@example.com',
        acceptedTerms: true,
      };
      const user = {
        id: 'user-id',
        email: request.email,
        acceptedTerms: false,
      } as UserEntity;
      const token = {
        token: request.token,
        type: ActionTokenType.AcceptTerms,
        email: request.email,
        user: user,
      } as ActionTokenEntity;

      mockActionTokenService.validate.mockResolvedValue(token);
      mockUserRepository.save.mockResolvedValue({
        ...user,
        acceptedTerms: true,
      } as UserEntity);
      mockActionTokenService.revoke.mockResolvedValue(undefined);

      await service.acceptAcceptTerms(request);

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ acceptedTerms: true }),
      );
      expect(mockActionTokenService.revoke).toHaveBeenCalledWith(request.token);
    });

    it('should throw BadRequestException if terms not accepted', async () => {
      const request: AcceptTermsRequest = {
        token: 'terms-token',
        email: 'test@example.com',
        acceptedTerms: false,
      };
      const user = {
        id: 'user-id',
        email: request.email,
      } as UserEntity;
      const token = {
        token: request.token,
        type: ActionTokenType.AcceptTerms,
        email: request.email,
        user: user,
      } as ActionTokenEntity;

      mockActionTokenService.validate.mockResolvedValue(token);

      await expect(service.acceptAcceptTerms(request)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.acceptAcceptTerms(request)).rejects.toThrow(
        'User must accept the terms',
      );
    });
  });

  describe('sendAcceptPrivacyPolicy', () => {
    it('should send accept privacy policy email', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        acceptedPrivacyPolicy: true,
      } as UserEntity;
      const actionToken = {
        token: 'privacy-token',
        type: ActionTokenType.AcceptPrivacyPolicy,
      } as ActionTokenEntity;

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue({
        ...user,
        acceptedPrivacyPolicy: false,
      } as UserEntity);
      mockActionTokenService.create.mockResolvedValue(actionToken);
      mockMailerService.send.mockResolvedValue(undefined);

      await service.sendAcceptPrivacyPolicy('user-id');

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ acceptedPrivacyPolicy: false }),
      );
    });
  });

  describe('acceptPrivacyPolicy', () => {
    it('should accept privacy policy', async () => {
      const request: AcceptPrivacyPolicyRequest = {
        token: 'privacy-token',
        email: 'test@example.com',
        acceptedPrivacyPolicy: true,
      };
      const user = {
        id: 'user-id',
        email: request.email,
        acceptedPrivacyPolicy: false,
      } as UserEntity;
      const token = {
        token: request.token,
        type: ActionTokenType.AcceptPrivacyPolicy,
        email: request.email,
        user: user,
      } as ActionTokenEntity;

      mockActionTokenService.validate.mockResolvedValue(token);
      mockUserRepository.save.mockResolvedValue({
        ...user,
        acceptedPrivacyPolicy: true,
      } as UserEntity);
      mockActionTokenService.revoke.mockResolvedValue(undefined);

      await service.acceptPrivacyPolicy(request);

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ acceptedPrivacyPolicy: true }),
      );
    });
  });

  describe('enable', () => {
    it('should enable user', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        enabled: false,
      } as UserEntity;

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue({
        ...user,
        enabled: true,
      } as UserEntity);

      const result = await service.enable('user-id');

      expect(result.enabled).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });

  describe('disable', () => {
    it('should disable user', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        enabled: true,
      } as UserEntity;

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue({
        ...user,
        enabled: false,
      } as UserEntity);

      const result = await service.disable('user-id');

      expect(result.enabled).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
      } as UserEntity;

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.remove.mockResolvedValue(user);

      await service.delete('user-id');

      expect(mockUserRepository.remove).toHaveBeenCalledWith(user);
    });
  });

  describe('sendActionToken', () => {
    it('should send action token with user', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
      } as UserEntity;
      const actionToken = {
        token: 'action-token',
        type: ActionTokenType.ValidateEmail,
      } as ActionTokenEntity;

      mockUserRepository.findOne.mockResolvedValue(user);
      mockActionTokenService.create.mockResolvedValue(actionToken);
      mockMailerService.send.mockResolvedValue(undefined);

      await service.sendActionToken({
        type: ActionTokenType.ValidateEmail,
        user: user,
      });

      expect(mockActionTokenService.create).toHaveBeenCalled();
      expect(mockMailerService.send).toHaveBeenCalled();
    });

    it('should send action token with email', async () => {
      const actionToken = {
        token: 'action-token',
        type: ActionTokenType.Invite,
      } as ActionTokenEntity;

      mockActionTokenService.create.mockResolvedValue(actionToken);
      mockMailerService.send.mockResolvedValue(undefined);

      await service.sendActionToken({
        type: ActionTokenType.Invite,
        email: 'test@example.com',
      });

      expect(mockActionTokenService.create).toHaveBeenCalled();
      expect(mockMailerService.send).toHaveBeenCalled();
    });

    it('should throw BadRequestException if neither email nor user provided', async () => {
      await expect(
        service.sendActionToken({
          type: ActionTokenType.Invite,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
