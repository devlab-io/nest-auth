import { Role, UserAccount } from '@devlab-io/nest-auth-types';

export interface AuthStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface AuthStateConfig {
  baseURL: string;
  clientId?: string;
  timeout?: number;
  headers?: Record<string, string>;
  cookieName?: string;
  storage?: AuthStorage | null;
}

/**
 * Callback function called when the user account changes
 */
export type UserAccountChangeCallback = (
  userAccount: UserAccount | null,
) => void;

/**
 * Authentication state
 */
export class AuthState {
  private static _baseURL: string | null = null;
  private static _clientId: string | null = null;
  private static _timeout: number = 30000;
  private static _headers: Record<string, string> = {};
  private static _cookieName: string = 'access_token';
  private static _storage: AuthStorage | null = null;
  private static _token: string | null = null;
  private static _initialized: boolean = false;
  private static _userAccount: UserAccount | null = null;
  private static _userAccountCallbacks: Set<UserAccountChangeCallback> =
    new Set();

  /**
   * Get the current user account of the logged in user
   */
  public static get userAccount(): UserAccount | null {
    return this._userAccount;
  }

  /**
   * Check if the current user account has a specific role
   * @param roleName - The name of the role to check
   * @returns true if the user account has the role, false otherwise
   */
  public static hasRole(roleName: string): boolean {
    if (!this._userAccount || !this._userAccount.roles) {
      return false;
    }

    return this._userAccount.roles.some(
      (role: Role): boolean => role.name === roleName,
    );
  }

  /**
   * Get the base URL
   */
  public static get baseURL(): string {
    if (!this._baseURL) {
      throw new Error(
        'AuthState not initialized. Call AuthClient.initialize() first.',
      );
    }
    return this._baseURL;
  }

  /**
   * Get the client ID
   */
  public static get clientId(): string | null {
    return this._clientId;
  }

  /**
   * Get the request timeout
   */
  public static get timeout(): number {
    return this._timeout;
  }

  /**
   * Get the default request headers
   */
  public static get headers(): Record<string, string> {
    return this._headers;
  }

  /**
   * Get the current authentication token
   */
  public static get token(): string | null {
    // If token is already in memory, return it
    if (this._token) {
      return this._token;
    }

    // Try to get token from cookies first (browser environment)
    let token = this.getTokenFromCookies();

    // If no token from cookies, try storage
    if (!token && this._storage) {
      token = this._storage.getItem(this._cookieName);
    }

    // If token found, synchronize it everywhere
    if (token) {
      this.setToken(token);
    }

    return token;
  }

  /**
   * Is the auth state initialized ?
   */
  public static get initialized(): boolean {
    return this._initialized;
  }

  /**
   * Initialize the state with configuration and attempt to restore session
   * @param config - Configuration for the auth state
   * @returns The user account if a valid session is found, null otherwise
   */
  public static async initialize(
    config: AuthStateConfig,
  ): Promise<UserAccount | null> {
    try {
      // Validate configuration
      if (!config || !config.baseURL) {
        throw new Error('AuthStateConfig.baseURL is required');
      }

      // Set configuration
      this._baseURL = config.baseURL.replace(/\/$/, ''); // Remove trailing slash
      this._clientId = config.clientId || null;
      this._timeout = config.timeout || 30000;
      this._headers = {
        'Content-Type': 'application/json',
        ...config.headers,
      };
      this._cookieName = config.cookieName || 'access_token';
      this.setStorage(config.storage);
      this._initialized = true;
    } catch (error) {
      // If configuration fails, reset everything
      this._initialized = false;
      this._baseURL = null;
      throw error;
    }

    // Look for an existing token
    const token = this.token;
    if (!token) {
      this.clear();
      return null;
    }

    // Try to fetch the user account to validate the session
    try {
      const account = await this.validateSession();
      if (account) {
        this.setUserAccount(account);
        return account;
      } else {
        this.clear();
        return null;
      }
    } catch {
      this.clear();
      return null;
    }
  }

  /**
   * Clear all authentication data (token, user account, cache, cookie)
   */
  public static clear(): void {
    // Use setToken to ensure synchronization across all sources
    this.setToken(null);
    // setUserAccount will notify callbacks
    this.setUserAccount(null);
  }

  /**
   * Set the authentication token
   * Automatically synchronizes the token across memory, storage, and cookies
   * Used internally and by AuthService after sign-in
   */
  public static setToken(value: string | null): void {
    this._token = value;

    // Synchronize with storage
    if (this._storage) {
      if (value) {
        this._storage.setItem(this._cookieName, value);
      } else {
        // If value is null, remove from storage
        this._storage.removeItem(this._cookieName);
      }
    }

    // Synchronize with cookies (browser environment)
    if (typeof document !== 'undefined') {
      if (value) {
        // Set cookie
        document.cookie = `${this._cookieName}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
      } else {
        // Remove cookie
        document.cookie = `${this._cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    }
  }

  /**
   * Set the user account
   * Used by AuthService to cache the account
   * Notifies all registered callbacks when the account changes
   */
  public static setUserAccount(value: UserAccount | null): void {
    // Only notify if the value actually changed
    const hasChanged =
      this._userAccount !== value &&
      (this._userAccount === null ||
        value === null ||
        this._userAccount.id !== value.id);

    this._userAccount = value;

    // Notify all callbacks if the value changed
    if (hasChanged) {
      this._userAccountCallbacks.forEach((callback) => {
        try {
          callback(value);
        } catch (error) {
          // Log error but don't break the chain
          console.error('Error in userAccount change callback:', error);
        }
      });
    }
  }

  /**
   * Subscribe to user account changes
   * @param callback - Function to call when the user account changes
   * @returns A function to unsubscribe from changes
   */
  public static onUserAccountChange(
    callback: UserAccountChangeCallback,
  ): () => void {
    this._userAccountCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this._userAccountCallbacks.delete(callback);
    };
  }

  /**
   * Unsubscribe from user account changes
   * @param callback - The callback function to remove
   */
  public static offUserAccountChange(
    callback: UserAccountChangeCallback,
  ): void {
    this._userAccountCallbacks.delete(callback);
  }

  /**
   * Set the storage mechanism
   * Uses localStorage by default in browser environment, or custom storage if provided
   */
  private static setStorage(storage: AuthStorage | null | undefined): void {
    if (storage !== undefined) {
      this._storage = storage;
    } else {
      // Default to localStorage in browser environment
      this._storage =
        typeof window !== 'undefined' && window.localStorage
          ? {
              getItem: (key: string) => window.localStorage.getItem(key),
              setItem: (key: string, value: string) =>
                window.localStorage.setItem(key, value),
              removeItem: (key: string) => window.localStorage.removeItem(key),
            }
          : null;
    }
  }

  /**
   * Extract token from cookies in document.cookie (browser environment)
   */
  private static getTokenFromCookies(): string | null {
    if (typeof document === 'undefined') {
      return null; // Not in browser environment
    }

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this._cookieName && value) {
        const decodedValue = decodeURIComponent(value);
        return decodedValue;
      }
    }
    return null;
  }

  /**
   * Validate the session by fetching the user account
   */
  private static async validateSession(): Promise<UserAccount | null> {
    const baseURL = this._baseURL!;
    const timeout = this._timeout;
    const token = this._token;

    if (!token) {
      return null;
    }

    const headers: Record<string, string> = {
      ...this._headers,
      Authorization: `Bearer ${token}`,
    };

    if (this._clientId) {
      headers['X-Client-Id'] = this._clientId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${baseURL}/auth/account`, {
        method: 'GET',
        headers,
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const account = await response.json();
        return account as UserAccount;
      }

      return null;
    } catch {
      clearTimeout(timeoutId);
      return null;
    }
  }
}
