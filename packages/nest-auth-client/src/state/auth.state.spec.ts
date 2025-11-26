import { AuthState, AuthStateConfig } from './auth.state';
import {
  UserAccount,
  Organisation,
  Establishment,
  User,
} from '@devlab-io/nest-auth-types';

// Mock fetch
global.fetch = jest.fn();

// Mock document for browser environment
const mockDocument = {
  cookie: '',
};
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

// Mock window.localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(global, 'window', {
  value: {
    localStorage: mockLocalStorage,
  },
  writable: true,
});

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

describe('AuthState', () => {
  beforeEach(() => {
    // Clear all state before each test
    AuthState.clear();
    jest.clearAllMocks();
    mockDocument.cookie = '';
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  describe('initialize', () => {
    const baseConfig: AuthStateConfig = {
      baseURL: 'https://api.example.com',
      timeout: 30000,
    };

    it('should initialize with configuration', async () => {
      const account = createTestUserAccount();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => account,
      });

      mockLocalStorage.getItem.mockReturnValue('test-token');

      const result = await AuthState.initialize(baseConfig);

      expect(result).toEqual(account);
      expect(AuthState.baseURL).toBe('https://api.example.com');
      expect(AuthState.timeout).toBe(30000);
      expect(AuthState.initialized).toBe(true);
      expect(AuthState.userAccount).toEqual(account);
    });

    it('should return null if no token found', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await AuthState.initialize(baseConfig);

      expect(result).toBeNull();
      expect(AuthState.initialized).toBe(false);
      expect(AuthState.token).toBeNull();
    });

    it('should return null if token is invalid', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await AuthState.initialize(baseConfig);

      expect(result).toBeNull();
      expect(AuthState.initialized).toBe(false);
      // After clear(), token should be null (setToken(null) was called)
      // But we need to clear localStorage mock too
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(AuthState.token).toBeNull();
    });

    it('should read token from cookies first', async () => {
      const account = createTestUserAccount();

      mockDocument.cookie = 'auth-token=cookie-token-value';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => account,
      });

      const result = await AuthState.initialize(baseConfig);

      expect(result).toEqual(account);
      expect(AuthState.token).toBe('cookie-token-value');
      // Should not have called localStorage.getItem for token
      expect(mockLocalStorage.getItem).not.toHaveBeenCalledWith('auth-token');
    });

    it('should fallback to localStorage if no cookie', async () => {
      const account = createTestUserAccount();

      mockDocument.cookie = '';
      mockLocalStorage.getItem.mockReturnValue('storage-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => account,
      });

      const result = await AuthState.initialize(baseConfig);

      expect(result).toEqual(account);
      expect(AuthState.token).toBe('storage-token');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth-token');
    });
  });

  describe('token getter', () => {
    it('should return token from memory if available', () => {
      AuthState.setToken('memory-token');
      expect(AuthState.token).toBe('memory-token');
    });

    it('should read from localStorage if not in memory', () => {
      mockLocalStorage.getItem.mockReturnValue('storage-token');
      expect(AuthState.token).toBe('storage-token');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth-token');
    });

    it('should read from cookies if not in memory or storage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockDocument.cookie = 'auth-token=cookie-token';
      expect(AuthState.token).toBe('cookie-token');
    });

    it('should return null if no token found anywhere', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockDocument.cookie = '';
      expect(AuthState.token).toBeNull();
    });
  });

  describe('setToken', () => {
    it('should set token in memory and storage', () => {
      AuthState.setToken('new-token');
      expect(AuthState.token).toBe('new-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'auth-token',
        'new-token',
      );
    });

    it('should set cookie in browser environment', () => {
      AuthState.setToken('new-token');
      expect(mockDocument.cookie).toContain('auth-token=new-token');
    });

    it('should remove token from storage when set to null', () => {
      AuthState.setToken('token');
      AuthState.setToken(null);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth-token');
      expect(AuthState.token).toBeNull();
    });

    it('should remove cookie when set to null', () => {
      AuthState.setToken('token');
      AuthState.setToken(null);
      expect(mockDocument.cookie).toContain('auth-token=; expires=');
    });
  });

  describe('clear', () => {
    it('should clear all state', () => {
      AuthState.setToken('token');
      AuthState.setUserAccount(createTestUserAccount());
      AuthState.setInitialized(true);

      AuthState.clear();

      expect(AuthState.token).toBeNull();
      expect(AuthState.userAccount).toBeNull();
      expect(AuthState.initialized).toBe(false);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth-token');
    });
  });

  describe('getters', () => {
    it('should throw error if baseURL accessed before initialization', () => {
      AuthState.clear();
      expect(() => AuthState.baseURL).toThrow(
        'AuthState not initialized. Call AuthClient.initialize() first.',
      );
    });

    it('should return default timeout', () => {
      expect(AuthState.timeout).toBe(30000);
    });

    it('should return headers', async () => {
      await AuthState.initialize({
        baseURL: 'https://api.example.com',
        headers: { 'X-Custom': 'value' },
      });
      expect(AuthState.headers).toEqual({
        'Content-Type': 'application/json',
        'X-Custom': 'value',
      });
    });
  });
});
