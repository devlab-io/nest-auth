import { Test, TestingModule } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { UserService } from './user.service';
import { SessionService } from './session.service';
import { JwtConfig, JwtConfigToken } from '../config/jwt.config';
import { User, JwtToken, JwtPayload } from '../types';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { extractTokenFromRequest } from '../utils';

jest.mock('jsonwebtoken', () => {
  const mockSign = jest.fn();
  const mockVerify = jest.fn();
  return {
    __esModule: true,
    default: {
      get sign() {
        return mockSign;
      },
      get verify() {
        return mockVerify;
      },
    },
  };
});

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

jest.mock('../utils', () => ({
  extractTokenFromRequest: jest.fn(),
}));

describe('JwtService', () => {
  let service: JwtService;

  const mockRequest = {
    headers: {},
    cookies: {},
    user: null,
    res: {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    },
  } as any;

  const mockJwtConfig: JwtConfig = {
    jwt: {
      secret: 'test-secret',
      expiresIn: '1h',
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
    password: 'hashed-password',
    roles: [
      { id: 1, name: 'user' },
      { id: 2, name: 'admin' },
    ],
    actionsTokens: [],
  };

  const mockUserService = {
    getById: jest.fn(),
    findByEmail: jest.fn(),
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
          provide: UserService,
          useValue: mockUserService,
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
  });

  describe('isUserAuthenticated', () => {
    it('should return true if user is authenticated', () => {
      mockRequest.user = mockUser;

      expect(service.isUserAuthenticated()).toBe(true);
    });

    it('should return false if user is not authenticated', () => {
      mockRequest.user = null;

      expect(service.isUserAuthenticated()).toBe(false);
    });
  });

  describe('getAuthenticatedUser', () => {
    it('should return the authenticated user', () => {
      mockRequest.user = mockUser;

      const result = service.getAuthenticatedUser();

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user is not authenticated', () => {
      mockRequest.user = null;

      expect(() => service.getAuthenticatedUser()).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('userHasAnyRoles', () => {
    it('should return true if user has at least one of the roles', () => {
      mockRequest.user = mockUser;

      expect(service.userHasAnyRoles(['admin', 'moderator'])).toBe(true);
    });

    it('should return false if user has none of the roles', () => {
      mockRequest.user = mockUser;

      expect(service.userHasAnyRoles(['moderator', 'guest'])).toBe(false);
    });

    it('should throw UnauthorizedException if user is not authenticated', () => {
      mockRequest.user = null;

      expect(() => service.userHasAnyRoles(['admin'])).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('userHasAllRoles', () => {
    it('should return true if user has all the roles', () => {
      mockRequest.user = mockUser;

      expect(service.userHasAllRoles(['user', 'admin'])).toBe(true);
    });

    it('should return false if user does not have all the roles', () => {
      mockRequest.user = mockUser;

      expect(service.userHasAllRoles(['user', 'moderator'])).toBe(false);
    });

    it('should throw UnauthorizedException if user is not authenticated', () => {
      mockRequest.user = null;

      expect(() => service.userHasAllRoles(['admin'])).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('authenticate', () => {
    it('should authenticate a user and create a session', async () => {
      const password = 'password123';
      const token = 'jwt-token';
      const jwtToken: JwtToken = {
        accessToken: token,
        expiresIn: '1h',
      };

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(token);
      mockSessionService.create.mockResolvedValue({} as any);

      const result = await service.authenticate(mockUser, password);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(jwt.sign).toHaveBeenCalled();
      expect(mockSessionService.create).toHaveBeenCalledWith(
        token,
        mockUser.id,
      );
      expect(mockRequest.res.cookie).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(mockUser);
      expect(result).toEqual(jwtToken);
    });

    it('should throw BadRequestException if user is disabled', async () => {
      const disabledUser = { ...mockUser, enabled: false };

      await expect(
        service.authenticate(disabledUser, 'password'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if user has no password', async () => {
      const userWithoutPassword = { ...mockUser, password: undefined };

      await expect(
        service.authenticate(userWithoutPassword, 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.authenticate(mockUser, 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout a user and delete the session', async () => {
      const token = 'jwt-token';
      (extractTokenFromRequest as jest.Mock).mockReturnValue(token);
      mockSessionService.deleteByToken.mockResolvedValue(undefined);

      await service.logout();

      expect(mockSessionService.deleteByToken).toHaveBeenCalledWith(token);
      expect(mockRequest.res.clearCookie).toHaveBeenCalled();
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
        sub: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        roles: ['user'],
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
    it('should load user from token and set in context', async () => {
      const token = 'valid-token';
      const payload: JwtPayload = {
        sub: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        roles: ['user'],
      };
      const mockSession = {
        token,
        userId: 'user-id',
        loginDate: new Date(),
        expirationDate: new Date(Date.now() + 60 * 60 * 1000),
      };

      jest.spyOn(service, 'verifyToken').mockResolvedValue(payload);
      mockUserService.getById.mockResolvedValue(mockUser);
      mockSessionService.findByToken.mockResolvedValue(mockSession);
      mockSessionService.isActive.mockReturnValue(true);

      await service.loadUserFromToken(token);

      expect(service.verifyToken).toHaveBeenCalledWith(token);
      expect(mockSessionService.findByToken).toHaveBeenCalledWith(token);
      expect(mockSessionService.isActive).toHaveBeenCalledWith(mockSession);
      expect(mockUserService.getById).toHaveBeenCalledWith(payload.sub);
      expect(mockRequest.user).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if session not found', async () => {
      const token = 'valid-token';
      const payload: JwtPayload = {
        sub: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        roles: ['user'],
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
        sub: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        roles: ['user'],
      };
      const mockSession = {
        token,
        userId: 'user-id',
        loginDate: new Date(),
        expirationDate: new Date(Date.now() - 1000),
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
        sub: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        roles: ['user'],
      };
      const disabledUser = { ...mockUser, enabled: false };
      const mockSession = {
        token,
        userId: 'user-id',
        loginDate: new Date(),
        expirationDate: new Date(Date.now() + 60 * 60 * 1000),
      };

      jest.spyOn(service, 'verifyToken').mockResolvedValue(payload);
      mockSessionService.findByToken.mockResolvedValue(mockSession);
      mockSessionService.isActive.mockReturnValue(true);
      mockUserService.getById.mockResolvedValue(disabledUser);

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
