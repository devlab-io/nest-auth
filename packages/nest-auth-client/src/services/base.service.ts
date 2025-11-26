import { AuthState } from '../state/auth.state';

/**
 * Base service class for making HTTP requests
 * Provides common functionality for all API services
 * Uses AuthState for configuration and authentication
 */
export abstract class BaseService {
  /**
   * Internal method to make HTTP requests
   */
  protected async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      params?: Record<string, string | number | boolean | string[] | Date>;
    } = {},
  ): Promise<T> {
    const { method = 'GET', body, params } = options;

    // Get configuration from AuthState
    const baseURL = AuthState.baseURL;
    const timeout = AuthState.timeout;
    const defaultHeaders = AuthState.headers;
    const token = AuthState.token;

    // Build URL with query parameters
    const url = new URL(endpoint, baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // Handle arrays by appending each value
            value.forEach((item) => {
              url.searchParams.append(key, String(item));
            });
          } else if (value instanceof Date) {
            url.searchParams.append(key, value.toISOString());
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }

    // Prepare headers
    const headers: Record<string, string> = { ...defaultHeaders };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };

    if (body !== undefined && body !== null) {
      requestOptions.body = JSON.stringify(body);
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
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
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Check if the client is initialized
   */
  protected ensureInitialized(): void {
    if (!AuthState.initialized) {
      throw new Error(
        'AuthClient not initialized. Please call AuthClient.initialize() first.',
      );
    }
  }
}
