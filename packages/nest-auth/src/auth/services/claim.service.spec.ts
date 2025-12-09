import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ClaimService } from './claim.service';
import { ClaimEntity } from '../entities';
import {
  ClaimAction,
  ClaimLike,
  ClaimScope,
  claim,
} from '@devlab-io/nest-auth-types';

describe('ClaimService', () => {
  let service: ClaimService;
  let mockRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    count: jest.Mock;
  };

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimService,
        {
          provide: getRepositoryToken(ClaimEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ClaimService>(ClaimService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all claims ordered by claim string', async () => {
      const claims: ClaimEntity[] = [
        { claim: 'create:any:users' } as ClaimEntity,
        { claim: 'read:any:users' } as ClaimEntity,
        { claim: 'update:any:users' } as ClaimEntity,
      ];

      mockRepository.find.mockResolvedValue(claims);

      const result = await service.getAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { claim: 'ASC' },
      });
      expect(result).toEqual(claims);
    });

    it('should return an empty array when no claims exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getClaims', () => {
    it('should return claims when given string inputs', async () => {
      const inputs = ['read:any:users', 'create:any:users'];
      const claims: ClaimEntity[] = [
        { claim: 'read:any:users' } as ClaimEntity,
        { claim: 'create:any:users' } as ClaimEntity,
      ];

      mockRepository.find.mockResolvedValue(claims);

      const result = await service.getClaims(inputs);

      // Verify that find was called with In() containing the claim strings
      expect(mockRepository.find).toHaveBeenCalled();
      const findCall = mockRepository.find.mock.calls[0][0];
      expect(findCall.where.claim).toBeDefined();
      expect(result).toEqual(claims);
      expect(result.length).toBe(2);
    });

    it('should return claims when given Claim object inputs', async () => {
      const inputs = [
        claim(ClaimAction.READ, ClaimScope.ANY, 'users'),
        claim(ClaimAction.CREATE, ClaimScope.ORGANISATION, 'establishments'),
      ];
      const claims: ClaimEntity[] = [
        { claim: 'read:any:users' } as ClaimEntity,
        { claim: 'create:organisation:establishments' } as ClaimEntity,
      ];

      mockRepository.find.mockResolvedValue(claims);

      const result = await service.getClaims(inputs);

      expect(result).toEqual(claims);
      expect(result.length).toBe(2);
    });

    it('should return claims when given tuple inputs', async () => {
      const inputs: [ClaimAction, ClaimScope, string][] = [
        [ClaimAction.READ, ClaimScope.ANY, 'users'],
        [ClaimAction.UPDATE, ClaimScope.ESTABLISHMENT, 'menus'],
      ];
      const claims: ClaimEntity[] = [
        { claim: 'read:any:users' } as ClaimEntity,
        { claim: 'update:establishment:menus' } as ClaimEntity,
      ];

      mockRepository.find.mockResolvedValue(claims);

      const result = await service.getClaims(inputs);

      expect(result).toEqual(claims);
      expect(result.length).toBe(2);
    });

    it('should return an empty array when given an empty array', async () => {
      const result = await service.getClaims([]);

      expect(mockRepository.find).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return an empty array when given null or undefined', async () => {
      const result1 = await service.getClaims(null as any);
      const result2 = await service.getClaims(undefined as any);

      expect(mockRepository.find).not.toHaveBeenCalled();
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
    });

    it('should throw NotFoundException when some claims are not found', async () => {
      const inputs = ['read:any:users', 'create:any:users', 'delete:any:users'];
      // Only 2 out of 3 claims are found
      const foundClaims: ClaimEntity[] = [
        { claim: 'read:any:users' } as ClaimEntity,
        { claim: 'create:any:users' } as ClaimEntity,
        // 'delete:any:users' is missing
      ];

      mockRepository.find.mockResolvedValue(foundClaims);

      await expect(service.getClaims(inputs)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getClaims(inputs)).rejects.toThrow(
        'One or more claims not found',
      );
    });

    it('should throw NotFoundException with missing claims in error message', async () => {
      const inputs = ['read:any:users', 'read:any:nonexistent'];
      const foundClaims: ClaimEntity[] = [
        { claim: 'read:any:users' } as ClaimEntity,
      ];

      mockRepository.find.mockResolvedValue(foundClaims);

      try {
        await service.getClaims(inputs);
        fail('Should have thrown NotFoundException');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toContain('One or more claims not found');
        expect(error.message).toContain('read:any:nonexistent');
      }
    });

    it('should handle mixed input types (string, Claim, tuple)', async () => {
      const inputs: ClaimLike[] = [
        'read:any:users',
        claim(ClaimAction.CREATE, ClaimScope.ORGANISATION, 'establishments'),
        [ClaimAction.UPDATE, ClaimScope.ESTABLISHMENT, 'menus'],
      ];
      const claims: ClaimEntity[] = [
        { claim: 'read:any:users' } as ClaimEntity,
        { claim: 'create:organisation:establishments' } as ClaimEntity,
        { claim: 'update:establishment:menus' } as ClaimEntity,
      ];

      mockRepository.find.mockResolvedValue(claims);

      const result = await service.getClaims(inputs);

      expect(result).toEqual(claims);
      expect(result.length).toBe(3);
    });
  });

  describe('getByClaim', () => {
    it('should return a claim when given a string input', async () => {
      const input = 'read:any:users';
      const claimEntity: ClaimEntity = {
        claim: 'read:any:users',
      } as ClaimEntity;

      mockRepository.findOne.mockResolvedValue(claimEntity);

      const result = await service.getByClaim(input);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { claim: 'read:any:users' },
      });
      expect(result).toEqual(claimEntity);
    });

    it('should return a claim when given a Claim object input', async () => {
      const input = claim(ClaimAction.READ, ClaimScope.ANY, 'users');
      const claimEntity: ClaimEntity = {
        claim: 'read:any:users',
      } as ClaimEntity;

      mockRepository.findOne.mockResolvedValue(claimEntity);

      const result = await service.getByClaim(input);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { claim: 'read:any:users' },
      });
      expect(result).toEqual(claimEntity);
    });

    it('should return a claim when given a tuple input', async () => {
      const input: [ClaimAction, ClaimScope, string] = [
        ClaimAction.CREATE,
        ClaimScope.ORGANISATION,
        'establishments',
      ];
      const claimEntity: ClaimEntity = {
        claim: 'create:organisation:establishments',
      } as ClaimEntity;

      mockRepository.findOne.mockResolvedValue(claimEntity);

      const result = await service.getByClaim(input);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { claim: 'create:organisation:establishments' },
      });
      expect(result).toEqual(claimEntity);
    });

    it('should throw NotFoundException when claim is not found', async () => {
      const input = 'read:any:nonexistent';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getByClaim(input)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getByClaim(input)).rejects.toThrow(
        'Claim "read:any:nonexistent" not found',
      );
    });
  });

  describe('exists', () => {
    it('should return true when claim exists (string input)', async () => {
      const input = 'read:any:users';

      mockRepository.count.mockResolvedValue(1);

      const result = await service.exists(input);

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { claim: 'read:any:users' },
      });
      expect(result).toBe(true);
    });

    it('should return true when claim exists (Claim object input)', async () => {
      const input = claim(ClaimAction.READ, ClaimScope.ANY, 'users');

      mockRepository.count.mockResolvedValue(1);

      const result = await service.exists(input);

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { claim: 'read:any:users' },
      });
      expect(result).toBe(true);
    });

    it('should return true when claim exists (tuple input)', async () => {
      const input: [ClaimAction, ClaimScope, string] = [
        ClaimAction.CREATE,
        ClaimScope.ORGANISATION,
        'establishments',
      ];

      mockRepository.count.mockResolvedValue(1);

      const result = await service.exists(input);

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { claim: 'create:organisation:establishments' },
      });
      expect(result).toBe(true);
    });

    it('should return false when claim does not exist', async () => {
      const input = 'read:any:nonexistent';

      mockRepository.count.mockResolvedValue(0);

      const result = await service.exists(input);

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { claim: 'read:any:nonexistent' },
      });
      expect(result).toBe(false);
    });

    it('should return false when count is 0', async () => {
      const input = 'read:any:users';

      mockRepository.count.mockResolvedValue(0);

      const result = await service.exists(input);

      expect(result).toBe(false);
    });
  });
});
