import { BaseService } from './base.service';
import { AuthState } from '../state/auth.state';
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
  AuthResponse,
  UserAccount,
} from '@devlab-io/nest-auth-types';

/**
 * Service for interacting with the Authentication API routes
 */
export class AuthService extends BaseService {
  /**
   * Get the current user account
   * GET /auth/account
   */
  public async getAccount(): Promise<UserAccount | null> {
    this.ensureInitialized();
    const account = await this.request<UserAccount | null>('/auth/account');
    // Update cache if account is fetched successfully
    if (account) {
      AuthState.setUserAccount(account);
    }
    return account;
  }

  /**
   * Send an invitation to a user
   * POST /auth/invite
   */
  public async invite(data: InviteRequest): Promise<void> {
    this.ensureInitialized();
    await this.request<void>('/auth/invite', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Accept an invitation and create an account
   * POST /auth/accept-invitation
   */
  public async acceptInvitation(
    data: AcceptInvitationRequest,
  ): Promise<AuthResponse> {
    this.ensureInitialized();
    const response = await this.request<AuthResponse>(
      '/auth/accept-invitation',
      {
        method: 'POST',
        body: data,
      },
    );
    // Automatically set the auth token if sign-in is successful
    if (response?.jwt?.accessToken) {
      AuthState.setToken(response.jwt.accessToken);
    }
    return response;
  }

  /**
   * Register a new user account
   * POST /auth/sign-up
   */
  public async signUp(data: SignUpRequest): Promise<void> {
    await this.request<void>('/auth/sign-up', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Sign in and authenticate a user
   * POST /auth/sign-in
   */
  public async signIn(data: SignInRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/sign-in', {
      method: 'POST',
      body: data,
    });
    // Automatically set the auth token and user account if sign-in is successful
    if (response?.jwt?.accessToken) {
      AuthState.setToken(response.jwt.accessToken);
      AuthState.setUserAccount(response?.userAccount);
    } else {
      AuthState.clear();
    }
    return response;
  }

  /**
   * Sign out and invalidate the current session
   * POST /auth/sign-out
   */
  public async signOut(): Promise<void> {
    this.ensureInitialized();
    await this.request<void>('/auth/sign-out', {
      method: 'POST',
    });
    AuthState.clear();
  }

  /**
   * Send an email validation token
   * POST /auth/send-email-validation?id={userId}
   */
  public async sendEmailValidation(userId: string): Promise<void> {
    this.ensureInitialized();
    await this.request<void>('/auth/send-email-validation', {
      method: 'POST',
      params: { id: userId },
    });
  }

  /**
   * Validate an email address using a token
   * POST /auth/accept-email-validation
   */
  public async acceptEmailValidation(
    data: ValidateEmailRequest,
  ): Promise<void> {
    this.ensureInitialized();
    await this.request<void>('/auth/accept-email-validation', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Send a change password token
   * POST /auth/send-change-password?id={userId}
   */
  public async sendChangePassword(userId: string): Promise<void> {
    this.ensureInitialized();
    await this.request<void>('/auth/send-change-password', {
      method: 'POST',
      params: { id: userId },
    });
  }

  /**
   * Change a password using a token
   * POST /auth/accept-change-password
   */
  public async acceptChangePassword(
    data: ChangePasswordRequest,
  ): Promise<void> {
    this.ensureInitialized();
    await this.request<void>('/auth/accept-change-password', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Send a password reset token
   * POST /auth/send-reset-password?email={email}
   */
  public async sendResetPassword(email: string): Promise<void> {
    await this.request<void>('/auth/send-reset-password', {
      method: 'POST',
      params: { email },
    });
  }

  /**
   * Reset password using a token
   * POST /auth/accept-reset-password
   */
  public async acceptResetPassword(data: ResetPasswordRequest): Promise<void> {
    await this.request<void>('/auth/accept-reset-password', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Send an accept terms token
   * POST /auth/add-accept-terms?id={userId}
   */
  public async addAcceptTerms(userId: string): Promise<void> {
    this.ensureInitialized();
    await this.request<void>('/auth/add-accept-terms', {
      method: 'POST',
      params: { id: userId },
    });
  }

  /**
   * Accept terms of service using a token
   * POST /auth/accept-terms
   */
  public async acceptTerms(data: AcceptTermsRequest): Promise<void> {
    this.ensureInitialized();
    await this.request<void>('/auth/accept-terms', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Send an accept privacy policy token
   * POST /auth/add-accept-privacy-policy?id={userId}
   */
  public async addAcceptPrivacyPolicy(userId: string): Promise<void> {
    this.ensureInitialized();
    await this.request<void>('/auth/add-accept-privacy-policy', {
      method: 'POST',
      params: { id: userId },
    });
  }

  /**
   * Accept privacy policy using a token
   * POST /auth/accept-privacy-policy
   */
  public async acceptPrivacyPolicy(
    data: AcceptPrivacyPolicyRequest,
  ): Promise<void> {
    this.ensureInitialized();
    await this.request<void>('/auth/accept-privacy-policy', {
      method: 'POST',
      body: data,
    });
  }
}
