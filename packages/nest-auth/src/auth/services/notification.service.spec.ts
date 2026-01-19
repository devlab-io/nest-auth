import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { MailerServiceToken } from '@devlab-io/nest-mailer';
import { ClientConfig } from '../config/client.config';
import { ActionType, Action } from '@devlab-io/nest-auth-types';
import { ActionTypeUtils } from '../utils';

jest.mock('../utils', () => ({
  ActionTypeUtils: {
    hasAction: jest.fn(),
  },
}));

describe('NotificationService', () => {
  let service: NotificationService;

  const mockMailerService = {
    send: jest.fn(),
  };

  const mockClientConfig: ClientConfig = {
    id: 'local',
    uri: 'https://example.com',
    actions: {
      invite: {
        route: 'auth/accept-invitation',
        validity: 24,
      },
      validateEmail: {
        route: 'auth/validate-email',
        validity: 24,
      },
      acceptTerms: {
        route: 'auth/accept-terms',
        validity: 24,
      },
      acceptPrivacyPolicy: {
        route: 'auth/accept-privacy-policy',
        validity: 24,
      },
      changePassword: {
        route: 'auth/change-password',
        validity: 24,
      },
      resetPassword: {
        route: 'auth/reset-password',
        validity: 24,
      },
      changeEmail: {
        route: 'auth/change-email',
        validity: 24,
      },
    },
  };

  const mockClientConfigNoUri: ClientConfig = {
    id: 'api',
    uri: null,
    actions: {
      resetPassword: {
        validity: 1,
      },
    },
  };

  const mockAction: Action = {
    token: 'test-token-123',
    type: ActionType.Invite,
    email: 'test@example.com',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    user: {} as any,
    roles: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: MailerServiceToken,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
  });

  describe('buildActionLink', () => {
    it('should build action link for Invite', () => {
      const token = 'test-token';
      const email = 'test@example.com';

      const result = service.buildActionLink(
        ActionType.Invite,
        mockClientConfig,
        token,
        email,
      );

      expect(result).toBe(
        'https://example.com/auth/accept-invitation?token=test-token&email=test%40example.com',
      );
    });

    it('should build action link for ValidateEmail', () => {
      const token = 'test-token';
      const email = 'test@example.com';

      const result = service.buildActionLink(
        ActionType.ValidateEmail,
        mockClientConfig,
        token,
        email,
      );

      expect(result).toBe(
        'https://example.com/auth/validate-email?token=test-token&email=test%40example.com',
      );
    });

    it('should return undefined if client has no URI', () => {
      const token = 'test-token';
      const email = 'test@example.com';

      const result = service.buildActionLink(
        ActionType.ResetPassword,
        mockClientConfigNoUri,
        token,
        email,
      );

      expect(result).toBeUndefined();
    });

    it('should handle deeplink URIs', () => {
      const deeplinkClient: ClientConfig = {
        id: 'mobile',
        uri: 'myapp://',
        actions: {
          invite: {
            route: 'invitation/accept',
            validity: 48,
          },
        },
      };

      const result = service.buildActionLink(
        ActionType.Invite,
        deeplinkClient,
        'token123',
        'test@example.com',
      );

      expect(result).toBe(
        'myapp://invitation/accept?token=token123&email=test%40example.com',
      );
    });
  });

  describe('getActionValidity', () => {
    it('should return validity from client config', () => {
      const result = service.getActionValidity(
        mockClientConfig,
        ActionType.Invite,
      );
      expect(result).toBe(24);
    });

    it('should return default validity if not configured', () => {
      const result = service.getActionValidity(
        mockClientConfigNoUri,
        ActionType.Invite,
      );
      expect(result).toBe(24); // Default
    });
  });

  describe('generateEmailContent', () => {
    it('should generate email content for Invite action', () => {
      const actions = ActionType.Invite;
      const token = 'test-token';
      const expiresIn = 24;

      (ActionTypeUtils.hasAction as jest.Mock).mockImplementation(
        (actionMask, actionType) => {
          return actionMask === actionType;
        },
      );

      const result = service.generateEmailContent(actions, token, expiresIn);

      expect(result.subject).toBe('Invitation');
      expect(result.body).toContain("Rejoindre l'application");
      expect(result.body).toContain(token);
      expect(result.body).toContain('24 heures');
    });

    it('should generate email content for multiple actions', () => {
      const actions = ActionType.Invite | ActionType.ValidateEmail;
      const token = 'test-token';
      const expiresIn = 48;

      (ActionTypeUtils.hasAction as jest.Mock).mockImplementation(
        (actionMask, actionType) => {
          return (actionMask & actionType) !== 0;
        },
      );

      const result = service.generateEmailContent(actions, token, expiresIn);

      expect(result.subject).toContain('Actions Requises');
      expect(result.subject).toContain('Invitation');
      expect(result.subject).toContain('Validation Email');
      expect(result.body).toContain("Rejoindre l'application");
      expect(result.body).toContain('Valider votre adresse email');
      expect(result.body).toContain('48 heures');
    });

    it('should use custom link if provided', () => {
      const actions = ActionType.Invite;
      const token = 'test-token';
      const expiresIn = 24;
      const customLink = 'https://example.com/custom-link';

      (ActionTypeUtils.hasAction as jest.Mock).mockImplementation(
        (actionMask, actionType) => {
          return actionMask === actionType;
        },
      );

      const result = service.generateEmailContent(
        actions,
        token,
        expiresIn,
        customLink,
      );

      expect(result.body).toContain(customLink);
      expect(result.body).not.toContain(token);
    });
  });

  describe('sendActionTokenEmail', () => {
    it('should send action token email', async () => {
      const email = 'test@example.com';

      (ActionTypeUtils.hasAction as jest.Mock).mockImplementation(
        (actionMask, actionType) => {
          return actionMask === actionType;
        },
      );

      mockMailerService.send.mockResolvedValue(undefined);

      await service.sendActionTokenEmail(email, mockAction, mockClientConfig);

      expect(mockMailerService.send).toHaveBeenCalledWith(
        email,
        expect.stringContaining('Invitation'),
        expect.stringContaining(
          'https://example.com/auth/accept-invitation?token=test-token-123',
        ),
      );
    });

    it('should send token only if client has no URI', async () => {
      const email = 'test@example.com';
      const actionWithResetPassword = {
        ...mockAction,
        type: ActionType.ResetPassword,
      };

      (ActionTypeUtils.hasAction as jest.Mock).mockImplementation(
        (actionMask, actionType) => {
          return actionMask === actionType;
        },
      );

      mockMailerService.send.mockResolvedValue(undefined);

      await service.sendActionTokenEmail(
        email,
        actionWithResetPassword,
        mockClientConfigNoUri,
      );

      const sendCall = (mockMailerService.send as jest.Mock).mock.calls[0];
      const emailBody = sendCall[2];

      // Should contain the token directly, not a link
      expect(emailBody).toContain('test-token-123');
      expect(emailBody).not.toContain('https://');
    });

    it('should handle email sending failure', async () => {
      const email = 'test@example.com';

      (ActionTypeUtils.hasAction as jest.Mock).mockImplementation(
        (actionMask, actionType) => {
          return actionMask === actionType;
        },
      );

      mockMailerService.send.mockRejectedValue(
        new Error('Email sending failed'),
      );

      await expect(
        service.sendActionTokenEmail(email, mockAction, mockClientConfig),
      ).rejects.toThrow('Email sending failed');
    });
  });
});
