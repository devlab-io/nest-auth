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

export interface AuthClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

interface RequestOptions {
  method?: string;
  body?: any;
  params?: Record<string, string>;
}

/**
 * Client for interacting with the NestJS Auth API
 * Uses native fetch API (Node.js 18+)
 */
export class AuthClient {
  private readonly baseURL: string;
  private readonly timeout: number;
  private readonly defaultHeaders: Record<string, string>;
  private authToken: string | null = null;

  constructor(config: AuthClientConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  /**
   * Set the authorization token for authenticated requests
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear the authorization token
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Internal method to make HTTP requests
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { method = 'GET', body, params } = options;

    // Build URL with query parameters
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // Prepare headers
    const headers: Record<string, string> = { ...this.defaultHeaders };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined && body !== null) {
      requestOptions.body = JSON.stringify(body);
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    requestOptions.signal = controller.signal;

    try {
      const response = await fetch(url.toString(), requestOptions);
      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
        }
        throw new Error(errorMessage);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data as T;
      }

      // For void responses, return undefined as T
      return undefined as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Get the current user account
   * GET /auth/account
   */
  async getAccount(): Promise<UserAccount | null> {
    return this.request<UserAccount | null>('/auth/account');
  }

  /**
   * Send an invitation to a user
   * POST /auth/invite
   */
  async invite(data: InviteRequest): Promise<void> {
    await this.request<void>('/auth/invite', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Accept an invitation and create an account
   * POST /auth/accept-invitation
   */
  async acceptInvitation(data: AcceptInvitationRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      '/auth/accept-invitation',
      {
        method: 'POST',
        body: data,
      },
    );
    // Automatically set the auth token if sign-in is successful
    if (response?.jwt?.accessToken) {
      this.setAuthToken(response.jwt.accessToken);
    }
    return response;
  }

  /**
   * Register a new user account
   * POST /auth/sign-up
   */
  async signUp(data: SignUpRequest): Promise<void> {
    await this.request<void>('/auth/sign-up', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Sign in and authenticate a user
   * POST /auth/sign-in
   */
  async signIn(data: SignInRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/sign-in', {
      method: 'POST',
      body: data,
    });
    // Automatically set the auth token if sign-in is successful
    if (response?.jwt?.accessToken) {
      this.setAuthToken(response.jwt.accessToken);
    }
    return response;
  }

  /**
   * Sign out and invalidate the current session
   * POST /auth/sign-out
   */
  async signOut(): Promise<void> {
    await this.request<void>('/auth/sign-out', {
      method: 'POST',
    });
    this.clearAuthToken();
  }

  /**
   * Send an email validation token
   * POST /auth/send-email-validation?id={userId}
   */
  async sendEmailValidation(userId: string): Promise<void> {
    await this.request<void>('/auth/send-email-validation', {
      method: 'POST',
      params: { id: userId },
    });
  }

  /**
   * Validate an email address using a token
   * POST /auth/accept-email-validation
   */
  async acceptEmailValidation(data: ValidateEmailRequest): Promise<void> {
    await this.request<void>('/auth/accept-email-validation', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Send a change password token
   * POST /auth/send-change-password?id={userId}
   */
  async sendChangePassword(userId: string): Promise<void> {
    await this.request<void>('/auth/send-change-password', {
      method: 'POST',
      params: { id: userId },
    });
  }

  /**
   * Change a password using a token
   * POST /auth/accept-change-password
   */
  async acceptChangePassword(data: ChangePasswordRequest): Promise<void> {
    await this.request<void>('/auth/accept-change-password', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Send a password reset token
   * POST /auth/send-reset-password?email={email}
   */
  async sendResetPassword(email: string): Promise<void> {
    await this.request<void>('/auth/send-reset-password', {
      method: 'POST',
      params: { email },
    });
  }

  /**
   * Reset password using a token
   * POST /auth/accept-reset-password
   */
  async acceptResetPassword(data: ResetPasswordRequest): Promise<void> {
    await this.request<void>('/auth/accept-reset-password', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Send an accept terms token
   * POST /auth/add-accept-terms?id={userId}
   */
  async addAcceptTerms(userId: string): Promise<void> {
    await this.request<void>('/auth/add-accept-terms', {
      method: 'POST',
      params: { id: userId },
    });
  }

  /**
   * Accept terms of service using a token
   * POST /auth/accept-terms
   */
  async acceptTerms(data: AcceptTermsRequest): Promise<void> {
    await this.request<void>('/auth/accept-terms', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Send an accept privacy policy token
   * POST /auth/add-accept-privacy-policy?id={userId}
   */
  async addAcceptPrivacyPolicy(userId: string): Promise<void> {
    await this.request<void>('/auth/add-accept-privacy-policy', {
      method: 'POST',
      params: { id: userId },
    });
  }

  /**
   * Accept privacy policy using a token
   * POST /auth/accept-privacy-policy
   */
  async acceptPrivacyPolicy(data: AcceptPrivacyPolicyRequest): Promise<void> {
    await this.request<void>('/auth/accept-privacy-policy', {
      method: 'POST',
      body: data,
    });
  }
}
