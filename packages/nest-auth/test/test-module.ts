import { DynamicModule, Global, Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ClaimService } from '../src/auth/services/claim.service';
import { TestClaimEntity } from './entities/test-claim.entity';
import { ClaimEntity } from '../src/auth/entities';

/**
 * Module de test minimal pour les tests d'intégration
 * N'importe que les services nécessaires sans AuthModule complet
 */
@Global()
@Module({})
export class TestAuthModule {
  static forRoot(): DynamicModule {
    return {
      module: TestAuthModule,
      imports: [TypeOrmModule.forFeature([TestClaimEntity])],
      providers: [
        {
          provide: ClaimService,
          inject: [getRepositoryToken(TestClaimEntity)],
          useFactory: (
            claimRepository: Repository<TestClaimEntity>,
          ): ClaimService => {
            return new ClaimService(claimRepository as Repository<ClaimEntity>);
          },
        },
        // Override le repository pour que ClaimService reçoive le bon repository
        {
          provide: getRepositoryToken(ClaimEntity),
          useFactory: (dataSource: DataSource): Repository<ClaimEntity> => {
            return dataSource.getRepository(
              TestClaimEntity,
            ) as Repository<ClaimEntity>;
          },
          inject: [DataSource],
        },
      ],
      exports: [ClaimService],
    };
  }
}
