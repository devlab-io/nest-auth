import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { MailerServiceToken } from '@devlab-io/nest-mailer';
import { ActionConfig, ActionConfigToken } from '../config/action.config';
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

  const mockActionConfig: ActionConfig = {
    invite: {
      validity: 24,
      route: 'auth/accept-invitation',
    },
    validateEmail: {
      validity: 24,
      route: 'auth/validate-email',
    },
    acceptTerms: {
      validity: 24,
      route: 'auth/accept-terms',
    },
    acceptPrivacyPolicy: {
      validity: 24,
      route: 'auth/accept-privacy-policy',
    },
    changePassword: {
      validity: 24,
      route: 'auth/change-password',
    },
    resetPassword: {
      validity: 24,
      route: 'auth/reset-password',
    },
    changeEmail: {
      validity: 24,
      route: 'auth/change-email',
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
        {
          provide: ActionConfigToken,
          useValue: mockActionConfig,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
  });

  describe('buildActionLink', () => {
    it('should build action link for Invite', () => {
      const frontendUrl = 'https://example.com';
      const token = 'test-token';
      const email = 'test@example.com';

      const result = service.buildActionLink(
        ActionType.Invite,
        frontendUrl,
        token,
        email,
      );

      expect(result).toBe(
        'https://example.com/auth/accept-invitation?token=test-token&email=test%40example.com',
      );
    });

    it('should build action link for ValidateEmail', () => {
      const frontendUrl = 'https://example.com';
      const token = 'test-token';
      const email = 'test@example.com';

      const result = service.buildActionLink(
        ActionType.ValidateEmail,
        frontendUrl,
        token,
        email,
      );

      expect(result).toBe(
        'https://example.com/auth/validate-email?token=test-token&email=test%40example.com',
      );
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
      const frontendUrl = 'https://example.com';
      const expiresIn = 24;

      (ActionTypeUtils.hasAction as jest.Mock).mockImplementation(
        (actionMask, actionType) => {
          return actionMask === actionType;
        },
      );

      mockMailerService.send.mockResolvedValue(undefined);

      await service.sendActionTokenEmail(
        email,
        mockAction,
        frontendUrl,
        expiresIn,
      );

      expect(mockMailerService.send).toHaveBeenCalledWith(
        email,
        expect.stringContaining('Invitation'),
        expect.stringContaining('test-token-123'),
      );
    });

    it('should use custom link in email if route is configured', async () => {
      const email = 'test@example.com';
      const frontendUrl = 'https://example.com';
      const expiresIn = 24;

      (ActionTypeUtils.hasAction as jest.Mock).mockImplementation(
        (actionMask, actionType) => {
          return actionMask === actionType;
        },
      );

      mockMailerService.send.mockResolvedValue(undefined);

      await service.sendActionTokenEmail(
        email,
        mockAction,
        frontendUrl,
        expiresIn,
      );

      const sendCall = (mockMailerService.send as jest.Mock).mock.calls[0];
      const emailBody = sendCall[2];

      expect(emailBody).toContain(
        'https://example.com/auth/accept-invitation?token=test-token-123&email=test%40example.com',
      );
    });

    it('should handle email sending failure', async () => {
      const email = 'test@example.com';
      const frontendUrl = 'https://example.com';
      const expiresIn = 24;

      (ActionTypeUtils.hasAction as jest.Mock).mockImplementation(
        (actionMask, actionType) => {
          return actionMask === actionType;
        },
      );

      mockMailerService.send.mockRejectedValue(
        new Error('Email sending failed'),
      );

      await expect(
        service.sendActionTokenEmail(email, mockAction, frontendUrl, expiresIn),
      ).rejects.toThrow('Email sending failed');
    });
  });
});
