import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { ActionTokenService } from './action-token.service';
import { JwtService } from './jwt.service';
import { MailerService, MailerServiceToken } from '@devlab-io/nest-mailer';
import { UserConfig, UserConfigToken } from '../config/user.config';
import { ActionConfig, ActionConfigToken } from '../config/action.config';
import { UserEntity, ActionTokenEntity } from '../entities';
import {
  ActionTokenType,
  InviteRequest,
  SignUpRequest,
  SignInRequest,
  AcceptInvitationRequest,
  ValidateEmailRequest,
  CreatePasswordRequest,
  ResetPasswordRequest,
  AcceptTermsRequest,
  AcceptPrivacyPolicyRequest,
  JwtToken,
} from '../types';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let actionTokenService: jest.Mocked<ActionTokenService>;
  let jwtService: jest.Mocked<JwtService>;
  let mailerService: jest.Mocked<MailerService>;

  const mockUserConfig: UserConfig = {
    user: {
      canSignUp: true,
      defaultRoles: ['user'],
    },
  };

  const mockActionConfig: ActionConfig = {
    invite: { validity: 24, route: 'auth/accept-invitation' },
    validateEmail: { validity: 24, route: 'auth/validate-email' },
    acceptTerms: { validity: 24, route: 'auth/accept-terms' },
    acceptPrivacyPolicy: { validity: 24, route: 'auth/accept-privacy-policy' },
    createPassword: { validity: 24, route: 'auth/create-password' },
    resetPassword: { validity: 24, route: 'auth/reset-password' },
    changeEmail: { validity: 24, route: 'auth/change-email' },
  };

  const mockUser: UserEntity = {
    id: 'user-id',
    email: 'test@example.com',
    username: 'testuser#123',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    emailValidated: false,
    acceptedTerms: false,
    acceptedPrivacyPolicy: false,
    enabled: true,
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    actionsTokens: [],
    sessions: [],
  } as UserEntity;

  const mockActionToken: ActionTokenEntity = {
    token: 'action-token-123',
    type: ActionTokenType.Invite,
    email: 'test@example.com',
    createdAt: new Date(),
    user: mockUser,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  } as ActionTokenEntity;

  const mockJwtToken: JwtToken = {
    accessToken: 'access-token',
    expiresIn: '3600',
  };

  beforeEach(async () => {
    const mockUserService = {
      exists: jest.fn(),
      create: jest.fn(),
      getById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
    };

    const mockActionTokenService = {
      create: jest.fn(),
      validate: jest.fn(),
      revoke: jest.fn(),
    };

    const mockJwtService = {
      authenticate: jest.fn(),
      logout: jest.fn(),
    };

    const mockMailerService = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ActionTokenService,
          useValue: mockActionTokenService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailerServiceToken,
          useValue: mockMailerService,
        },
        {
          provide: UserConfigToken,
          useValue: mockUserConfig,
        },
        {
          provide: ActionConfigToken,
          useValue: mockActionConfig,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    actionTokenService = module.get(ActionTokenService);
    jwtService = module.get(JwtService);
    mailerService = module.get(MailerServiceToken);

    jest.clearAllMocks();
  });

  describe('sendActionToken', () => {
    const frontendUrl = 'https://example.com';

    it('should throw BadRequestException if frontendUrl is missing', async () => {
      const request: any = {
        type: ActionTokenType.Invite,
        email: 'test@example.com',
      };

      await expect(service.sendActionToken(request, '')).rejects.toThrow(
        BadRequestException,
      );

      await expect(
        service.sendActionToken(request, null as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if neither email nor user is provided', async () => {
      const request: any = {
        type: ActionTokenType.Invite,
      };

      await expect(
        service.sendActionToken(request, frontendUrl),
      ).rejects.toThrow(BadRequestException);
    });

    it('should send action token email with user', async () => {
      const request: any = {
        type: ActionTokenType.Invite,
        user: mockUser,
      };

      userService.getById.mockResolvedValue(mockUser);
      actionTokenService.create.mockResolvedValue(mockActionToken);

      await service.sendActionToken(request, frontendUrl);

      expect(userService.getById).toHaveBeenCalledWith(mockUser.id);
      expect(actionTokenService.create).toHaveBeenCalled();
      expect(mailerService.send).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        expect.any(String),
      );
    });

    it('should send action token email with email only', async () => {
      const request: any = {
        type: ActionTokenType.Invite,
        email: 'test@example.com',
      };

      actionTokenService.create.mockResolvedValue(mockActionToken);

      await service.sendActionToken(request, frontendUrl);

      expect(actionTokenService.create).toHaveBeenCalled();
      expect(mailerService.send).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        expect.any(String),
      );
    });

    it('should execute preActions if provided', async () => {
      const request: any = {
        type: ActionTokenType.ValidateEmail,
        user: mockUser,
      };

      const updatedUser = { ...mockUser, emailValidated: false };
      const preActions = jest.fn().mockReturnValue({
        emailValidated: false,
      });

      userService.getById.mockResolvedValue(mockUser);
      userService.update.mockResolvedValue(updatedUser);
      actionTokenService.create.mockResolvedValue(mockActionToken);

      await service.sendActionToken(request, frontendUrl, preActions);

      expect(preActions).toHaveBeenCalledWith(mockUser);
      expect(userService.update).toHaveBeenCalled();
    });

    it('should build custom link when route is configured', async () => {
      const request: any = {
        type: ActionTokenType.ResetPassword,
        user: mockUser,
      };

      userService.getById.mockResolvedValue(mockUser);
      actionTokenService.create.mockResolvedValue(mockActionToken);

      await service.sendActionToken(request, frontendUrl);

      expect(mailerService.send).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
        expect.stringContaining(
          'https://example.com/auth/reset-password?token=action-token-123&email=',
        ),
      );
    });
  });

  describe('sendInvitation', () => {
    const frontendUrl = 'https://example.com';

    it('should throw BadRequestException if user already exists', async () => {
      const invite: InviteRequest = {
        email: 'test@example.com',
        roles: ['user'],
      };

      userService.exists.mockResolvedValue(true);

      await expect(service.sendInvitation(invite, frontendUrl)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should send invitation email', async () => {
      const invite: InviteRequest = {
        email: 'test@example.com',
        roles: ['user'],
      };

      userService.exists.mockResolvedValue(false);
      actionTokenService.create.mockResolvedValue(mockActionToken);

      await service.sendInvitation(invite, frontendUrl);

      expect(userService.exists).toHaveBeenCalledWith('test@example.com');
      expect(actionTokenService.create).toHaveBeenCalled();
      expect(mailerService.send).toHaveBeenCalled();
    });

    it('should use default roles if not provided', async () => {
      const invite: InviteRequest = {
        email: 'test@example.com',
      };

      userService.exists.mockResolvedValue(false);
      actionTokenService.create.mockResolvedValue(mockActionToken);

      await service.sendInvitation(invite, frontendUrl);

      expect(actionTokenService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: ['user'],
        }),
      );
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation and return auth response', async () => {
      const request: AcceptInvitationRequest = {
        email: 'test@example.com',
        token: 'action-token-123',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        enabled: true,
      };

      actionTokenService.validate.mockResolvedValue(mockActionToken);
      userService.create.mockResolvedValue(mockUser);
      jwtService.authenticate.mockResolvedValue(mockJwtToken);

      const result = await service.acceptInvitation(request);

      expect(actionTokenService.validate).toHaveBeenCalled();
      expect(userService.create).toHaveBeenCalledWith(request);
      expect(actionTokenService.revoke).toHaveBeenCalledWith(
        'action-token-123',
      );
      expect(jwtService.authenticate).toHaveBeenCalledWith(
        mockUser,
        'password123',
      );
      expect(result).toEqual({
        jwt: mockJwtToken,
        user: mockUser,
      });
    });
  });

  describe('signUp', () => {
    it('should throw BadRequestException if terms not accepted', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        acceptedTerms: false,
        acceptedPrivacyPolicy: true,
        enabled: true,
      };

      await expect(service.signUp(request)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if privacy policy not accepted', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        acceptedTerms: true,
        acceptedPrivacyPolicy: false,
        enabled: true,
      };

      await expect(service.signUp(request)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create user on sign up', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        enabled: true,
      };

      userService.create.mockResolvedValue(mockUser);

      await service.signUp(request);

      expect(userService.create).toHaveBeenCalledWith(request);
    });
  });

  describe('signIn', () => {
    it('should throw BadRequestException if user not found', async () => {
      const request: SignInRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      userService.findByEmail.mockResolvedValue(null);

      await expect(service.signIn(request)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return auth response on successful sign in', async () => {
      const request: SignInRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      userService.findByEmail.mockResolvedValue(mockUser);
      jwtService.authenticate.mockResolvedValue(mockJwtToken);

      const result = await service.signIn(request);

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(jwtService.authenticate).toHaveBeenCalledWith(
        mockUser,
        'password123',
      );
      expect(result).toEqual({
        jwt: mockJwtToken,
        user: mockUser,
      });
    });
  });

  describe('sendEmailValidation', () => {
    const frontendUrl = 'https://example.com';

    it('should throw NotFoundException if user not found', async () => {
      userService.getById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        service.sendEmailValidation('user-id', frontendUrl),
      ).rejects.toThrow(NotFoundException);
    });

    it('should send email validation', async () => {
      userService.getById.mockResolvedValue(mockUser);
      userService.update.mockResolvedValue({
        ...mockUser,
        emailValidated: false,
      });
      actionTokenService.create.mockResolvedValue(mockActionToken);

      await service.sendEmailValidation('user-id', frontendUrl);

      expect(userService.getById).toHaveBeenCalledWith('user-id');
      expect(userService.update).toHaveBeenCalled();
      expect(actionTokenService.create).toHaveBeenCalled();
      expect(mailerService.send).toHaveBeenCalled();
    });
  });

  describe('acceptEmailValidation', () => {
    it('should process email validation', async () => {
      const request: ValidateEmailRequest = {
        email: 'test@example.com',
        token: 'action-token-123',
      };

      const validatedToken = {
        ...mockActionToken,
        type: ActionTokenType.ValidateEmail,
        user: mockUser,
      };

      actionTokenService.validate.mockResolvedValue(validatedToken);
      userService.update.mockResolvedValue({
        ...mockUser,
        emailValidated: true,
      });

      await service.acceptEmailValidation(request);

      expect(actionTokenService.validate).toHaveBeenCalled();
      expect(userService.update).toHaveBeenCalledWith('user-id', {
        emailValidated: true,
      });
      expect(actionTokenService.revoke).toHaveBeenCalledWith(
        'action-token-123',
      );
    });
  });

  describe('sendCreatePassword', () => {
    const frontendUrl = 'https://example.com';

    it('should throw NotFoundException if user not found', async () => {
      userService.getById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        service.sendCreatePassword('user-id', frontendUrl),
      ).rejects.toThrow(NotFoundException);
    });

    it('should send create password email', async () => {
      userService.getById.mockResolvedValue(mockUser);
      actionTokenService.create.mockResolvedValue(mockActionToken);

      await service.sendCreatePassword('user-id', frontendUrl);

      expect(userService.getById).toHaveBeenCalledWith('user-id');
      expect(actionTokenService.create).toHaveBeenCalled();
      expect(mailerService.send).toHaveBeenCalled();
    });
  });

  describe('acceptCreatePassword', () => {
    it('should process create password', async () => {
      const request: CreatePasswordRequest = {
        email: 'test@example.com',
        token: 'action-token-123',
        password: 'newPassword123',
      };

      const createPasswordToken = {
        ...mockActionToken,
        type: ActionTokenType.CreatePassword,
        user: mockUser,
      };

      actionTokenService.validate.mockResolvedValue(createPasswordToken);
      userService.update.mockResolvedValue(mockUser);

      await service.acceptCreatePassword(request);

      expect(actionTokenService.validate).toHaveBeenCalled();
      expect(userService.update).toHaveBeenCalledWith('user-id', {
        password: 'newPassword123',
      });
      expect(actionTokenService.revoke).toHaveBeenCalledWith(
        'action-token-123',
      );
    });

    it('should throw BadRequestException if password is missing', async () => {
      const request: any = {
        email: 'test@example.com',
        token: 'action-token-123',
      };

      const createPasswordToken = {
        ...mockActionToken,
        type: ActionTokenType.CreatePassword,
        user: mockUser,
      };

      actionTokenService.validate.mockResolvedValue(createPasswordToken);

      await expect(service.acceptCreatePassword(request)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('sendResetPassword', () => {
    const frontendUrl = 'https://example.com';

    it('should return silently if user not found', async () => {
      userService.findByEmail.mockResolvedValue(null);
      actionTokenService.create.mockResolvedValue(mockActionToken);

      await service.sendResetPassword('test@example.com', frontendUrl);

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(actionTokenService.create).not.toHaveBeenCalled();
      expect(mailerService.send).not.toHaveBeenCalled();
    });

    it('should send reset password email', async () => {
      const resetPasswordToken = {
        ...mockActionToken,
        type: ActionTokenType.ResetPassword,
      };

      userService.findByEmail.mockResolvedValue(mockUser);
      userService.getById.mockResolvedValue(mockUser);
      actionTokenService.create.mockResolvedValue(resetPasswordToken);

      await service.sendResetPassword('test@example.com', frontendUrl);

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(actionTokenService.create).toHaveBeenCalled();
      expect(mailerService.send).toHaveBeenCalled();
    });
  });

  describe('acceptResetPassword', () => {
    it('should process reset password', async () => {
      const request: ResetPasswordRequest = {
        email: 'test@example.com',
        token: 'action-token-123',
        password: 'newPassword123',
      };

      const resetPasswordToken = {
        ...mockActionToken,
        type: ActionTokenType.ResetPassword,
        user: mockUser,
      };

      actionTokenService.validate.mockResolvedValue(resetPasswordToken);
      userService.update.mockResolvedValue(mockUser);

      await service.acceptResetPassword(request);

      expect(actionTokenService.validate).toHaveBeenCalled();
      expect(userService.update).toHaveBeenCalledWith('user-id', {
        password: 'newPassword123',
      });
      expect(actionTokenService.revoke).toHaveBeenCalledWith(
        'action-token-123',
      );
    });

    it('should throw BadRequestException if password is missing', async () => {
      const request: any = {
        email: 'test@example.com',
        token: 'action-token-123',
      };

      const resetPasswordToken = {
        ...mockActionToken,
        type: ActionTokenType.ResetPassword,
        user: mockUser,
      };

      actionTokenService.validate.mockResolvedValue(resetPasswordToken);

      await expect(service.acceptResetPassword(request)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('acceptTerms', () => {
    it('should accept terms', async () => {
      const request: AcceptTermsRequest = {
        email: 'test@example.com',
        token: 'action-token-123',
        acceptedTerms: true,
      };

      const acceptTermsToken = {
        ...mockActionToken,
        type: ActionTokenType.AcceptTerms,
        user: mockUser,
      };

      actionTokenService.validate.mockResolvedValue(acceptTermsToken);
      userService.update.mockResolvedValue({
        ...mockUser,
        acceptedTerms: true,
      });

      await service.acceptTerms(request);

      expect(actionTokenService.validate).toHaveBeenCalled();
      expect(userService.update).toHaveBeenCalledWith('user-id', {
        acceptedTerms: true,
      });
    });
  });

  describe('acceptPrivacyPolicy', () => {
    it('should accept privacy policy', async () => {
      const request: AcceptPrivacyPolicyRequest = {
        email: 'test@example.com',
        token: 'action-token-123',
        acceptedPrivacyPolicy: true,
      };

      const acceptPrivacyPolicyToken = {
        ...mockActionToken,
        type: ActionTokenType.AcceptPrivacyPolicy,
        user: mockUser,
      };

      actionTokenService.validate.mockResolvedValue(acceptPrivacyPolicyToken);
      userService.update.mockResolvedValue({
        ...mockUser,
        acceptedPrivacyPolicy: true,
      });

      await service.acceptPrivacyPolicy(request);

      expect(actionTokenService.validate).toHaveBeenCalled();
      expect(userService.update).toHaveBeenCalledWith('user-id', {
        acceptedPrivacyPolicy: true,
      });
    });
  });

  describe('signOut', () => {
    it('should sign out user', async () => {
      await service.signOut();

      expect(jwtService.logout).toHaveBeenCalled();
    });
  });

  describe('processActionToken', () => {
    it('should process action token with password', async () => {
      const request: any = {
        email: 'test@example.com',
        token: 'action-token-123',
        password: 'newPassword123',
      };

      const token = {
        ...mockActionToken,
        type: ActionTokenType.ResetPassword,
        user: mockUser,
      };

      actionTokenService.validate.mockResolvedValue(token);
      userService.update.mockResolvedValue(mockUser);

      await service.processActionToken(request, ActionTokenType.ResetPassword);

      expect(actionTokenService.validate).toHaveBeenCalled();
      expect(userService.update).toHaveBeenCalledWith('user-id', {
        password: 'newPassword123',
      });
      expect(actionTokenService.revoke).toHaveBeenCalledWith(
        'action-token-123',
      );
    });

    it('should process action token with email validation', async () => {
      const request: ValidateEmailRequest = {
        email: 'test@example.com',
        token: 'action-token-123',
      };

      const token = {
        ...mockActionToken,
        type: ActionTokenType.ValidateEmail,
        user: mockUser,
      };

      actionTokenService.validate.mockResolvedValue(token);
      userService.update.mockResolvedValue({
        ...mockUser,
        emailValidated: true,
      });

      await service.processActionToken(request, ActionTokenType.ValidateEmail);

      expect(userService.update).toHaveBeenCalledWith('user-id', {
        emailValidated: true,
      });
    });

    it('should throw BadRequestException if password required but missing', async () => {
      const request: any = {
        email: 'test@example.com',
        token: 'action-token-123',
      };

      const token = {
        ...mockActionToken,
        type: ActionTokenType.ResetPassword,
        user: mockUser,
      };

      actionTokenService.validate.mockResolvedValue(token);

      await expect(
        service.processActionToken(request, ActionTokenType.ResetPassword),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
