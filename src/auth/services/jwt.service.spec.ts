import { Test, TestingModule } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { UserAccountService } from './user-account.service';
import { CredentialService } from './credential.service';
import { SessionService } from './session.service';
import { JwtConfig, JwtConfigToken } from '../config/jwt.config';
import { UserAccount, User, JwtToken, JwtPayload } from '../types';
import * as jwt from 'jsonwebtoken';
import { extractTokenFromRequest } from '../utils';

jest.mock('jsonwebtoken', () => {
  const mockSign = jest.fn();
  const mockVerify = jest.fn();
  return {
    sign: mockSign,
    verify: mockVerify,
  };
});

jest.mock('../utils', () => ({
  extractTokenFromRequest: jest.fn(),
}));

describe('JwtService', () => {
  let service: JwtService;

  const mockRequest = {
    headers: {},
    cookies: {},
    user: null,
    userAccount: null,
    res: {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    },
  } as any;

  const mockJwtConfig: JwtConfig = {
    jwt: {
      secret: 'test-secret',
      expiresIn: 3600000, // 1h in milliseconds
    },
  };

  const mockUser: User = {
    id: 'user-id',
    email: 'test@example.com',
    username: 'testuser',
    emailValidated: true,
    enabled: true,
    acceptedTerms: true,
    acceptedPrivacyPolicy: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    credentials: [],
    actions: [],
    accounts: [],
  };

  const mockOrganisation = {
    id: 'org-id',
    name: 'Test Organisation',
    establishments: [],
  };

  const mockEstablishment = {
    id: 'est-id',
    name: 'Test Establishment',
    organisation: mockOrganisation,
    accounts: [],
  };

  const mockRoles = [
    { id: 1, name: 'user' },
    { id: 2, name: 'admin' },
  ];

  const mockUserAccount: UserAccount = {
    id: 'user-account-id',
    organisation: mockOrganisation,
    establishment: mockEstablishment,
    user: mockUser,
    roles: mockRoles,
  };

  const mockUserAccountService = {
    getById: jest.fn(),
  };

  const mockCredentialService = {
    verifyPassword: jest.fn(),
  };

  const mockSessionService = {
    create: jest.fn(),
    deleteByToken: jest.fn(),
    findByToken: jest.fn(),
    isActive: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
        {
          provide: JwtConfigToken,
          useValue: mockJwtConfig,
        },
        {
          provide: UserAccountService,
          useValue: mockUserAccountService,
        },
        {
          provide: CredentialService,
          useValue: mockCredentialService,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
      ],
    }).compile();

    service = await module.resolve<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockRequest.user = null;
    mockRequest.userAccount = null;
  });

  describe('isUserAuthenticated', () => {
    it('should return true if user account is authenticated', () => {
      mockRequest.userAccount = mockUserAccount;

      expect(service.isUserAuthenticated()).toBe(true);
    });

    it('should return false if user account is not authenticated', () => {
      mockRequest.userAccount = null;

      expect(service.isUserAuthenticated()).toBe(false);
    });
  });

  describe('getAuthenticatedUser', () => {
    it('should return the authenticated user', () => {
      mockRequest.userAccount = mockUserAccount;

      const result = service.getAuthenticatedUser();

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user account is not authenticated', () => {
      mockRequest.userAccount = null;

      expect(() => service.getAuthenticatedUser()).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('userHasAnyRoles', () => {
    it('should return true if user account has at least one of the roles', () => {
      mockRequest.userAccount = mockUserAccount;

      expect(service.userHasAnyRoles(['admin', 'moderator'])).toBe(true);
    });

    it('should return false if user account has none of the roles', () => {
      mockRequest.userAccount = mockUserAccount;

      expect(service.userHasAnyRoles(['moderator', 'guest'])).toBe(false);
    });

    it('should throw UnauthorizedException if user account is not authenticated', () => {
      mockRequest.userAccount = null;

      expect(() => service.userHasAnyRoles(['admin'])).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('userHasAllRoles', () => {
    it('should return true if user account has all the roles', () => {
      mockRequest.userAccount = mockUserAccount;

      expect(service.userHasAllRoles(['user', 'admin'])).toBe(true);
    });

    it('should return false if user account does not have all the roles', () => {
      mockRequest.userAccount = mockUserAccount;

      expect(service.userHasAllRoles(['user', 'moderator'])).toBe(false);
    });

    it('should throw UnauthorizedException if user account is not authenticated', () => {
      mockRequest.userAccount = null;

      expect(() => service.userHasAllRoles(['admin'])).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('authenticate', () => {
    it('should authenticate a user account and create a session', async () => {
      const password = 'password123';
      const token = 'jwt-token';
      const jwtToken: JwtToken = {
        accessToken: token,
        expiresIn: 3600000, // 1h in milliseconds
      };

      mockCredentialService.verifyPassword.mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(token);
      mockSessionService.create.mockResolvedValue({} as any);

      const result = await service.authenticate(mockUserAccount, password);

      expect(mockCredentialService.verifyPassword).toHaveBeenCalledWith(
        mockUser.id,
        password,
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUserAccount.id,
          userId: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          roles: ['user', 'admin'],
          organisationId: mockOrganisation.id,
          establishmentId: mockEstablishment.id,
        }),
        mockJwtConfig.jwt.secret,
        expect.any(Object),
      );
      expect(mockSessionService.create).toHaveBeenCalledWith(
        token,
        mockUserAccount.id,
      );
      expect(mockRequest.res.cookie).toHaveBeenCalledWith(
        'access_token',
        token,
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 3600000,
          expires: expect.any(Date),
          path: '/',
        }),
      );
      expect(mockRequest.userAccount).toEqual(mockUserAccount);
      expect(mockRequest.user).toEqual(mockUser);
      expect(result).toEqual(jwtToken);
    });

    it('should throw BadRequestException if user is disabled', async () => {
      const disabledUser = { ...mockUser, enabled: false };
      const disabledUserAccount = { ...mockUserAccount, user: disabledUser };

      await expect(
        service.authenticate(disabledUserAccount, 'password'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockCredentialService.verifyPassword.mockResolvedValue(false);

      await expect(
        service.authenticate(mockUserAccount, 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout a user account and delete the session', async () => {
      const token = 'jwt-token';
      (extractTokenFromRequest as jest.Mock).mockReturnValue(token);
      mockSessionService.deleteByToken.mockResolvedValue(undefined);

      await service.logout();

      expect(mockSessionService.deleteByToken).toHaveBeenCalledWith(token);
      expect(mockRequest.res.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
        }),
      );
      expect(mockRequest.userAccount).toBeUndefined();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should handle logout when token is not found', async () => {
      (extractTokenFromRequest as jest.Mock).mockReturnValue(null);

      await service.logout();

      expect(mockSessionService.deleteByToken).not.toHaveBeenCalled();
      expect(mockRequest.res.clearCookie).toHaveBeenCalled();
    });

    it('should handle logout when session does not exist', async () => {
      const token = 'jwt-token';
      (extractTokenFromRequest as jest.Mock).mockReturnValue(token);
      mockSessionService.deleteByToken.mockRejectedValue(
        new Error('Session not found'),
      );

      await service.logout();

      expect(mockRequest.res.clearCookie).toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', async () => {
      const token = 'valid-token';
      const payload: JwtPayload = {
        sub: 'user-account-id',
        userId: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        roles: ['user', 'admin'],
        organisationId: 'org-id',
        establishmentId: 'est-id',
      };

      (jwt.verify as jest.Mock).mockReturnValue(payload);

      const result = await service.verifyToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, mockJwtConfig.jwt.secret);
      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const token = 'invalid-token';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.verifyToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('loadUserFromToken', () => {
    it('should load user account from token and set in context', async () => {
      const token = 'valid-token';
      const payload: JwtPayload = {
        sub: 'user-account-id',
        userId: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        roles: ['user', 'admin'],
        organisationId: 'org-id',
        establishmentId: 'est-id',
      };
      const mockSession = {
        token,
        userAccountId: 'user-account-id',
        loginDate: new Date(),
        expirationDate: new Date(Date.now() + 60 * 60 * 1000),
        userAccount: mockUserAccount,
      };

      jest.spyOn(service, 'verifyToken').mockResolvedValue(payload);
      mockUserAccountService.getById.mockResolvedValue(mockUserAccount);
      mockSessionService.findByToken.mockResolvedValue(mockSession);
      mockSessionService.isActive.mockReturnValue(true);

      await service.loadUserFromToken(token);

      expect(service.verifyToken).toHaveBeenCalledWith(token);
      expect(mockSessionService.findByToken).toHaveBeenCalledWith(token);
      expect(mockSessionService.isActive).toHaveBeenCalledWith(mockSession);
      expect(mockUserAccountService.getById).toHaveBeenCalledWith(payload.sub);
      expect(mockRequest.userAccount).toEqual(mockUserAccount);
      expect(mockRequest.user).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if session not found', async () => {
      const token = 'valid-token';
      const payload: JwtPayload = {
        sub: 'user-account-id',
        userId: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        roles: ['user', 'admin'],
        organisationId: 'org-id',
        establishmentId: 'est-id',
      };

      jest.spyOn(service, 'verifyToken').mockResolvedValue(payload);
      mockSessionService.findByToken.mockResolvedValue(null);

      await expect(service.loadUserFromToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if session is expired', async () => {
      const token = 'valid-token';
      const payload: JwtPayload = {
        sub: 'user-account-id',
        userId: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        roles: ['user', 'admin'],
        organisationId: 'org-id',
        establishmentId: 'est-id',
      };
      const mockSession = {
        token,
        userAccountId: 'user-account-id',
        loginDate: new Date(),
        expirationDate: new Date(Date.now() - 1000),
        userAccount: mockUserAccount,
      };

      jest.spyOn(service, 'verifyToken').mockResolvedValue(payload);
      mockSessionService.findByToken.mockResolvedValue(mockSession);
      mockSessionService.isActive.mockReturnValue(false);

      await expect(service.loadUserFromToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is disabled', async () => {
      const token = 'valid-token';
      const payload: JwtPayload = {
        sub: 'user-account-id',
        userId: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        roles: ['user', 'admin'],
        organisationId: 'org-id',
        establishmentId: 'est-id',
      };
      const disabledUser = { ...mockUser, enabled: false };
      const disabledUserAccount = { ...mockUserAccount, user: disabledUser };
      const mockSession = {
        token,
        userAccountId: 'user-account-id',
        loginDate: new Date(),
        expirationDate: new Date(Date.now() + 60 * 60 * 1000),
        userAccount: disabledUserAccount,
      };

      jest.spyOn(service, 'verifyToken').mockResolvedValue(payload);
      mockSessionService.findByToken.mockResolvedValue(mockSession);
      mockSessionService.isActive.mockReturnValue(true);
      mockUserAccountService.getById.mockResolvedValue(disabledUserAccount);

      await expect(service.loadUserFromToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('extractTokenFromRequest', () => {
    it('should extract token from request', () => {
      const token = 'jwt-token';
      (extractTokenFromRequest as jest.Mock).mockReturnValue(token);

      const result = service.extractTokenFromRequest();

      expect(extractTokenFromRequest).toHaveBeenCalledWith(
        mockRequest,
        'access_token',
      );
      expect(result).toBe(token);
    });
  });
});
