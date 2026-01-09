import { TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { ClaimService } from '../../src/auth/services/claim.service';
import { TestClaimEntity } from '../entities/test-claim.entity';
import {
  createTestModule,
  cleanupDatabase,
  closeDatabaseConnection,
} from '../test-utils';
import {
  Claim,
  ClaimAction,
  ClaimScope,
  claim,
} from '@devlab-io/nest-auth-types';

describe('ClaimService Integration', () => {
  let module: TestingModule;
  let service: ClaimService;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await createTestModule();
    service = module.get<ClaimService>(ClaimService);
    dataSource = module.get<DataSource>(DataSource);
  }, 30000); // Timeout de 30 secondes pour l'initialisation

  afterEach(async () => {
    await cleanupDatabase(dataSource);
  });

  afterAll(async () => {
    await closeDatabaseConnection(dataSource);
    if (module) {
      await module.close();
    }
  });

  describe('getAll', () => {
    it('should return all claims from database', async () => {
      // Créer des claims dans la BDD
      const claimRepo: Repository<TestClaimEntity> =
        dataSource.getRepository(TestClaimEntity);
      await claimRepo.save([
        { claim: 'read:any:users' },
        { claim: 'create:any:users' },
        { claim: 'update:any:users' },
      ] as TestClaimEntity[]);

      const result: TestClaimEntity[] = await service.getAll();

      expect(result).toHaveLength(3);
      expect(result.map((c) => c.claim).sort()).toEqual([
        'create:any:users',
        'read:any:users',
        'update:any:users',
      ]);
    });

    it('should return empty array when no claims exist', async () => {
      const result: TestClaimEntity[] = await service.getAll();
      expect(result).toEqual([]);
    });
  });

  describe('getByClaim', () => {
    it('should find a claim by string', async () => {
      const claimRepo: Repository<TestClaimEntity> =
        dataSource.getRepository(TestClaimEntity);
      await claimRepo.save({
        claim: 'read:any:users',
      } as TestClaimEntity);

      const result: TestClaimEntity =
        await service.getByClaim('read:any:users');

      expect(result.claim).toBe('read:any:users');
      expect(result.action).toBe(ClaimAction.READ);
      expect(result.scope).toBe(ClaimScope.ANY);
      expect(result.resource).toBe('users');
    });

    it('should find a claim by Claim object', async () => {
      const claimRepo: Repository<TestClaimEntity> =
        dataSource.getRepository(TestClaimEntity);
      await claimRepo.save({
        claim: 'create:organisation:establishments',
      } as TestClaimEntity);

      const claimObj: Claim = claim(
        ClaimAction.CREATE,
        ClaimScope.ORGANISATION,
        'establishments',
      );
      const result: TestClaimEntity = await service.getByClaim(claimObj);

      expect(result.claim).toBe('create:organisation:establishments');
      expect(result.action).toBe(ClaimAction.CREATE);
      expect(result.scope).toBe(ClaimScope.ORGANISATION);
      expect(result.resource).toBe('establishments');
    });

    it('should throw NotFoundException when claim does not exist', async () => {
      await expect(service.getByClaim('read:any:nonexistent')).rejects.toThrow(
        'Claim "read:any:nonexistent" not found',
      );
    });
  });

  describe('getClaims', () => {
    it('should return multiple claims by their string representations', async () => {
      const claimRepo: Repository<TestClaimEntity> =
        dataSource.getRepository(TestClaimEntity);
      await claimRepo.save([
        { claim: 'read:any:users' },
        { claim: 'create:any:users' },
        { claim: 'update:any:users' },
      ] as TestClaimEntity[]);

      const result: TestClaimEntity[] = await service.getClaims([
        'read:any:users',
        'create:any:users',
      ]);

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.claim).sort()).toEqual([
        'create:any:users',
        'read:any:users',
      ]);
    });

    it('should return claims with mixed input types', async () => {
      const claimRepo: Repository<TestClaimEntity> =
        dataSource.getRepository(TestClaimEntity);
      await claimRepo.save([
        { claim: 'read:any:users' },
        { claim: 'create:organisation:establishments' },
        { claim: 'update:establishment:menus' },
      ] as TestClaimEntity[]);

      const result: TestClaimEntity[] = await service.getClaims([
        'read:any:users',
        claim(ClaimAction.CREATE, ClaimScope.ORGANISATION, 'establishments'),
        [ClaimAction.UPDATE, ClaimScope.ESTABLISHMENT, 'menus'],
      ]);

      expect(result).toHaveLength(3);
    });

    it('should throw NotFoundException when some claims are missing', async () => {
      const claimRepo: Repository<TestClaimEntity> =
        dataSource.getRepository(TestClaimEntity);
      await claimRepo.save({ claim: 'read:any:users' } as TestClaimEntity);

      await expect(
        service.getClaims(['read:any:users', 'create:any:nonexistent']),
      ).rejects.toThrow('One or more claims not found');
    });
  });

  describe('exists', () => {
    it('should return true when claim exists', async () => {
      const claimRepo: Repository<TestClaimEntity> =
        dataSource.getRepository(TestClaimEntity);
      await claimRepo.save({ claim: 'read:any:users' } as TestClaimEntity);

      const result: boolean = await service.exists('read:any:users');
      expect(result).toBe(true);
    });

    it('should return false when claim does not exist', async () => {
      const result: boolean = await service.exists('read:any:nonexistent');
      expect(result).toBe(false);
    });

    it('should work with Claim object input', async () => {
      const claimRepo: Repository<TestClaimEntity> =
        dataSource.getRepository(TestClaimEntity);
      await claimRepo.save({
        claim: 'create:organisation:establishments',
      } as TestClaimEntity);

      const claimObj: Claim = claim(
        ClaimAction.CREATE,
        ClaimScope.ORGANISATION,
        'establishments',
      );
      const result: boolean = await service.exists(claimObj);
      expect(result).toBe(true);
    });
  });
});
