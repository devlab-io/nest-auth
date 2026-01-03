import { AuthService } from './auth.service';
import { AuthState } from '../state/auth.state';
import {
  SignInRequest,
  SignUpRequest,
  InviteRequest,
  AcceptInvitationRequest,
  AuthResponse,
  UserAccount,
  Organisation,
  Establishment,
  User,
} from '@devlab-io/nest-auth-types';

// Helper to create a minimal UserAccount for testing
function createTestUserAccount(overrides?: Partial<UserAccount>): UserAccount {
  const org: Organisation = {
    id: 'org-id',
    name: 'Test Org',
    enabled: true,
    establishments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const est: Establishment = {
    id: 'est-id',
    name: 'Test Est',
    enabled: true,
    organisation: org,
    accounts: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const user: User = {
    id: 'user-id',
    username: 'testuser',
    email: 'test@example.com',
    emailValidated: true,
    enabled: true,
    acceptedTerms: true,
    acceptedPrivacyPolicy: true,
    credentials: [],
    actions: [],
    accounts: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    id: 'account-id',
    organisation: org,
    establishment: est,
    user,
    roles: [],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Mock fetch
global.fetch = jest.fn();

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    // Clear AuthState before each test
    AuthState.clear();
    // Initialize AuthState for tests
    // No token is set, so initialization will return null but state will be initialized
    await AuthState.initialize({
      baseURL: 'https://api.example.com',
      timeout: 30000,
    });
    // Set a mock token after initialization
    AuthState.setToken('test-token');

    service = new AuthService();
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in and set token', async () => {
      const request: SignInRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse: AuthResponse = {
        jwt: {
          accessToken: 'access-token',
          expiresIn: 3600000,
        },
        user: {
          id: 'user-id',
          username: 'testuser',
          email: 'test@example.com',
          emailValidated: true,
          enabled: true,
          acceptedTerms: true,
          acceptedPrivacyPolicy: true,
          credentials: [],
          actions: [],
          accounts: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        userAccount: createTestUserAccount(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => mockResponse,
      });

      const result = await service.signIn(request);

      expect(result).toEqual(mockResponse);
      expect(AuthState.token).toBe('access-token');
      expect(AuthState.initialized).toBe(true);
    });

    it('should not set token if no access token in response', async () => {
      // AuthState is already initialized in beforeEach
      AuthState.setToken(null); // Clear token before signIn

      const request: SignInRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const userAccount = createTestUserAccount();
      const mockResponse: AuthResponse = {
        jwt: {
          accessToken: '',
          expiresIn: 0,
        },
        user: userAccount.user,
        userAccount,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => mockResponse,
      });

      await service.signIn(request);

      // Token should not be set if accessToken is empty
      expect(AuthState.token).toBeNull();
    });
  });

  describe('signUp', () => {
    it('should sign up successfully', async () => {
      const request: SignUpRequest = {
        email: 'test@example.com',
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        credentials: [
          {
            type: 'password',
            password: 'password123',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => null,
        },
      });

      await service.signUp(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/sign-up'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        }),
      );
    });
  });

  describe('signOut', () => {
    it('should sign out and clear state', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => null,
        },
      });

      await service.signOut();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/sign-out'),
        expect.objectContaining({
          method: 'POST',
        }),
      );
      // After signOut, token should be cleared but state remains initialized
      expect(AuthState.token).toBeNull();
      expect(AuthState.initialized).toBe(true);
    });
  });

  describe('getAccount', () => {
    it('should get account and update cache', async () => {
      const account = createTestUserAccount();

      // Mock fetch - jest.clearAllMocks() was called in beforeEach, so we need to set it up again
      (global.fetch as jest.Mock) = jest.fn().mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => account,
      });

      const result = await service.getAccount();

      expect(result).toEqual(account);
      expect(AuthState.userAccount).toEqual(account);
    });
  });

  describe('invite', () => {
    it('should send invitation', async () => {
      const request: InviteRequest = {
        email: 'test@example.com',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => null,
        },
      });

      await service.invite(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/invite'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        }),
      );
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation and set token', async () => {
      const request: AcceptInvitationRequest = {
        token: 'invitation-token',
        email: 'test@example.com',
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        credentials: [
          {
            type: 'password',
            password: 'password123',
          },
        ],
      };

      const mockResponse: AuthResponse = {
        jwt: {
          accessToken: 'access-token',
          expiresIn: 3600000,
        },
        user: {
          id: 'user-id',
          username: 'testuser',
          email: 'test@example.com',
          emailValidated: true,
          enabled: true,
          acceptedTerms: true,
          acceptedPrivacyPolicy: true,
          credentials: [],
          actions: [],
          accounts: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        userAccount: createTestUserAccount(),
      };

      // Mock fetch - jest.clearAllMocks() was called in beforeEach, so we need to set it up again
      (global.fetch as jest.Mock) = jest.fn().mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => mockResponse,
      });

      const result = await service.acceptInvitation(request);

      expect(result).toEqual(mockResponse);
      expect(AuthState.token).toBe('access-token');
      expect(AuthState.initialized).toBe(true);
    });
  });
});
