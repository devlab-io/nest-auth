import { claim, ClaimsUtils } from './claims.utils';
import { Claim, ClaimAction, ClaimScope } from '../types';

describe('Claims Utils', () => {
  describe('claim', () => {
    it('should create a claim with the provided values', () => {
      const result = claim(ClaimAction.READ, ClaimScope.ANY, 'users');
      expect(result.action).toBe(ClaimAction.READ);
      expect(result.scope).toBe(ClaimScope.ANY);
      expect(result.resource).toBe('users');
    });

    it('should create a claim that can be converted to string', () => {
      const result = claim(
        ClaimAction.CREATE,
        ClaimScope.ORGANISATION,
        'establishments',
      );
      const claimString = result.toString();
      expect(claimString).toBe('create:organisation:establishments');
    });

    it('should handle all valid actions', () => {
      const actions = [
        ClaimAction.ADMIN,
        ClaimAction.CREATE,
        ClaimAction.READ,
        ClaimAction.UPDATE,
        ClaimAction.ENABLE,
        ClaimAction.DISABLE,
        ClaimAction.EXECUTE,
        ClaimAction.DELETE,
      ];

      actions.forEach((action) => {
        const result = claim(action, ClaimScope.ANY, 'test');
        expect(result.action).toBe(action);
      });
    });

    it('should handle all valid scopes', () => {
      const scopes = [
        ClaimScope.ADMIN,
        ClaimScope.ANY,
        ClaimScope.ORGANISATION,
        ClaimScope.ESTABLISHMENT,
        ClaimScope.OWN,
      ];

      scopes.forEach((scope) => {
        const result = claim(ClaimAction.READ, scope, 'test');
        expect(result.scope).toBe(scope);
      });
    });

    it('should return a Claim object that matches the interface', () => {
      const result = claim(ClaimAction.READ, ClaimScope.ANY, 'users');
      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('scope');
      expect(result).toHaveProperty('resource');
      expect(typeof result.action).toBe('string');
      expect(typeof result.scope).toBe('string');
      expect(typeof result.resource).toBe('string');
    });
  });

  describe('ClaimsUtils.parse', () => {
    describe('parsing from string', () => {
      it('should parse a valid claim string with all parts', () => {
        const result = ClaimsUtils.parse('read:any:users');
        expect(result.action).toBe(ClaimAction.READ);
        expect(result.scope).toBe(ClaimScope.ANY);
        expect(result.resource).toBe('users');
      });

      it('should parse a claim with organisation scope', () => {
        const result = ClaimsUtils.parse('create:organisation:establishments');
        expect(result.action).toBe(ClaimAction.CREATE);
        expect(result.scope).toBe(ClaimScope.ORGANISATION);
        expect(result.resource).toBe('establishments');
      });

      it('should parse a claim with establishment scope', () => {
        const result = ClaimsUtils.parse('update:establishment:menus');
        expect(result.action).toBe(ClaimAction.UPDATE);
        expect(result.scope).toBe(ClaimScope.ESTABLISHMENT);
        expect(result.resource).toBe('menus');
      });

      it('should parse a claim with own scope', () => {
        const result = ClaimsUtils.parse('delete:own:accounts');
        expect(result.action).toBe(ClaimAction.DELETE);
        expect(result.scope).toBe(ClaimScope.OWN);
        expect(result.resource).toBe('accounts');
      });

      it('should parse a claim with execute action', () => {
        const result = ClaimsUtils.parse('execute:any:reports');
        expect(result.action).toBe(ClaimAction.EXECUTE);
        expect(result.scope).toBe(ClaimScope.ANY);
        expect(result.resource).toBe('reports');
      });

      it('should parse a claim with admin action and scope', () => {
        const result = ClaimsUtils.parse('admin:admin:admin');
        expect(result.action).toBe(ClaimAction.ADMIN);
        expect(result.scope).toBe(ClaimScope.ADMIN);
        expect(result.resource).toBe('admin');
      });

      it('should parse a claim with enable action', () => {
        const result = ClaimsUtils.parse('enable:any:users');
        expect(result.action).toBe(ClaimAction.ENABLE);
        expect(result.scope).toBe(ClaimScope.ANY);
        expect(result.resource).toBe('users');
      });

      it('should parse a claim with disable action', () => {
        const result = ClaimsUtils.parse('disable:organisation:users');
        expect(result.action).toBe(ClaimAction.DISABLE);
        expect(result.scope).toBe(ClaimScope.ORGANISATION);
        expect(result.resource).toBe('users');
      });

      it('should parse a claim with resource containing special characters', () => {
        const result = ClaimsUtils.parse('read:any:user-accounts');
        expect(result.action).toBe(ClaimAction.READ);
        expect(result.scope).toBe(ClaimScope.ANY);
        expect(result.resource).toBe('user-accounts');
      });

      it('should throw an error for invalid claim format (missing parts)', () => {
        expect(() => ClaimsUtils.parse('read:any')).toThrow(
          'Invalid claim format',
        );
        expect(() => ClaimsUtils.parse('read')).toThrow('Invalid claim format');
        expect(() => ClaimsUtils.parse('')).toThrow('Invalid claim format');
      });

      it('should parse a claim with extra parts (ignores extra parts)', () => {
        // When splitting by ':', extra parts are ignored
        const result = ClaimsUtils.parse('read:any:users:extra');
        expect(result.action).toBe(ClaimAction.READ);
        expect(result.scope).toBe(ClaimScope.ANY);
        expect(result.resource).toBe('users');
      });

      it('should throw an error for invalid action', () => {
        expect(() => ClaimsUtils.parse('invalid:any:users')).toThrow(
          'Invalid action',
        );
        expect(() => ClaimsUtils.parse('readwrite:any:users')).toThrow(
          'Invalid action',
        );
      });

      it('should throw an error for invalid scope', () => {
        expect(() => ClaimsUtils.parse('read:invalid:users')).toThrow(
          'Invalid scope',
        );
        expect(() => ClaimsUtils.parse('read:global:users')).toThrow(
          'Invalid scope',
        );
      });

      it('should throw an error for empty action', () => {
        // Empty action is caught by the format check first
        expect(() => ClaimsUtils.parse(':any:users')).toThrow(
          'Invalid claim format',
        );
      });

      it('should throw an error for empty scope', () => {
        // Empty scope is caught by the format check first
        expect(() => ClaimsUtils.parse('read::users')).toThrow(
          'Invalid claim format',
        );
      });

      it('should throw an error for empty resource', () => {
        expect(() => ClaimsUtils.parse('read:any:')).toThrow(
          'Invalid claim format',
        );
      });
    });

    describe('parsing from tuple', () => {
      it('should parse a claim from a tuple', () => {
        const result = ClaimsUtils.parse([
          ClaimAction.READ,
          ClaimScope.ANY,
          'users',
        ]);
        expect(result.action).toBe(ClaimAction.READ);
        expect(result.scope).toBe(ClaimScope.ANY);
        expect(result.resource).toBe('users');
      });

      it('should parse a claim from a tuple with organisation scope', () => {
        const result = ClaimsUtils.parse([
          ClaimAction.CREATE,
          ClaimScope.ORGANISATION,
          'establishments',
        ]);
        expect(result.action).toBe(ClaimAction.CREATE);
        expect(result.scope).toBe(ClaimScope.ORGANISATION);
        expect(result.resource).toBe('establishments');
      });

      it('should parse a claim from a tuple with establishment scope', () => {
        const result = ClaimsUtils.parse([
          ClaimAction.UPDATE,
          ClaimScope.ESTABLISHMENT,
          'menus',
        ]);
        expect(result.action).toBe(ClaimAction.UPDATE);
        expect(result.scope).toBe(ClaimScope.ESTABLISHMENT);
        expect(result.resource).toBe('menus');
      });

      it('should parse a claim from a tuple with own scope', () => {
        const result = ClaimsUtils.parse([
          ClaimAction.DELETE,
          ClaimScope.OWN,
          'accounts',
        ]);
        expect(result.action).toBe(ClaimAction.DELETE);
        expect(result.scope).toBe(ClaimScope.OWN);
        expect(result.resource).toBe('accounts');
      });

      it('should throw an error for invalid action in tuple', () => {
        expect(() =>
          ClaimsUtils.parse([
            'invalid' as ClaimAction,
            ClaimScope.ANY,
            'users',
          ]),
        ).toThrow('Invalid action');
      });

      it('should throw an error for invalid scope in tuple', () => {
        expect(() =>
          ClaimsUtils.parse([
            ClaimAction.READ,
            'invalid' as ClaimScope,
            'users',
          ]),
        ).toThrow('Invalid scope');
      });
    });

    describe('parsing from Claim object', () => {
      it('should parse a claim from a Claim object', () => {
        const claimObj: Claim = {
          action: ClaimAction.READ,
          scope: ClaimScope.ANY,
          resource: 'users',
        };
        const result = ClaimsUtils.parse(claimObj);
        expect(result.action).toBe(ClaimAction.READ);
        expect(result.scope).toBe(ClaimScope.ANY);
        expect(result.resource).toBe('users');
      });

      it('should parse a claim from a Claim object with organisation scope', () => {
        const claimObj: Claim = {
          action: ClaimAction.CREATE,
          scope: ClaimScope.ORGANISATION,
          resource: 'establishments',
        };
        const result = ClaimsUtils.parse(claimObj);
        expect(result.action).toBe(ClaimAction.CREATE);
        expect(result.scope).toBe(ClaimScope.ORGANISATION);
        expect(result.resource).toBe('establishments');
      });

      it('should parse a claim created with the claim() function', () => {
        const claimObj = claim(
          ClaimAction.UPDATE,
          ClaimScope.ESTABLISHMENT,
          'menus',
        );
        const result = ClaimsUtils.parse(claimObj);
        expect(result.action).toBe(ClaimAction.UPDATE);
        expect(result.scope).toBe(ClaimScope.ESTABLISHMENT);
        expect(result.resource).toBe('menus');
      });
    });
  });

  describe('ClaimsUtils.serialize', () => {
    it('should serialize a claim to a string', () => {
      const claimObj = claim(ClaimAction.READ, ClaimScope.ANY, 'users');
      const serialized = ClaimsUtils.serialize(claimObj);
      expect(serialized).toBe('read:any:users');
    });

    it('should serialize a claim with organisation scope', () => {
      const claimObj = claim(
        ClaimAction.CREATE,
        ClaimScope.ORGANISATION,
        'establishments',
      );
      const serialized = ClaimsUtils.serialize(claimObj);
      expect(serialized).toBe('create:organisation:establishments');
    });

    it('should serialize a claim with establishment scope', () => {
      const claimObj = claim(
        ClaimAction.UPDATE,
        ClaimScope.ESTABLISHMENT,
        'menus',
      );
      const serialized = ClaimsUtils.serialize(claimObj);
      expect(serialized).toBe('update:establishment:menus');
    });

    it('should serialize a claim with own scope', () => {
      const claimObj = claim(ClaimAction.DELETE, ClaimScope.OWN, 'accounts');
      const serialized = ClaimsUtils.serialize(claimObj);
      expect(serialized).toBe('delete:own:accounts');
    });

    it('should serialize a claim with admin action and scope', () => {
      const claimObj = claim(ClaimAction.ADMIN, ClaimScope.ADMIN, 'admin');
      const serialized = ClaimsUtils.serialize(claimObj);
      expect(serialized).toBe('admin:admin:admin');
    });

    it('should serialize a claim with enable action', () => {
      const claimObj = claim(ClaimAction.ENABLE, ClaimScope.ANY, 'users');
      const serialized = ClaimsUtils.serialize(claimObj);
      expect(serialized).toBe('enable:any:users');
    });

    it('should serialize a claim with disable action', () => {
      const claimObj = claim(
        ClaimAction.DISABLE,
        ClaimScope.ORGANISATION,
        'users',
      );
      const serialized = ClaimsUtils.serialize(claimObj);
      expect(serialized).toBe('disable:organisation:users');
    });

    it('should serialize a claim with execute action', () => {
      const claimObj = claim(ClaimAction.EXECUTE, ClaimScope.ANY, 'reports');
      const serialized = ClaimsUtils.serialize(claimObj);
      expect(serialized).toBe('execute:any:reports');
    });

    it('should serialize a claim with resource containing special characters', () => {
      const claimObj = claim(ClaimAction.READ, ClaimScope.ANY, 'user-accounts');
      const serialized = ClaimsUtils.serialize(claimObj);
      expect(serialized).toBe('read:any:user-accounts');
    });

    it('should be idempotent with parse', () => {
      const originalString = 'read:any:users';
      const parsed = ClaimsUtils.parse(originalString);
      const serialized = ClaimsUtils.serialize(parsed);
      expect(serialized).toBe(originalString);
    });
  });

  describe('Round-trip conversion', () => {
    it('should parse and serialize back to the same string', () => {
      const originalString = 'read:any:users';
      const parsed = ClaimsUtils.parse(originalString);
      const serialized = ClaimsUtils.serialize(parsed);
      expect(serialized).toBe(originalString);
    });

    it('should parse from tuple and serialize to string', () => {
      const tuple: [ClaimAction, ClaimScope, string] = [
        ClaimAction.CREATE,
        ClaimScope.ORGANISATION,
        'establishments',
      ];
      const parsed = ClaimsUtils.parse(tuple);
      const serialized = ClaimsUtils.serialize(parsed);
      expect(serialized).toBe('create:organisation:establishments');
    });

    it('should parse from Claim object and serialize to string', () => {
      const claimObj = claim(
        ClaimAction.UPDATE,
        ClaimScope.ESTABLISHMENT,
        'menus',
      );
      const parsed = ClaimsUtils.parse(claimObj);
      const serialized = ClaimsUtils.serialize(parsed);
      expect(serialized).toBe('update:establishment:menus');
    });
  });
});
