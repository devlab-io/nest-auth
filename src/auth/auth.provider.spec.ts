import { provideAuthServices } from './auth.provider';

// Mock the services to avoid dependency issues
// Define mock classes directly in the factory to avoid hoisting issues
jest.mock('./services', () => {
  const MockUserService = class UserService {};
  const MockActionTokenService = class ActionTokenService {};
  const MockRoleService = class RoleService {};

  return {
    UserService: MockUserService,
    ActionTokenService: MockActionTokenService,
    RoleService: MockRoleService,
  };
});

// Import the mocked services after the mock is set up
import { UserService, ActionTokenService, RoleService } from './services';

describe('AuthProvider', () => {
  describe('provideAuthServices', () => {
    it('should return an array of providers', () => {
      const providers = provideAuthServices();

      expect(providers).toBeInstanceOf(Array);
      expect(providers.length).toBe(3);
    });

    it('should return UserService, ActionTokenService, and RoleService', () => {
      const providers = provideAuthServices();

      expect(providers).toContain(UserService);
      expect(providers).toContain(ActionTokenService);
      expect(providers).toContain(RoleService);
    });

    it('should return providers in the correct order', () => {
      const providers = provideAuthServices();

      expect(providers[0]).toBe(UserService);
      expect(providers[1]).toBe(ActionTokenService);
      expect(providers[2]).toBe(RoleService);
    });

    it('should return valid NestJS providers', () => {
      const providers = provideAuthServices();

      providers.forEach((provider) => {
        expect(provider).toBeDefined();
        // In NestJS, providers are typically classes
        expect(typeof provider).toBe('function');
      });
    });

    it('should return the same providers on multiple calls', () => {
      const providers1 = provideAuthServices();
      const providers2 = provideAuthServices();

      expect(providers1).toEqual(providers2);
    });

    it('should return only the three expected services', () => {
      const providers = provideAuthServices();

      expect(providers.length).toBe(3);
      // Verify all items are classes/functions
      providers.forEach((provider) => {
        expect(typeof provider).toBe('function');
      });
    });
  });
});
