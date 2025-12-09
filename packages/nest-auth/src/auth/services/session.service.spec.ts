import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionEntity } from '../entities';
import { JwtConfig, JwtConfigToken } from '../config/jwt.config';
import { ScopeService } from './scope.service';

describe('SessionService', () => {
  let service: SessionService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockJwtConfig: JwtConfig = {
    jwt: {
      secret: 'test-secret',
      expiresIn: 3600, // 1h
    },
  };

  const mockScopeService = {
    getScopeFromRequest: jest.fn().mockReturnValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: mockRepository,
        },
        {
          provide: JwtConfigToken,
          useValue: mockJwtConfig,
        },
        {
          provide: ScopeService,
          useValue: mockScopeService,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new session', async () => {
      const token = 'test-token';
      const userAccountId = 'user-account-id';
      const mockSession = {
        token,
        userAccountId,
        loginDate: new Date(),
        expirationDate: new Date(Date.now() + 60 * 60 * 1000),
      };

      mockRepository.createQueryBuilder.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      });
      mockRepository.create.mockReturnValue(mockSession);
      mockRepository.save.mockResolvedValue(mockSession);

      const result = await service.create(token, userAccountId);

      expect(mockRepository.create).toHaveBeenCalledWith({
        token,
        userAccountId,
        loginDate: expect.any(Date),
        expirationDate: expect.any(Date),
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockSession);
      expect(result).toEqual(mockSession);
    });
  });

  describe('findByToken', () => {
    it('should find a session by token', async () => {
      const token = 'test-token';
      const mockSession = {
        token,
        userAccountId: 'user-account-id',
        loginDate: new Date(),
        expirationDate: new Date(),
        userAccount: {},
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockSession),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByToken(token);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('session');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'session.token = :token',
        { token },
      );
      expect(result).toEqual(mockSession);
    });

    it('should return null if session not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByToken('non-existent-token');

      expect(result).toBeNull();
    });
  });

  describe('getByToken', () => {
    it('should get a session by token', async () => {
      const token = 'test-token';
      const mockSession = {
        token,
        userAccountId: 'user-account-id',
        loginDate: new Date(),
        expirationDate: new Date(),
        userAccount: {},
      } as SessionEntity;

      jest.spyOn(service, 'findByToken').mockResolvedValue(mockSession);

      const result = await service.getByToken(token);

      expect(result).toEqual(mockSession);
    });

    it('should throw NotFoundException if session not found', async () => {
      jest.spyOn(service, 'findByToken').mockResolvedValue(null);

      await expect(service.getByToken('non-existent-token')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteByToken', () => {
    it('should delete a session by token', async () => {
      const token = 'test-token';
      const mockSession = {
        token,
        userAccountId: 'user-account-id',
        loginDate: new Date(),
        expirationDate: new Date(),
        userAccount: {},
      } as SessionEntity;

      jest.spyOn(service, 'getByToken').mockResolvedValue(mockSession);
      mockRepository.remove.mockResolvedValue(mockSession);

      await service.deleteByToken(token);

      expect(service.getByToken).toHaveBeenCalledWith(token);
      expect(mockRepository.remove).toHaveBeenCalledWith(mockSession);
    });
  });

  describe('findByUserId', () => {
    it('should find all sessions for a user', async () => {
      const userId = 'user-id';
      const mockSessions = [
        {
          token: 'token1',
          userAccountId: 'user-account-id-1',
          loginDate: new Date(),
          expirationDate: new Date(),
        },
        {
          token: 'token2',
          userAccountId: 'user-account-id-2',
          loginDate: new Date(),
          expirationDate: new Date(),
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockSessions),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByUserId(userId);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('session');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(result).toEqual(mockSessions);
    });
  });

  describe('findActiveByUserId', () => {
    it('should find active sessions for a user', async () => {
      const userId = 'user-id';
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findActiveByUserId(userId);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('session');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'session.expirationDate > :now',
        { now: expect.any(Date) },
      );
    });
  });

  describe('findAllActive', () => {
    it('should find all active sessions', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAllActive();

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('session');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'session.expirationDate > :now',
        { now: expect.any(Date) },
      );
    });
  });

  describe('isActive', () => {
    it('should return true if session is active', () => {
      const session = {
        token: 'test-token',
        userAccountId: 'user-account-id',
        loginDate: new Date(),
        expirationDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      } as SessionEntity;

      expect(service.isActive(session)).toBe(true);
    });

    it('should return false if session is expired', () => {
      const session = {
        token: 'test-token',
        userAccountId: 'user-account-id',
        loginDate: new Date(),
        expirationDate: new Date(Date.now() - 1000), // 1 second ago
      } as SessionEntity;

      expect(service.isActive(session)).toBe(false);
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired sessions', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 5 }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.deleteExpired();

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith(SessionEntity);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'expirationDate < :now',
        { now: expect.any(Date) },
      );
      expect(result).toBe(5);
    });
  });

  describe('deleteAllByUserId', () => {
    it('should delete all sessions for a user', async () => {
      const userId = 'user-id';
      const mockSessions = [
        {
          token: 'token1',
          userAccountId: 'user-account-id-1',
          userAccount: {
            id: 'user-account-id-1',
            user: { id: userId },
          },
        },
        {
          token: 'token2',
          userAccountId: 'user-account-id-2',
          userAccount: {
            id: 'user-account-id-2',
            user: { id: userId },
          },
        },
        {
          token: 'token3',
          userAccountId: 'user-account-id-3',
          userAccount: {
            id: 'user-account-id-3',
            user: { id: userId },
          },
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockSessions),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockRepository.remove.mockResolvedValue(mockSessions);

      const result = await service.deleteAllByUserId(userId);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.id = :userId', {
        userId,
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockSessions);
      expect(result).toBe(3);
    });
  });
});
