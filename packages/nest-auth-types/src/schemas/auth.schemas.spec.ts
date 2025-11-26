import {
  signInRequestSchema,
  signUpRequestSchema,
  inviteRequestSchema,
  acceptInvitationRequestSchema,
  validateEmailRequestSchema,
  changePasswordRequestSchema,
  resetPasswordRequestSchema,
  acceptTermsRequestSchema,
  acceptPrivacyPolicyRequestSchema,
} from './auth.schemas';
import {
  SignInRequest,
  SignUpRequest,
  InviteRequest,
  AcceptInvitationRequest,
  ValidateEmailRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  AcceptTermsRequest,
  AcceptPrivacyPolicyRequest,
} from '../types';

describe('Auth Schemas', () => {
  describe('signInRequestSchema', () => {
    it('should validate a valid sign-in request', () => {
      const validRequest: SignInRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = signInRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validRequest);
      }
    });

    it('should reject invalid email', () => {
      const invalidRequest = {
        email: 'not-an-email',
        password: 'password123',
      };

      const result = signInRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidRequest = {
        email: 'test@example.com',
        password: '',
      };

      const result = signInRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('signUpRequestSchema', () => {
    it('should validate a valid sign-up request', () => {
      const validRequest: SignUpRequest = {
        email: 'test@example.com',
        enabled: true,
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        credentials: [
          {
            type: 'password',
            password: 'password123',
          },
        ],
      };

      const result = signUpRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validRequest);
      }
    });

    it('should validate with optional fields', () => {
      const validRequest: SignUpRequest = {
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        enabled: true,
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        profilePicture: 'https://example.com/pic.jpg',
        credentials: [
          {
            type: 'password',
            password: 'password123',
          },
        ],
        actions: [
          {
            type: 1,
            expiresIn: 24,
            roles: ['role1', 'role2'],
          },
        ],
      };

      const result = signUpRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidRequest = {
        email: 'not-an-email',
        enabled: true,
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
      };

      const result = signUpRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject username that is too short', () => {
      const invalidRequest = {
        username: 'ab',
        email: 'test@example.com',
        enabled: true,
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
      };

      const result = signUpRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('inviteRequestSchema', () => {
    it('should validate a valid invite request', () => {
      const validRequest: InviteRequest = {
        email: 'test@example.com',
      };

      const result = inviteRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should validate with optional fields', () => {
      const validRequest: InviteRequest = {
        email: 'test@example.com',
        organisation: 'org-id',
        establishment: 'est-id',
        expiresIn: 24,
        message: 'Welcome!',
        roles: ['role1', 'role2'],
      };

      const result = inviteRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject expiresIn less than 1', () => {
      const invalidRequest = {
        email: 'test@example.com',
        expiresIn: 0,
      };

      const result = inviteRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject expiresIn greater than 8760', () => {
      const invalidRequest = {
        email: 'test@example.com',
        expiresIn: 8761,
      };

      const result = inviteRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('acceptInvitationRequestSchema', () => {
    it('should validate a valid accept invitation request', () => {
      const validRequest: AcceptInvitationRequest = {
        token: 'invitation-token',
        email: 'test@example.com',
        enabled: true,
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        credentials: [
          {
            type: 'password',
            password: 'password123',
          },
        ],
      };

      const result = acceptInvitationRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject empty token', () => {
      const invalidRequest = {
        token: '',
        email: 'test@example.com',
        enabled: true,
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
      };

      const result = acceptInvitationRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('validateEmailRequestSchema', () => {
    it('should validate a valid validate email request', () => {
      const validRequest: ValidateEmailRequest = {
        token: 'validation-token',
        email: 'test@example.com',
      };

      const result = validateEmailRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject empty token', () => {
      const invalidRequest = {
        token: '',
        email: 'test@example.com',
      };

      const result = validateEmailRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordRequestSchema', () => {
    it('should validate a valid change password request', () => {
      const validRequest: ChangePasswordRequest = {
        token: 'change-password-token',
        email: 'test@example.com',
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      };

      const result = changePasswordRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject old password less than 8 characters', () => {
      const invalidRequest = {
        token: 'token',
        email: 'test@example.com',
        oldPassword: 'short',
        newPassword: 'newpassword123',
      };

      const result = changePasswordRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject new password less than 8 characters', () => {
      const invalidRequest = {
        token: 'token',
        email: 'test@example.com',
        oldPassword: 'oldpassword123',
        newPassword: 'short',
      };

      const result = changePasswordRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordRequestSchema', () => {
    it('should validate a valid reset password request', () => {
      const validRequest: ResetPasswordRequest = {
        token: 'reset-token',
        email: 'test@example.com',
        newPassword: 'newpassword123',
      };

      const result = resetPasswordRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject password less than 8 characters', () => {
      const invalidRequest = {
        token: 'token',
        email: 'test@example.com',
        newPassword: 'short',
      };

      const result = resetPasswordRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('acceptTermsRequestSchema', () => {
    it('should validate a valid accept terms request', () => {
      const validRequest: AcceptTermsRequest = {
        token: 'terms-token',
        email: 'test@example.com',
        acceptedTerms: true,
      };

      const result = acceptTermsRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject empty token', () => {
      const invalidRequest = {
        token: '',
        email: 'test@example.com',
        acceptedTerms: true,
      };

      const result = acceptTermsRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('acceptPrivacyPolicyRequestSchema', () => {
    it('should validate a valid accept privacy policy request', () => {
      const validRequest: AcceptPrivacyPolicyRequest = {
        token: 'privacy-token',
        email: 'test@example.com',
        acceptedPrivacyPolicy: true,
      };

      const result = acceptPrivacyPolicyRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject empty token', () => {
      const invalidRequest = {
        token: '',
        email: 'test@example.com',
        acceptedPrivacyPolicy: true,
      };

      const result = acceptPrivacyPolicyRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });
});
