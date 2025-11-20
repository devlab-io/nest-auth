import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionEntity } from '../entities';
import { JwtConfig, JwtConfigToken } from '../config/jwt.config';

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
      const userId = 'user-id';
      const mockSession = {
        token,
        userId,
        loginDate: new Date(),
        expirationDate: new Date(Date.now() + 60 * 60 * 1000),
      };

      mockRepository.create.mockReturnValue(mockSession);
      mockRepository.save.mockResolvedValue(mockSession);

      const result = await service.create(token, userId);

      expect(mockRepository.create).toHaveBeenCalledWith({
        token,
        userId,
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
        userId: 'user-id',
        loginDate: new Date(),
        expirationDate: new Date(),
        user: {},
      };

      mockRepository.findOne.mockResolvedValue(mockSession);

      const result = await service.findByToken(token);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { token },
        relations: ['user'],
      });
      expect(result).toEqual(mockSession);
    });

    it('should return null if session not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByToken('non-existent-token');

      expect(result).toBeNull();
    });
  });

  describe('getByToken', () => {
    it('should get a session by token', async () => {
      const token = 'test-token';
      const mockSession = {
        token,
        userId: 'user-id',
        loginDate: new Date(),
        expirationDate: new Date(),
        user: {},
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
        userId: 'user-id',
        loginDate: new Date(),
        expirationDate: new Date(),
        user: {},
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
          userId,
          loginDate: new Date(),
          expirationDate: new Date(),
        },
        {
          token: 'token2',
          userId,
          loginDate: new Date(),
          expirationDate: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockSessions);

      const result = await service.findByUserId(userId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['user'],
        order: { loginDate: 'DESC' },
      });
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
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'session.user',
        'user',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'session.userId = :userId',
        { userId },
      );
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
        userId: 'user-id',
        loginDate: new Date(),
        expirationDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      } as SessionEntity;

      expect(service.isActive(session)).toBe(true);
    });

    it('should return false if session is expired', () => {
      const session = {
        token: 'test-token',
        userId: 'user-id',
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
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 3 }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.deleteAllByUserId(userId);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('userId = :userId', {
        userId,
      });
      expect(result).toBe(3);
    });
  });
});
