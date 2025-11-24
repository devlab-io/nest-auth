import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { ActionService } from './action.service';
import { JwtService } from './jwt.service';
import { UserAccountService } from './user-account.service';
import { CredentialService } from './credential.service';
import { OrganisationService } from './organisation.service';
import { EstablishmentService } from './establishment.service';
import { NotificationService } from './notification.service';
import { UserConfig, UserConfigToken } from '../config/user.config';
import { ActionConfig, ActionConfigToken } from '../config/action.config';
import {
  UserEntity,
  ActionEntity,
  UserAccountEntity,
  OrganisationEntity,
  EstablishmentEntity,
  RoleEntity,
} from '../entities';
import {
  ActionType,
  InviteRequest,
  SignUpRequest,
  SignInRequest,
  AcceptInvitationRequest,
  ValidateEmailRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  AcceptTermsRequest,
  AcceptPrivacyPolicyRequest,
  JwtToken,
} from '../types';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let actionService: jest.Mocked<ActionService>;
  let jwtService: jest.Mocked<JwtService>;
  let userAccountService: jest.Mocked<UserAccountService>;
  let organisationService: jest.Mocked<OrganisationService>;
  let establishmentService: jest.Mocked<EstablishmentService>;
  let notificationService: jest.Mocked<NotificationService>;

  const mockUserConfig: UserConfig = {
    user: {
      canSignUp: true,
      defaultRoles: ['user'],
    },
  };

  const mockActionConfig: ActionConfig = {
    invite: {
      validity: 24,
      route: 'auth/accept-invitation',
      organisation: undefined,
      establishment: undefined,
    },
    validateEmail: { validity: 24, route: 'auth/validate-email' },
    acceptTerms: { validity: 24, route: 'auth/accept-terms' },
    acceptPrivacyPolicy: { validity: 24, route: 'auth/accept-privacy-policy' },
    changePassword: { validity: 24, route: 'auth/change-password' },
    resetPassword: { validity: 24, route: 'auth/reset-password' },
    changeEmail: { validity: 24, route: 'auth/change-email' },
  };

  const mockOrganisation: OrganisationEntity = {
    id: 'org-id',
    name: 'Test Organisation',
    establishments: [],
  } as OrganisationEntity;

  const mockEstablishment: EstablishmentEntity = {
    id: 'est-id',
    name: 'Test Establishment',
    organisation: { ...mockOrganisation, id: 'org-id' },
    accounts: [],
  } as EstablishmentEntity;

  const mockUser: UserEntity = {
    id: 'user-id',
    email: 'test@example.com',
    username: 'testuser#123',
    firstName: 'John',
    lastName: 'Doe',
    emailValidated: false,
    acceptedTerms: false,
    acceptedPrivacyPolicy: false,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    credentials: [],
    actions: [],
    accounts: [],
  } as UserEntity;

  const mockUserAccount: UserAccountEntity = {
    id: 'user-account-id',
    organisation: mockOrganisation,
    establishment: mockEstablishment,
    user: mockUser,
    roles: [],
  } as UserAccountEntity;

  const mockRoles: RoleEntity[] = [];

  const mockActionToken: ActionEntity = {
    token: 'action-token-123',
    type: ActionType.Invite,
    email: 'test@example.com',
    createdAt: new Date(),
    user: mockUser,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    roles: mockRoles,
    organisationId: 'org-id',
    establishmentId: 'est-id',
  } as ActionEntity;

  const mockJwtToken: JwtToken = {
    accessToken: 'access-token',
    expiresIn: 3600, // 1h
  };

  beforeEach(async () => {
    const mockUserService = {
      exists: jest.fn(),
      create: jest.fn(),
      getById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      addPasswordCredential: jest.fn(),
    };

    const mockActionService = {
      create: jest.fn(),
      validate: jest.fn(),
      revoke: jest.fn(),
    };

    const mockJwtService = {
      authenticate: jest.fn(),
      logout: jest.fn(),
    };

    const mockUserAccountService = {
      create: jest.fn(),
      search: jest.fn(),
      getById: jest.fn(),
    };

    const mockOrganisationService = {
      getById: jest.fn(),
      findByName: jest.fn(),
    };

    const mockEstablishmentService = {
      getById: jest.fn(),
      findByNameAndOrganisation: jest.fn(),
    };

    const mockNotificationService = {
      sendActionTokenEmail: jest.fn(),
    };

    const mockCredentialService = {
      verifyPassword: jest.fn(),
      createPasswordCredential: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ActionService,
          useValue: mockActionService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UserAccountService,
          useValue: mockUserAccountService,
        },
        {
          provide: CredentialService,
          useValue: mockCredentialService,
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
          provide: NotificationService,
          useValue: mockNotificationService,
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
    actionService = module.get(ActionService);
    jwtService = module.get(JwtService);
    userAccountService = module.get(UserAccountService);
    organisationService = module.get(OrganisationService);
    establishmentService = module.get(EstablishmentService);
    notificationService = module.get(NotificationService);

    jest.clearAllMocks();
  });

  describe('sendActionToken', () => {
    const frontendUrl = 'https://example.com';

    it('should throw BadRequestException if frontendUrl is missing', async () => {
      const request: any = {
        type: ActionType.Invite,
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
        type: ActionType.Invite,
      };

      await expect(
        service.sendActionToken(request, frontendUrl),
      ).rejects.toThrow(BadRequestException);
    });

    it('should send action token email with user', async () => {
      const request: any = {
        type: ActionType.Invite,
        user: mockUser,
      };

      userService.getById.mockResolvedValue(mockUser);
      actionService.create.mockResolvedValue(mockActionToken);

      await service.sendActionToken(request, frontendUrl);

      expect(userService.getById).toHaveBeenCalledWith(mockUser.id);
      expect(actionService.create).toHaveBeenCalled();
      expect(notificationService.sendActionTokenEmail).toHaveBeenCalled();
    });

    it('should send action token email with email only', async () => {
      const request: any = {
        type: ActionType.Invite,
        email: 'test@example.com',
      };

      actionService.create.mockResolvedValue(mockActionToken);

      await service.sendActionToken(request, frontendUrl);

      expect(actionService.create).toHaveBeenCalled();
      expect(notificationService.sendActionTokenEmail).toHaveBeenCalled();
    });

    it('should execute preActions if provided', async () => {
      const request: any = {
        type: ActionType.ValidateEmail,
        user: mockUser,
      };

      const updatedUser = { ...mockUser, emailValidated: false };
      const preActions = jest.fn().mockReturnValue({
        emailValidated: false,
      });

      userService.getById.mockResolvedValue(mockUser);
      userService.update.mockResolvedValue(updatedUser);
      actionService.create.mockResolvedValue(mockActionToken);

      await service.sendActionToken(request, frontendUrl, preActions);

      expect(preActions).toHaveBeenCalledWith(mockUser);
      expect(userService.update).toHaveBeenCalled();
    });

    it('should build custom link when route is configured', async () => {
      const request: any = {
        type: ActionType.ResetPassword,
        user: mockUser,
      };

      userService.getById.mockResolvedValue(mockUser);
      actionService.create.mockResolvedValue(mockActionToken);

      await service.sendActionToken(request, frontendUrl);

      expect(notificationService.sendActionTokenEmail).toHaveBeenCalled();
    });
  });

  describe('sendInvitation', () => {
    const frontendUrl = 'https://example.com';

    it('should throw BadRequestException if user already exists', async () => {
      const invite: InviteRequest = {
        email: 'test@example.com',
        roles: ['user'],
        organisation: 'Test Organisation',
        establishment: 'Test Establishment',
      };

      userService.exists.mockResolvedValue(true);

      await expect(service.sendInvitation(invite, frontendUrl)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if organisation or establishment not provided', async () => {
      const invite: InviteRequest = {
        email: 'test@example.com',
        roles: ['user'],
      } as any;

      userService.exists.mockResolvedValue(false);

      await expect(service.sendInvitation(invite, frontendUrl)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if organisation not found', async () => {
      const invite: InviteRequest = {
        email: 'test@example.com',
        roles: ['user'],
        organisation: 'Non-existent Organisation',
        establishment: 'Test Establishment',
      };

      userService.exists.mockResolvedValue(false);
      organisationService.findByName = jest.fn().mockResolvedValue(null);

      await expect(service.sendInvitation(invite, frontendUrl)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should send invitation email', async () => {
      const invite: InviteRequest = {
        email: 'test@example.com',
        roles: ['user'],
        organisation: 'Test Organisation',
        establishment: 'Test Establishment',
      };

      userService.exists.mockResolvedValue(false);
      organisationService.findByName = jest
        .fn()
        .mockResolvedValue(mockOrganisation);
      establishmentService.findByNameAndOrganisation = jest
        .fn()
        .mockResolvedValue(mockEstablishment);
      actionService.create.mockResolvedValue(mockActionToken);

      await service.sendInvitation(invite, frontendUrl);

      expect(userService.exists).toHaveBeenCalledWith('test@example.com');
      expect(organisationService.findByName).toHaveBeenCalledWith(
        'Test Organisation',
      );
      expect(
        establishmentService.findByNameAndOrganisation,
      ).toHaveBeenCalledWith('Test Establishment', 'org-id');
      // sendActionToken is called internally, which calls actionService.create
      expect(actionService.create).toHaveBeenCalled();
      const createCall = (actionService.create as jest.Mock).mock.calls[0][0];
      expect(createCall.email).toBe('test@example.com');
      expect(createCall.type).toBe(ActionType.Invite);
      expect(createCall.roles).toEqual(['user']);
      expect(createCall.organisationId).toBe('org-id');
      expect(createCall.establishmentId).toBe('est-id');
      expect(notificationService.sendActionTokenEmail).toHaveBeenCalled();
    });

    it('should use default roles if not provided', async () => {
      const invite: InviteRequest = {
        email: 'test@example.com',
        organisation: 'Test Organisation',
        establishment: 'Test Establishment',
      };

      userService.exists.mockResolvedValue(false);
      organisationService.findByName = jest
        .fn()
        .mockResolvedValue(mockOrganisation);
      establishmentService.findByNameAndOrganisation = jest
        .fn()
        .mockResolvedValue(mockEstablishment);
      actionService.create.mockResolvedValue(mockActionToken);

      await service.sendInvitation(invite, frontendUrl);

      expect(actionService.create).toHaveBeenCalledWith(
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
        credentials: [{ type: 'password', password: 'password123' }],
        firstName: 'John',
        lastName: 'Doe',
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        enabled: true,
      };

      actionService.validate.mockResolvedValue(mockActionToken);
      userService.create.mockResolvedValue(mockUser);
      userService.addPasswordCredential.mockResolvedValue(undefined);
      userAccountService.create.mockResolvedValue(mockUserAccount);
      jwtService.authenticate.mockResolvedValue(mockJwtToken);

      const result = await service.acceptInvitation(request);

      expect(actionService.validate).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'action-token-123',
          email: 'test@example.com',
        }),
        ActionType.Invite,
      );
      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          acceptedTerms: true,
          acceptedPrivacyPolicy: true,
          enabled: true,
        }),
      );
      // Password credential is created during user creation, not separately
      // userService.create already handles credentials
      expect(userAccountService.create).toHaveBeenCalledWith({
        userId: 'user-id',
        organisationId: 'org-id',
        establishmentId: 'est-id',
        roles: [],
      });
      expect(actionService.revoke).toHaveBeenCalledWith('action-token-123');
      expect(jwtService.authenticate).toHaveBeenCalledWith(
        mockUserAccount,
        'password123',
      );
      expect(result).toEqual({
        jwt: mockJwtToken,
        userAccount: mockUserAccount,
        user: mockUser,
      });
    });
  });

  describe('signUp', () => {
    it('should throw BadRequestException if terms not accepted', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        credentials: [{ type: 'password', password: 'password123' }],
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
        credentials: [{ type: 'password', password: 'password123' }],
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
        credentials: [{ type: 'password', password: 'password123' }],
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

    it('should throw BadRequestException if no user account found', async () => {
      const request: SignInRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      userService.findByEmail.mockResolvedValue(mockUser);
      userAccountService.search.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 1,
      });

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
      userAccountService.search.mockResolvedValue({
        data: [mockUserAccount],
        total: 1,
        page: 1,
        limit: 1,
      });
      jwtService.authenticate.mockResolvedValue(mockJwtToken);

      const result = await service.signIn(request);

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userAccountService.search).toHaveBeenCalledWith(
        { userId: 'user-id' },
        1,
        1,
      );
      expect(jwtService.authenticate).toHaveBeenCalledWith(
        mockUserAccount,
        'password123',
      );
      expect(result).toEqual({
        jwt: mockJwtToken,
        userAccount: mockUserAccount,
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
      actionService.create.mockResolvedValue(mockActionToken);

      await service.sendEmailValidation('user-id', frontendUrl);

      expect(userService.getById).toHaveBeenCalledWith('user-id');
      expect(userService.update).toHaveBeenCalled();
      expect(actionService.create).toHaveBeenCalled();
      expect(notificationService.sendActionTokenEmail).toHaveBeenCalled();
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
        type: ActionType.ValidateEmail,
        user: mockUser,
      };

      actionService.validate.mockResolvedValue(validatedToken);
      userService.update.mockResolvedValue({
        ...mockUser,
        emailValidated: true,
      });

      await service.acceptEmailValidation(request);

      expect(actionService.validate).toHaveBeenCalled();
      expect(userService.update).toHaveBeenCalledWith('user-id', {
        emailValidated: true,
      });
      expect(actionService.revoke).toHaveBeenCalledWith('action-token-123');
    });
  });

  describe('sendCreatePassword', () => {
    const frontendUrl = 'https://example.com';

    it('should throw NotFoundException if user not found', async () => {
      userService.getById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        service.sendChangePassword('user-id', frontendUrl),
      ).rejects.toThrow(NotFoundException);
    });

    it('should send create password email', async () => {
      userService.getById.mockResolvedValue(mockUser);
      actionService.create.mockResolvedValue(mockActionToken);

      await service.sendChangePassword('user-id', frontendUrl);

      expect(userService.getById).toHaveBeenCalledWith('user-id');
      expect(actionService.create).toHaveBeenCalled();
      expect(notificationService.sendActionTokenEmail).toHaveBeenCalled();
    });
  });

  describe('acceptCreatePassword', () => {
    it('should process create password', async () => {
      const request: ChangePasswordRequest = {
        email: 'test@example.com',
        token: 'action-token-123',
        oldPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      };

      const createPasswordToken = {
        ...mockActionToken,
        type: ActionType.ChangePassword,
        user: mockUser,
      };

      actionService.validate.mockResolvedValue(createPasswordToken);
      userService.addPasswordCredential.mockResolvedValue(undefined);

      await service.acceptChangePassword(request);

      expect(actionService.validate).toHaveBeenCalled();
      expect(userService.addPasswordCredential).toHaveBeenCalledWith(
        'user-id',
        'newPassword123',
      );
      expect(actionService.revoke).toHaveBeenCalledWith('action-token-123');
    });

    it('should throw BadRequestException if password is missing', async () => {
      const request: any = {
        email: 'test@example.com',
        token: 'action-token-123',
      };

      const createPasswordToken = {
        ...mockActionToken,
        type: ActionType.ChangePassword,
        user: mockUser,
      };

      actionService.validate.mockResolvedValue(createPasswordToken);

      await expect(service.acceptChangePassword(request)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('sendResetPassword', () => {
    const frontendUrl = 'https://example.com';

    it('should return silently if user not found', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await service.sendResetPassword('test@example.com', frontendUrl);

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(actionService.create).not.toHaveBeenCalled();
      expect(notificationService.sendActionTokenEmail).not.toHaveBeenCalled();
    });

    it('should send reset password email', async () => {
      const resetPasswordToken = {
        ...mockActionToken,
        type: ActionType.ResetPassword,
      };

      userService.findByEmail.mockResolvedValue(mockUser);
      userService.getById.mockResolvedValue(mockUser);
      actionService.create.mockResolvedValue(resetPasswordToken);

      await service.sendResetPassword('test@example.com', frontendUrl);

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(actionService.create).toHaveBeenCalled();
      expect(notificationService.sendActionTokenEmail).toHaveBeenCalled();
    });
  });

  describe('acceptResetPassword', () => {
    it('should process reset password', async () => {
      const request: ResetPasswordRequest = {
        email: 'test@example.com',
        token: 'action-token-123',
        newPassword: 'newPassword123',
      };

      const resetPasswordToken = {
        ...mockActionToken,
        type: ActionType.ResetPassword,
        user: mockUser,
      };

      actionService.validate.mockResolvedValue(resetPasswordToken);
      userService.addPasswordCredential.mockResolvedValue(undefined);

      await service.acceptResetPassword(request);

      expect(actionService.validate).toHaveBeenCalled();
      expect(userService.addPasswordCredential).toHaveBeenCalledWith(
        'user-id',
        'newPassword123',
      );
      expect(actionService.revoke).toHaveBeenCalledWith('action-token-123');
    });

    it('should throw BadRequestException if password is missing', async () => {
      const request: any = {
        email: 'test@example.com',
        token: 'action-token-123',
      };

      const resetPasswordToken = {
        ...mockActionToken,
        type: ActionType.ResetPassword,
        user: mockUser,
      };

      actionService.validate.mockResolvedValue(resetPasswordToken);

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
        type: ActionType.AcceptTerms,
        user: mockUser,
      };

      actionService.validate.mockResolvedValue(acceptTermsToken);
      userService.update.mockResolvedValue({
        ...mockUser,
        acceptedTerms: true,
      });

      await service.acceptTerms(request);

      expect(actionService.validate).toHaveBeenCalled();
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
        type: ActionType.AcceptPrivacyPolicy,
        user: mockUser,
      };

      actionService.validate.mockResolvedValue(acceptPrivacyPolicyToken);
      userService.update.mockResolvedValue({
        ...mockUser,
        acceptedPrivacyPolicy: true,
      });

      await service.acceptPrivacyPolicy(request);

      expect(actionService.validate).toHaveBeenCalled();
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
        newPassword: 'newPassword123',
      };

      const token = {
        ...mockActionToken,
        type: ActionType.ResetPassword,
        user: mockUser,
      };

      actionService.validate.mockResolvedValue(token);
      userService.addPasswordCredential.mockResolvedValue(undefined);

      await service.processActionToken(request, ActionType.ResetPassword);

      expect(actionService.validate).toHaveBeenCalled();
      expect(userService.addPasswordCredential).toHaveBeenCalledWith(
        'user-id',
        'newPassword123',
      );
      expect(actionService.revoke).toHaveBeenCalledWith('action-token-123');
    });

    it('should process action token with email validation', async () => {
      const request: ValidateEmailRequest = {
        email: 'test@example.com',
        token: 'action-token-123',
      };

      const token = {
        ...mockActionToken,
        type: ActionType.ValidateEmail,
        user: mockUser,
      };

      actionService.validate.mockResolvedValue(token);
      userService.update.mockResolvedValue({
        ...mockUser,
        emailValidated: true,
      });

      await service.processActionToken(request, ActionType.ValidateEmail);

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
        type: ActionType.ResetPassword,
        user: mockUser,
      };

      actionService.validate.mockResolvedValue(token);

      await expect(
        service.processActionToken(request, ActionType.ResetPassword),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
