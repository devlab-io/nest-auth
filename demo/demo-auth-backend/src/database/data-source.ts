import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

// Import entities and migrations from nest-auth
import {
  ActionEntity,
  ClaimEntity,
  OrganisationEntity,
  EstablishmentEntity,
  CredentialEntity,
  UserAccountEntity,
  RoleEntity,
  SessionEntity,
  UserEntity,
} from '@devlab-io/nest-auth';

import { CreateAuthSchema1700000000000 } from '@devlab-io/nest-auth';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'nest-auth',
  password: process.env.DB_PASSWORD || 'ChangeMe1234*',
  database: process.env.DB_DATABASE || 'nest-auth-db',
  entities: [
    ActionEntity,
    ClaimEntity,
    OrganisationEntity,
    EstablishmentEntity,
    CredentialEntity,
    UserAccountEntity,
    RoleEntity,
    SessionEntity,
    UserEntity,
  ],
  migrations: [CreateAuthSchema1700000000000],
  logging: ['error', 'warn', 'migration'],
  synchronize: false,
  migrationsTableName: 'migrations',
  migrationsRun: true,
  dropSchema: false,
};

const dataSource: DataSource = new DataSource(dataSourceOptions);
export default dataSource;
