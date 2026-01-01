import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { TestAuthModule } from './test-module';
// Entités de test avec types compatibles SQLite
import { TestActionEntity } from './entities/test-action.entity';
import { TestSessionEntity } from './entities/test-session.entity';
import { TestRoleEntity } from './entities/test-role.entity';
import { TestUserEntity } from './entities/test-user.entity';
import { TestCredentialEntity } from './entities/test-credential.entity';
import { TestClaimEntity } from './entities/test-claim.entity';
import { TestUserAccountEntity } from './entities/test-user-account.entity';
import { TestOrganisationEntity } from './entities/test-organisation.entity';
import { TestEstablishmentEntity } from './entities/test-establishment.entity';

// Mock MailerService pour les tests
import { MailerServiceToken } from '@devlab-io/nest-mailer';

const mockMailerService: {
  send: jest.Mock<Promise<boolean>, [string, string, string]>;
  sendMail: jest.Mock<Promise<boolean>, [string, string, string]>;
} = {
  send: jest.fn().mockResolvedValue(true),
  sendMail: jest.fn().mockResolvedValue(true),
};

// Module de test qui fournit le MailerService mocké
// @Global() permet de rendre le provider disponible pour AuthModule qui est aussi @Global()
@Global()
@Module({
  providers: [
    {
      provide: MailerServiceToken,
      useValue: mockMailerService,
    },
  ],
  exports: [MailerServiceToken],
})
class MockMailerModule {}

/**
 * Configuration TypeORM pour les tests avec SQLite en mémoire
 * Note: On utilise synchronize: true car les migrations contiennent
 * des fonctionnalités PostgreSQL spécifiques (uuid-ossp, etc.)
 * On utilise TestActionEntity et TestSessionEntity qui ont des types
 * compatibles SQLite (datetime au lieu de timestamp)
 */
export const getTestDataSourceOptions = (): DataSourceOptions => ({
  type: 'sqlite',
  database: ':memory:',
  entities: [
    TestUserEntity, // Utilise TestActionEntity et TestCredentialEntity
    TestRoleEntity, // Utilise TestActionEntity et TestClaimEntity
    TestClaimEntity, // Utilise TestRoleEntity
    TestActionEntity, // Utilise datetime au lieu de timestamp
    TestSessionEntity, // Utilise datetime au lieu de timestamp
    TestOrganisationEntity, // Utilise TestEstablishmentEntity
    TestEstablishmentEntity, // Utilise TestUserAccountEntity
    TestCredentialEntity, // Utilise TestUserEntity
    TestUserAccountEntity, // Utilise TestUserEntity et TestRoleEntity
  ],
  synchronize: true, // Crée les tables automatiquement (plus simple pour les tests)
  dropSchema: true, // Nettoie la BDD entre les tests
  logging: false, // Désactive les logs en test
});

/**
 * Crée un module de test avec une base de données en mémoire
 *
 * @param additionalProviders - Providers supplémentaires à ajouter au module de test
 * @param additionalImports - Imports supplémentaires à ajouter au module de test
 * @returns Module de test compilé avec base de données SQLite en mémoire
 */
export async function createTestModule(
  additionalProviders: Provider[] = [],
  additionalImports: Array<DynamicModule> = [],
): Promise<TestingModule> {
  const moduleBuilder = Test.createTestingModule({
    imports: [
      // Import MockMailerModule AVANT AuthModule pour que le provider soit disponible
      MockMailerModule,
      TypeOrmModule.forRootAsync({
        useFactory: () => getTestDataSourceOptions(),
      }),
      // Utiliser TestAuthModule au lieu de AuthModule pour éviter les dépendances complexes
      // TestAuthModule n'importe que les services nécessaires pour les tests
      TestAuthModule.forRoot(),
      ...additionalImports,
    ],
    providers: [...additionalProviders],
  });

  const module: TestingModule = await moduleBuilder.compile();

  return module;
}

/**
 * Nettoie la base de données après les tests
 *
 * @param dataSource - DataSource TypeORM à nettoyer
 */
export async function cleanupDatabase(
  dataSource: DataSource | undefined | null,
): Promise<void> {
  if (!dataSource || !dataSource.isInitialized) {
    return;
  }
  const entities = dataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(`DELETE FROM ${entity.tableName}`);
  }
}

/**
 * Ferme la connexion à la base de données
 *
 * @param dataSource - DataSource TypeORM à fermer
 */
export async function closeDatabaseConnection(
  dataSource: DataSource | undefined | null,
): Promise<void> {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
  }
}
