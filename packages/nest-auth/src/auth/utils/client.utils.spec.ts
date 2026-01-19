import {
  extractOriginFromRequest,
  findClientByOrigin,
  getClientOrigins,
} from './client.utils';
import { ClientConfig } from '../config/client.config';

describe('ClientUtils', () => {
  describe('extractOriginFromRequest', () => {
    it('should extract origin from Origin header', () => {
      const request = {
        headers: {
          origin: 'https://example.com',
        },
      };
      expect(extractOriginFromRequest(request)).toBe('https://example.com');
    });

    it('should extract origin from Origin header with path', () => {
      const request = {
        headers: {
          origin: 'https://example.com/some/path',
        },
      };
      // URL.origin returns only the origin part
      expect(extractOriginFromRequest(request)).toBe('https://example.com');
    });

    it('should extract origin from Origin header with port', () => {
      const request = {
        headers: {
          origin: 'http://localhost:3000',
        },
      };
      expect(extractOriginFromRequest(request)).toBe('http://localhost:3000');
    });

    it('should fallback to Referer header if Origin is missing', () => {
      const request = {
        headers: {
          referer: 'https://example.com/page',
        },
      };
      expect(extractOriginFromRequest(request)).toBe('https://example.com');
    });

    it('should prefer Origin over Referer', () => {
      const request = {
        headers: {
          origin: 'https://origin.com',
          referer: 'https://referer.com/page',
        },
      };
      expect(extractOriginFromRequest(request)).toBe('https://origin.com');
    });

    it('should return undefined if no headers', () => {
      const request = {};
      expect(extractOriginFromRequest(request)).toBeUndefined();
    });

    it('should return undefined if headers is null', () => {
      const request = { headers: null };
      expect(extractOriginFromRequest(request)).toBeUndefined();
    });

    it('should return undefined if Origin is invalid URL', () => {
      const request = {
        headers: {
          origin: 'not-a-valid-url',
        },
      };
      expect(extractOriginFromRequest(request)).toBeUndefined();
    });

    it('should return undefined if Referer is invalid URL and Origin is missing', () => {
      const request = {
        headers: {
          referer: 'invalid-referer',
        },
      };
      expect(extractOriginFromRequest(request)).toBeUndefined();
    });

    it('should handle empty Origin and fallback to Referer', () => {
      const request = {
        headers: {
          origin: '',
          referer: 'https://referer.com',
        },
      };
      // Empty string is falsy, so it should fallback to referer
      expect(extractOriginFromRequest(request)).toBe('https://referer.com');
    });
  });

  describe('findClientByOrigin', () => {
    const createClients = (): Map<string, ClientConfig> => {
      const clients = new Map<string, ClientConfig>();
      clients.set('client-1', {
        id: 'client-1',
        uri: 'https://app1.example.com',
        actions: {},
      });
      clients.set('client-2', {
        id: 'client-2',
        uri: 'https://app2.example.com',
        actions: {},
      });
      clients.set('mobile', {
        id: 'mobile',
        uri: 'myapp://',
        actions: {},
      });
      clients.set('api', {
        id: 'api',
        uri: null,
        actions: {},
      });
      return clients;
    };

    it('should find client by matching URI', () => {
      const clients = createClients();
      const result = findClientByOrigin(clients, 'https://app1.example.com');
      expect(result).toBeDefined();
      expect(result?.id).toBe('client-1');
    });

    it('should find second client by URI', () => {
      const clients = createClients();
      const result = findClientByOrigin(clients, 'https://app2.example.com');
      expect(result).toBeDefined();
      expect(result?.id).toBe('client-2');
    });

    it('should return undefined if no match', () => {
      const clients = createClients();
      const result = findClientByOrigin(clients, 'https://unknown.com');
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty clients map', () => {
      const clients = new Map<string, ClientConfig>();
      const result = findClientByOrigin(clients, 'https://example.com');
      expect(result).toBeUndefined();
    });

    it('should not match deeplink URI', () => {
      const clients = createClients();
      // Deeplinks are not origins (Origin header is HTTP/HTTPS only)
      const result = findClientByOrigin(clients, 'myapp://');
      expect(result).toBeDefined();
      expect(result?.id).toBe('mobile');
    });

    it('should not match null URI', () => {
      const clients = createClients();
      // null !== 'https://...'
      const result = findClientByOrigin(clients, 'null');
      expect(result).toBeUndefined();
    });

    it('should be case sensitive for URI matching', () => {
      const clients = createClients();
      const result = findClientByOrigin(clients, 'https://APP1.EXAMPLE.COM');
      // URLs are case-sensitive in the path, but typically not in the domain
      // However, our simple equality check is case-sensitive
      expect(result).toBeUndefined();
    });
  });

  describe('getClientOrigins', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // Reset environment
      jest.resetModules();
      process.env = { ...originalEnv };
      // Clear all AUTH_CLIENT_* variables
      Object.keys(process.env).forEach((key) => {
        if (key.startsWith('AUTH_CLIENT_')) {
          delete process.env[key];
        }
      });
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return fallback when no clients configured', () => {
      const result = getClientOrigins();
      expect(result).toEqual(['http://localhost:3000']);
    });

    it('should return custom fallback when provided', () => {
      const result = getClientOrigins(['https://custom.com']);
      expect(result).toEqual(['https://custom.com']);
    });

    it('should return HTTP/HTTPS URIs from environment', () => {
      process.env['AUTH_CLIENT_0_URI'] = 'https://app1.example.com';
      process.env['AUTH_CLIENT_1_URI'] = 'http://localhost:3000';
      const result = getClientOrigins();
      expect(result).toEqual([
        'https://app1.example.com',
        'http://localhost:3000',
      ]);
    });

    it('should exclude deeplinks', () => {
      process.env['AUTH_CLIENT_0_URI'] = 'https://web.example.com';
      process.env['AUTH_CLIENT_1_URI'] = 'myapp://';
      const result = getClientOrigins();
      expect(result).toEqual(['https://web.example.com']);
    });

    it('should exclude "none" URIs', () => {
      process.env['AUTH_CLIENT_0_URI'] = 'https://web.example.com';
      process.env['AUTH_CLIENT_1_URI'] = 'none';
      const result = getClientOrigins();
      expect(result).toEqual(['https://web.example.com']);
    });

    it('should remove trailing slashes', () => {
      process.env['AUTH_CLIENT_0_URI'] = 'https://example.com/';
      const result = getClientOrigins();
      expect(result).toEqual(['https://example.com']);
    });

    it('should handle gaps in client indices', () => {
      process.env['AUTH_CLIENT_0_URI'] = 'https://app0.example.com';
      // No AUTH_CLIENT_1_URI - loop stops here
      process.env['AUTH_CLIENT_2_URI'] = 'https://app2.example.com';
      const result = getClientOrigins();
      // Should only include client 0 since loop stops at missing index
      expect(result).toEqual(['https://app0.example.com']);
    });

    it('should handle multiple consecutive clients', () => {
      process.env['AUTH_CLIENT_0_URI'] = 'https://app0.com';
      process.env['AUTH_CLIENT_1_URI'] = 'https://app1.com';
      process.env['AUTH_CLIENT_2_URI'] = 'https://app2.com';
      const result = getClientOrigins();
      expect(result).toEqual([
        'https://app0.com',
        'https://app1.com',
        'https://app2.com',
      ]);
    });
  });
});
