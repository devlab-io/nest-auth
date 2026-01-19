import { normalize, capitalize, route } from './string.utils';

describe('StringUtils', () => {
  describe('normalize', () => {
    it('should convert to lowercase', () => {
      expect(normalize('HELLO')).toBe('hello');
      expect(normalize('WORLD')).toBe('world');
    });

    it('should remove accents', () => {
      expect(normalize('éàèùç')).toBe('eaeuc');
      expect(normalize('ÉÀÈÙÇ')).toBe('eaeuc');
      expect(normalize('ñáéíóú')).toBe('naeiou');
      expect(normalize('ÑÁÉÍÓÚ')).toBe('naeiou');
    });

    it('should remove special characters', () => {
      expect(normalize('hello-world!')).toBe('helloworld');
      expect(normalize('user@example.com')).toBe('userexamplecom');
      expect(normalize('test_123')).toBe('test123');
      expect(normalize('foo.bar')).toBe('foobar');
    });

    it('should keep only letters and digits', () => {
      expect(normalize('user123')).toBe('user123');
      expect(normalize('user-123_test')).toBe('user123test');
      expect(normalize('abc123def456')).toBe('abc123def456');
    });

    it('should handle empty string', () => {
      expect(normalize('')).toBe('');
    });

    it('should handle complex strings with multiple special characters', () => {
      expect(normalize('Jean-Pierre')).toBe('jeanpierre');
      expect(normalize('José María')).toBe('josemaria');
      expect(normalize('François Müeller')).toBe('francoismueller');
    });

    it('should handle strings with only special characters', () => {
      expect(normalize('!@#$%^&*()')).toBe('');
      expect(normalize('---')).toBe('');
    });

    it('should handle strings with only digits', () => {
      expect(normalize('123456')).toBe('123456');
    });

    it('should handle strings with only letters', () => {
      expect(normalize('abcdef')).toBe('abcdef');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter of each word', () => {
      expect(capitalize('hello world')).toBe('Hello World');
      expect(capitalize('foo bar baz')).toBe('Foo Bar Baz');
    });

    it('should handle single word', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world')).toBe('World');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle already capitalized words', () => {
      expect(capitalize('HELLO WORLD')).toBe('Hello World');
      expect(capitalize('FOO BAR')).toBe('Foo Bar');
    });

    it('should handle mixed case', () => {
      expect(capitalize('hELLo WoRLd')).toBe('Hello World');
      expect(capitalize('tEsT cAsE')).toBe('Test Case');
    });

    it('should handle multiple spaces', () => {
      expect(capitalize('hello   world')).toBe('Hello   World');
      expect(capitalize('foo    bar')).toBe('Foo    Bar');
    });

    it('should handle single character', () => {
      expect(capitalize('a')).toBe('A');
      expect(capitalize('z')).toBe('Z');
    });

    it('should handle single character words', () => {
      expect(capitalize('a b c')).toBe('A B C');
    });

    it('should handle strings with only spaces', () => {
      expect(capitalize('   ')).toBe('   ');
    });

    it('should handle strings starting with spaces', () => {
      expect(capitalize(' hello world')).toBe(' Hello World');
    });

    it('should handle strings ending with spaces', () => {
      expect(capitalize('hello world ')).toBe('Hello World ');
    });
  });

  describe('route', () => {
    it('should remove leading slash', () => {
      expect(route('/auth/reset-password')).toBe('auth/reset-password');
      expect(route('/users')).toBe('users');
    });

    it('should remove trailing slash', () => {
      expect(route('auth/reset-password/')).toBe('auth/reset-password');
      expect(route('users/')).toBe('users');
    });

    it('should remove both leading and trailing slashes', () => {
      expect(route('/auth/reset-password/')).toBe('auth/reset-password');
      expect(route('/users/')).toBe('users');
    });

    it('should handle route without slashes', () => {
      expect(route('auth/reset-password')).toBe('auth/reset-password');
      expect(route('users')).toBe('users');
    });

    it('should handle empty string', () => {
      expect(route('')).toBe('');
    });

    it('should handle undefined', () => {
      expect(route(undefined)).toBe('');
    });

    it('should handle route with only slash', () => {
      expect(route('/')).toBe('');
      expect(route('//')).toBe('');
    });

    it('should handle URL with protocol', () => {
      expect(route('https://example.com/')).toBe('https://example.com');
      expect(route('https://example.com')).toBe('https://example.com');
      expect(route('/https://example.com/')).toBe('https://example.com');
    });

    it('should handle complex routes', () => {
      expect(route('/api/v1/users/123/')).toBe('api/v1/users/123');
      expect(route('/auth/reset-password?token=abc')).toBe(
        'auth/reset-password?token=abc',
      );
    });

    it('should handle routes with multiple slashes', () => {
      expect(route('//auth//reset-password//')).toBe('/auth//reset-password/');
      expect(route('///users///')).toBe('//users//');
    });

    it('should preserve internal slashes', () => {
      expect(route('/api/v1/users')).toBe('api/v1/users');
      expect(route('api/v1/users/')).toBe('api/v1/users');
    });
  });
});
