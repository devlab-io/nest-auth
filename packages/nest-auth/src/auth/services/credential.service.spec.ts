import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CredentialService } from './credential.service';
import { CredentialEntity } from '../entities';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('CredentialService', () => {
  let service: CredentialService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialService,
        {
          provide: getRepositoryToken(CredentialEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CredentialService>(CredentialService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPasswordCredential', () => {
    it('should create a password credential', async () => {
      const userId = 'user-id';
      const password = 'password123';
      const hashedPassword = 'hashed-password';

      mockRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.create.mockReturnValue({
        type: 'password',
        password: hashedPassword,
        user: { id: userId },
      });
      mockRepository.save.mockResolvedValue({
        id: 'credential-id',
        type: 'password',
        password: hashedPassword,
        user: { id: userId },
      });

      const result = await service.createPasswordCredential(userId, password);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: userId }, type: 'password' },
        relations: ['user'],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.type).toBe('password');
      expect(result.password).toBe(hashedPassword);
    });

    it('should throw BadRequestException if password credential already exists', async () => {
      const userId = 'user-id';
      const password = 'password123';
      const existingCredential = {
        id: 'credential-id',
        type: 'password',
        user: { id: userId },
      };

      mockRepository.findOne.mockResolvedValue(existingCredential);

      await expect(
        service.createPasswordCredential(userId, password),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updatePasswordCredential', () => {
    it('should update a password credential', async () => {
      const userId = 'user-id';
      const password = 'new-password123';
      const hashedPassword = 'new-hashed-password';
      const existingCredential = {
        id: 'credential-id',
        type: 'password',
        password: 'old-hashed-password',
        user: { id: userId },
      };

      mockRepository.findOne.mockResolvedValue(existingCredential);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.save.mockResolvedValue({
        ...existingCredential,
        password: hashedPassword,
      });

      const result = await service.updatePasswordCredential(userId, password);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: userId }, type: 'password' },
        relations: ['user'],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...existingCredential,
        password: hashedPassword,
      });
      expect(result.password).toBe(hashedPassword);
    });

    it('should throw NotFoundException if password credential does not exist', async () => {
      const userId = 'user-id';
      const password = 'new-password123';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updatePasswordCredential(userId, password),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setPasswordCredential', () => {
    it('should create password credential if it does not exist', async () => {
      const userId = 'user-id';
      const password = 'password123';
      const hashedPassword = 'hashed-password';

      mockRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.create.mockReturnValue({
        type: 'password',
        password: hashedPassword,
        user: { id: userId },
      });
      mockRepository.save.mockResolvedValue({
        id: 'credential-id',
        type: 'password',
        password: hashedPassword,
        user: { id: userId },
      });

      const result = await service.setPasswordCredential(userId, password);

      expect(result.type).toBe('password');
    });

    it('should update password credential if it exists', async () => {
      const userId = 'user-id';
      const password = 'new-password123';
      const hashedPassword = 'new-hashed-password';
      const existingCredential = {
        id: 'credential-id',
        type: 'password',
        password: 'old-hashed-password',
        user: { id: userId },
      };

      mockRepository.findOne.mockResolvedValue(existingCredential);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.save.mockResolvedValue({
        ...existingCredential,
        password: hashedPassword,
      });

      const result = await service.setPasswordCredential(userId, password);

      expect(result.password).toBe(hashedPassword);
    });
  });

  describe('verifyPassword', () => {
    it('should return true if password is valid', async () => {
      const userId = 'user-id';
      const password = 'password123';
      const credential = {
        id: 'credential-id',
        type: 'password',
        password: 'hashed-password',
        user: { id: userId },
      };

      mockRepository.findOne.mockResolvedValue(credential);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.verifyPassword(userId, password);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: userId }, type: 'password' },
        relations: ['user'],
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        password,
        credential.password,
      );
      expect(result).toBe(true);
    });

    it('should return false if password is invalid', async () => {
      const userId = 'user-id';
      const password = 'wrong-password';
      const credential = {
        id: 'credential-id',
        type: 'password',
        password: 'hashed-password',
        user: { id: userId },
      };

      mockRepository.findOne.mockResolvedValue(credential);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.verifyPassword(userId, password);

      expect(result).toBe(false);
    });

    it('should return false if credential does not exist', async () => {
      const userId = 'user-id';
      const password = 'password123';

      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.verifyPassword(userId, password);

      expect(result).toBe(false);
    });
  });

  describe('createGoogleCredential', () => {
    it('should create a Google credential', async () => {
      const userId = 'user-id';
      const googleId = 'google-id-123';

      mockRepository.findOne
        .mockResolvedValueOnce(null) // findGoogleCredential
        .mockResolvedValueOnce(null); // find by googleId
      mockRepository.create.mockReturnValue({
        type: 'google',
        googleId,
        user: { id: userId },
      });
      mockRepository.save.mockResolvedValue({
        id: 'credential-id',
        type: 'google',
        googleId,
        user: { id: userId },
      });

      const result = await service.createGoogleCredential(userId, googleId);

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.type).toBe('google');
      expect(result.googleId).toBe(googleId);
    });

    it('should throw BadRequestException if Google credential already exists', async () => {
      const userId = 'user-id';
      const googleId = 'google-id-123';
      const existingCredential = {
        id: 'credential-id',
        type: 'google',
        googleId,
        user: { id: userId },
      };

      mockRepository.findOne.mockResolvedValue(existingCredential);

      await expect(
        service.createGoogleCredential(userId, googleId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if Google ID is already used', async () => {
      const userId = 'user-id';
      const googleId = 'google-id-123';
      const existingCredential = {
        id: 'credential-id',
        type: 'google',
        googleId,
        user: { id: 'other-user-id' },
      };

      mockRepository.findOne
        .mockResolvedValueOnce(null) // findGoogleCredential
        .mockResolvedValueOnce(existingCredential); // find by googleId

      await expect(
        service.createGoogleCredential(userId, googleId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findPasswordCredential', () => {
    it('should find a password credential', async () => {
      const userId = 'user-id';
      const credential = {
        id: 'credential-id',
        type: 'password',
        password: 'hashed-password',
        user: { id: userId },
      };

      mockRepository.findOne.mockResolvedValue(credential);

      const result = await service.findPasswordCredential(userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: userId }, type: 'password' },
        relations: ['user'],
      });
      expect(result).toEqual(credential);
    });

    it('should return null if password credential does not exist', async () => {
      const userId = 'user-id';

      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findPasswordCredential(userId);

      expect(result).toBeNull();
    });
  });

  describe('findGoogleCredential', () => {
    it('should find a Google credential', async () => {
      const userId = 'user-id';
      const credential = {
        id: 'credential-id',
        type: 'google',
        googleId: 'google-id-123',
        user: { id: userId },
      };

      mockRepository.findOne.mockResolvedValue(credential);

      const result = await service.findGoogleCredential(userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: userId }, type: 'google' },
        relations: ['user'],
      });
      expect(result).toEqual(credential);
    });
  });

  describe('findGoogleCredentialByGoogleId', () => {
    it('should find a Google credential by Google ID', async () => {
      const googleId = 'google-id-123';
      const credential = {
        id: 'credential-id',
        type: 'google',
        googleId,
        user: { id: 'user-id' },
      };

      mockRepository.findOne.mockResolvedValue(credential);

      const result = await service.findGoogleCredentialByGoogleId(googleId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { type: 'google', googleId },
        relations: ['user'],
      });
      expect(result).toEqual(credential);
    });
  });

  describe('findByUserId', () => {
    it('should find all credentials for a user', async () => {
      const userId = 'user-id';
      const credentials = [
        {
          id: 'credential-id-1',
          type: 'password',
          user: { id: userId },
        },
        {
          id: 'credential-id-2',
          type: 'google',
          googleId: 'google-id-123',
          user: { id: userId },
        },
      ];

      mockRepository.find.mockResolvedValue(credentials);

      const result = await service.findByUserId(userId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        relations: ['user'],
      });
      expect(result).toEqual(credentials);
    });
  });

  describe('delete', () => {
    it('should delete a credential', async () => {
      const credentialId = 'credential-id';
      const credential = {
        id: credentialId,
        type: 'password',
        user: { id: 'user-id' },
      };

      mockRepository.findOne.mockResolvedValue(credential);
      mockRepository.remove.mockResolvedValue(credential);

      await service.delete(credentialId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: credentialId },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(credential);
    });

    it('should throw NotFoundException if credential does not exist', async () => {
      const credentialId = 'credential-id';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(credentialId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deletePasswordCredential', () => {
    it('should delete a password credential', async () => {
      const userId = 'user-id';
      const credential = {
        id: 'credential-id',
        type: 'password',
        user: { id: userId },
      };

      mockRepository.findOne.mockResolvedValue(credential);
      mockRepository.remove.mockResolvedValue(credential);

      await service.deletePasswordCredential(userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: userId }, type: 'password' },
        relations: ['user'],
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(credential);
    });

    it('should not throw if password credential does not exist', async () => {
      const userId = 'user-id';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deletePasswordCredential(userId),
      ).resolves.toBeUndefined();
    });
  });

  describe('deleteGoogleCredential', () => {
    it('should delete a Google credential', async () => {
      const userId = 'user-id';
      const credential = {
        id: 'credential-id',
        type: 'google',
        googleId: 'google-id-123',
        user: { id: userId },
      };

      mockRepository.findOne.mockResolvedValue(credential);
      mockRepository.remove.mockResolvedValue(credential);

      await service.deleteGoogleCredential(userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: userId }, type: 'google' },
        relations: ['user'],
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(credential);
    });
  });

  describe('hasPasswordCredential', () => {
    it('should return true if user has password credential', async () => {
      const userId = 'user-id';

      mockRepository.count.mockResolvedValue(1);

      const result = await service.hasPasswordCredential(userId);

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { user: { id: userId }, type: 'password' },
      });
      expect(result).toBe(true);
    });

    it('should return false if user does not have password credential', async () => {
      const userId = 'user-id';

      mockRepository.count.mockResolvedValue(0);

      const result = await service.hasPasswordCredential(userId);

      expect(result).toBe(false);
    });
  });

  describe('hasGoogleCredential', () => {
    it('should return true if user has Google credential', async () => {
      const userId = 'user-id';

      mockRepository.count.mockResolvedValue(1);

      const result = await service.hasGoogleCredential(userId);

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { user: { id: userId }, type: 'google' },
      });
      expect(result).toBe(true);
    });

    it('should return false if user does not have Google credential', async () => {
      const userId = 'user-id';

      mockRepository.count.mockResolvedValue(0);

      const result = await service.hasGoogleCredential(userId);

      expect(result).toBe(false);
    });
  });
});
