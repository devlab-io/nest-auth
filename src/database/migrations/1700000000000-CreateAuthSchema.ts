import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
  TableCheck,
} from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../../auth/entities/user.entity';
import { RoleEntity } from '../../auth/entities/role.entity';
import { OrganisationEntity } from '../../auth/entities/organisation.entity';
import { EstablishmentEntity } from '../../auth/entities/establishment.entity';
import { CredentialEntity } from '../../auth/entities/credential.entity';
import { UserAccountEntity } from '../../auth/entities/user-account.entity';
import { BadRequestException } from '@nestjs/common';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

export class CreateAuthSchema1700000000000 implements MigrationInterface {
  public readonly name: string = 'CreateAuthSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension for PostgreSQL (if not already enabled)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create roles table
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        comment: 'Stores user roles (admin, user, moderator, etc.)',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'Primary key, auto-incremented integer',
            primaryKeyConstraintName: 'PK_roles_id',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
            comment: 'Unique role name (e.g., admin, user, moderator)',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Optional description of the role',
          },
        ],
      }),
      true,
    );

    // Create unique constraint for roles.name
    await queryRunner.createIndex(
      'roles',
      new TableIndex({
        name: 'UQ_roles_name',
        columnNames: ['name'],
        isUnique: true,
      }),
    );

    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        comment: 'Stores user account information',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
            comment: 'Unique identifier of the user',
            primaryKeyConstraintName: 'PK_users_id',
          },
          {
            name: 'username',
            type: 'varchar',
            isNullable: false,
            comment: 'Unique username for the user',
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: false,
            comment: 'Unique email address for the user',
          },
          {
            name: 'email_validated',
            type: 'boolean',
            default: false,
            isNullable: false,
            comment: 'Indicates if the user email has been validated',
          },
          {
            name: 'first_name',
            type: 'varchar',
            isNullable: true,
            comment: 'User first name',
          },
          {
            name: 'last_name',
            type: 'varchar',
            isNullable: true,
            comment: 'User last name',
          },
          {
            name: 'phone',
            type: 'varchar',
            isNullable: true,
            comment: 'User phone number',
          },
          {
            name: 'enabled',
            type: 'boolean',
            default: true,
            isNullable: false,
            comment: 'Indicates if the user account is enabled/active',
          },
          {
            name: 'profilePicture',
            type: 'varchar',
            isNullable: true,
            comment: 'URL to the user profile picture',
          },
          {
            name: 'acceptedTerms',
            type: 'boolean',
            default: false,
            isNullable: false,
            comment: 'Indicates if the user accepted the terms of service',
          },
          {
            name: 'acceptedPrivacyPolicy',
            type: 'boolean',
            default: false,
            isNullable: false,
            comment: 'Indicates if the user accepted the privacy policy',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Timestamp when the user account was created',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Timestamp when the user account was last updated',
          },
        ],
      }),
      true,
    );

    // Create unique indexes for users
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'UQ_users_email',
        columnNames: ['email'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'UQ_users_username',
        columnNames: ['username'],
        isUnique: true,
      }),
    );

    // Create organisations table
    await queryRunner.createTable(
      new Table({
        name: 'organisations',
        comment:
          'Stores organisations (companies that manage multiple establishments)',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
            comment: 'Unique identifier of the organisation',
            primaryKeyConstraintName: 'PK_organisations_id',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
            comment: 'Name of the organisation',
          },
        ],
      }),
      true,
    );

    // Create establishments table
    await queryRunner.createTable(
      new Table({
        name: 'establishments',
        comment: 'Stores establishments (restaurants, stores, etc.)',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
            comment: 'Unique identifier of the establishment',
            primaryKeyConstraintName: 'PK_establishments_id',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
            comment: 'Name of the establishment',
          },
          {
            name: 'organisation_id',
            type: 'uuid',
            isNullable: false,
            comment: 'Foreign key to organisations.id, cascades on delete',
          },
        ],
      }),
      true,
    );

    // Create foreign key for establishments -> organisations
    await queryRunner.createForeignKey(
      'establishments',
      new TableForeignKey({
        name: 'FK_establishments_organisation_id_organisations_id',
        columnNames: ['organisation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organisations',
        onDelete: 'CASCADE',
      }),
    );

    // Create credentials table
    await queryRunner.createTable(
      new Table({
        name: 'credentials',
        comment: 'Stores user credentials (password, google OAuth, etc.)',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
            comment: 'Unique identifier of the credential',
            primaryKeyConstraintName: 'PK_credentials_id',
          },
          {
            name: 'type',
            type: 'varchar',
            isNullable: false,
            comment: 'Type of credential (password or google)',
          },
          {
            name: 'password',
            type: 'varchar',
            isNullable: true,
            comment: 'Hashed password (bcrypt), only for type=password',
          },
          {
            name: 'googleId',
            type: 'varchar',
            isNullable: true,
            comment: 'Google OAuth ID, only for type=google',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
            comment: 'Foreign key to users.id, cascades on delete',
          },
        ],
        checks: [
          new TableCheck({
            name: 'CHK_credentials_type_valid',
            expression: "type IN ('password', 'google')",
          }),
        ],
      }),
      true,
    );

    // Create foreign key for credentials -> users
    await queryRunner.createForeignKey(
      'credentials',
      new TableForeignKey({
        name: 'FK_credentials_user_id_users_id',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create user_accounts table
    await queryRunner.createTable(
      new Table({
        name: 'user_accounts',
        comment:
          'Stores user accounts linking users to organisations, establishments and roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
            comment: 'Unique identifier of the user account',
            primaryKeyConstraintName: 'PK_user_accounts_id',
          },
          {
            name: 'organisation_id',
            type: 'uuid',
            isNullable: false,
            comment: 'Foreign key to organisations.id, cascades on delete',
          },
          {
            name: 'establishment_id',
            type: 'uuid',
            isNullable: false,
            comment: 'Foreign key to establishments.id, cascades on delete',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
            comment: 'Foreign key to users.id, cascades on delete',
          },
        ],
      }),
      true,
    );

    // Create foreign keys for user_accounts
    await queryRunner.createForeignKey(
      'user_accounts',
      new TableForeignKey({
        name: 'FK_user_accounts_organisation_id_organisations_id',
        columnNames: ['organisation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organisations',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_accounts',
      new TableForeignKey({
        name: 'FK_user_accounts_establishment_id_establishments_id',
        columnNames: ['establishment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'establishments',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_accounts',
      new TableForeignKey({
        name: 'FK_user_accounts_user_id_users_id',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create user_account_roles junction table
    await queryRunner.createTable(
      new Table({
        name: 'user_account_roles',
        comment:
          'Junction table for many-to-many relationship between user accounts and roles',
        columns: [
          {
            name: 'userAccountId',
            type: 'uuid',
            isPrimary: true,
            primaryKeyConstraintName: 'PK_user_account_roles_composite',
            comment: 'Foreign key to user_accounts.id, cascades on delete',
          },
          {
            name: 'roleId',
            type: 'integer',
            isPrimary: true,
            comment: 'Foreign key to roles.id, cascades on delete',
          },
        ],
      }),
      true,
    );

    // Create foreign keys for user_account_roles
    await queryRunner.createForeignKey(
      'user_account_roles',
      new TableForeignKey({
        name: 'FK_user_account_roles_userAccountId_user_accounts_id',
        columnNames: ['userAccountId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user_accounts',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_account_roles',
      new TableForeignKey({
        name: 'FK_user_account_roles_roleId_roles_id',
        columnNames: ['roleId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'CASCADE',
      }),
    );

    // Create action_tokens table
    await queryRunner.createTable(
      new Table({
        name: 'action_tokens',
        comment:
          'Stores action tokens for invitations, password resets, email validation, etc.',
        columns: [
          {
            name: 'token',
            type: 'text',
            isPrimary: true,
            comment: 'Primary key, unique token string',
            primaryKeyConstraintName: 'PK_action_tokens_token',
          },
          {
            name: 'type',
            type: 'integer',
            isNullable: false,
            comment:
              'Bit mask of ActionType values (Invite, ValidateEmail, ResetPassword, etc.)',
          },
          {
            name: 'email',
            type: 'text',
            isNullable: false,
            comment: 'Email address associated with the token',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Timestamp when the token was created',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Timestamp when the token expires (nullable)',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
            comment:
              'Foreign key to users.id, nullable (for invitation tokens before user creation)',
          },
          {
            name: 'organisation_id',
            type: 'uuid',
            isNullable: true,
            comment:
              'Foreign key to organisations.id, nullable (for Invite action: organisation to create user account in)',
          },
          {
            name: 'establishment_id',
            type: 'uuid',
            isNullable: true,
            comment:
              'Foreign key to establishments.id, nullable (for Invite action: establishment to create user account in)',
          },
        ],
        checks: [
          new TableCheck({
            name: 'CHK_action_tokens_expires_after_created',
            expression: 'expires_at IS NULL OR expires_at > created_at',
          }),
          new TableCheck({
            name: 'CHK_action_tokens_type_positive',
            expression: 'type > 0',
          }),
        ],
      }),
      true,
    );

    // Create foreign keys for action_tokens
    await queryRunner.createForeignKey(
      'action_tokens',
      new TableForeignKey({
        name: 'FK_action_tokens_user_id_users_id',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'action_tokens',
      new TableForeignKey({
        name: 'FK_action_tokens_organisation_id_organisations_id',
        columnNames: ['organisation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organisations',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'action_tokens',
      new TableForeignKey({
        name: 'FK_action_tokens_establishment_id_establishments_id',
        columnNames: ['establishment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'establishments',
        onDelete: 'CASCADE',
      }),
    );

    // Create action_token_roles junction table
    await queryRunner.createTable(
      new Table({
        name: 'action_token_roles',
        comment:
          'Junction table for many-to-many relationship between action tokens and roles',
        columns: [
          {
            name: 'token',
            type: 'text',
            isPrimary: true,
            primaryKeyConstraintName: 'PK_action_token_roles_composite',
            comment: 'Foreign key to action_tokens.token, cascades on delete',
          },
          {
            name: 'role_id',
            type: 'integer',
            isPrimary: true,
            comment: 'Foreign key to roles.id, cascades on delete',
          },
        ],
      }),
      true,
    );

    // Create foreign keys for action_token_roles
    await queryRunner.createForeignKey(
      'action_token_roles',
      new TableForeignKey({
        name: 'FK_action_token_roles_token_action_tokens_token',
        columnNames: ['token'],
        referencedColumnNames: ['token'],
        referencedTableName: 'action_tokens',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'action_token_roles',
      new TableForeignKey({
        name: 'FK_action_token_roles_role_id_roles_id',
        columnNames: ['role_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'CASCADE',
      }),
    );

    // Create sessions table
    await queryRunner.createTable(
      new Table({
        name: 'sessions',
        comment: 'Stores active JWT sessions for authenticated user accounts',
        columns: [
          {
            name: 'token',
            type: 'text',
            isPrimary: true,
            comment: 'Primary key, JWT token string',
            primaryKeyConstraintName: 'PK_sessions_token',
          },
          {
            name: 'user_account_id',
            type: 'uuid',
            isNullable: false,
            comment: 'Foreign key to user_accounts.id, cascades on delete',
          },
          {
            name: 'login_date',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
            comment: 'Timestamp when the user logged in (session created)',
          },
          {
            name: 'expiration_date',
            type: 'timestamp',
            isNullable: false,
            comment: 'Timestamp when the session expires',
          },
        ],
        checks: [
          new TableCheck({
            name: 'CHK_sessions_expiration_after_login',
            expression: 'expiration_date > login_date',
          }),
        ],
      }),
      true,
    );

    // Create foreign key for sessions
    await queryRunner.createForeignKey(
      'sessions',
      new TableForeignKey({
        name: 'FK_sessions_user_account_id_user_accounts_id',
        columnNames: ['user_account_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user_accounts',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for sessions (for better query performance)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_user_account_id',
        columnNames: ['user_account_id'],
      }),
    );

    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_expiration_date',
        columnNames: ['expiration_date'],
      }),
    );

    // Create super administrator
    await this.createSuperAdmin(queryRunner);
  }

  /**
   * Create the super administrator user
   *
   * @param queryRunner - The query runner
   */
  private async createSuperAdmin(queryRunner: QueryRunner): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@devlab.io';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe1234*';

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Create Devlab organisation
    let devlabOrganisation: OrganisationEntity | null =
      await queryRunner.manager.findOne(OrganisationEntity, {
        where: { name: 'Devlab' },
      });
    if (!devlabOrganisation) {
      devlabOrganisation = queryRunner.manager.create(OrganisationEntity, {
        name: 'Devlab',
      });
      devlabOrganisation = await queryRunner.manager.save(devlabOrganisation);
    }

    // Create Devlab establishment
    let devlabEstablishment: EstablishmentEntity | null =
      await queryRunner.manager.findOne(EstablishmentEntity, {
        where: { name: 'Devlab', organisation: { id: devlabOrganisation.id } },
      });
    if (!devlabEstablishment) {
      devlabEstablishment = queryRunner.manager.create(EstablishmentEntity, {
        name: 'Devlab',
        organisation: devlabOrganisation!,
      });
      devlabEstablishment = await queryRunner.manager.save(devlabEstablishment);
    }

    // Create or get the admin role
    let adminRole = await queryRunner.manager.findOne(RoleEntity, {
      where: { name: 'admin' },
    });
    if (!adminRole) {
      // Create admin role
      adminRole = queryRunner.manager.create(RoleEntity, {
        name: 'admin',
        description: 'Super administrator with full access',
      });
      adminRole = await queryRunner.manager.save(adminRole);
    }

    // Check if admin user already exists
    const existingAdmin = await queryRunner.manager.findOne(UserEntity, {
      where: { email: adminEmail },
    });
    if (!existingAdmin) {
      // Create the admin user using TypeORM
      let user: UserEntity = queryRunner.manager.create(UserEntity, {
        username: 'admin',
        email: adminEmail,
        emailValidated: true,
        firstName: 'Admin',
        lastName: 'Devlab',
        phone: '+689123456789',
        enabled: true,
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        profilePicture: 'https://example.com/profile.jpg',
      });
      user = await queryRunner.manager.save(user);

      // Create password credential for admin user
      const credential: CredentialEntity = queryRunner.manager.create(
        CredentialEntity,
        {
          type: 'password',
          password: hashedPassword,
          user: user,
        },
      );
      await queryRunner.manager.save(credential);

      // Create user account with admin role
      const account: UserAccountEntity = queryRunner.manager.create(
        UserAccountEntity,
        {
          user: user,
          organisation: devlabOrganisation!,
          establishment: devlabEstablishment!,
          roles: [adminRole],
        },
      );
      await queryRunner.manager.save(account);
    }
    // Create organisations and establishments from tenants config
    await this.createTenantsFromConfig(queryRunner);
  }

  /**
   * Creates organisations and establishments from tenants configuration.
   * Reads AUTH_TENANTS_ORGANISATIONS and AUTH_TENANTS_ESTABLISHMENTS from environment variables.
   * @param queryRunner - The query runner
   */
  private async createTenantsFromConfig(
    queryRunner: QueryRunner,
  ): Promise<void> {
    // Parse organisations from environment variable
    const organisationsEnv = process.env.AUTH_TENANTS_ORGANISATIONS || '';
    const organisations: string[] = organisationsEnv
      .split(',')
      .map((org) => org.trim())
      .filter((org) => org.length > 0);

    // Parse establishments from environment variable
    const establishmentsEnv = process.env.AUTH_TENANTS_ESTABLISHMENTS || '';
    const establishments: string[] = establishmentsEnv
      .split(',')
      .map((est) => est.trim())
      .filter((est) => est.length > 0);

    // Create organisations
    const organisationsCache: Map<string, OrganisationEntity> = new Map();
    for (const organisationName of organisations) {
      let organisation: OrganisationEntity | null =
        await queryRunner.manager.findOne(OrganisationEntity, {
          where: { name: organisationName },
        });

      if (!organisation) {
        organisation = queryRunner.manager.create(OrganisationEntity, {
          name: organisationName,
        });
        organisation = await queryRunner.manager.save(organisation);
      }
      organisationsCache.set(organisation.name, organisation);
    }

    // Create establishments and associate them with the first available organisation
    for (const organisationAndEstablishmentName of establishments) {
      const [organisationName, establishmentName] =
        organisationAndEstablishmentName.split(':');
      const organisation: OrganisationEntity | undefined =
        organisationsCache.get(organisationName);
      if (!organisation) {
        throw new BadRequestException(
          `Organisation ${organisationName} not found`,
        );
      }
      let establishment: EstablishmentEntity | null =
        await queryRunner.manager.findOne(EstablishmentEntity, {
          where: {
            name: establishmentName,
            organisation: organisation,
          },
        });

      if (!establishment) {
        establishment = queryRunner.manager.create(EstablishmentEntity, {
          name: establishmentName,
          organisation: organisation,
        });
        establishment = await queryRunner.manager.save(establishment);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sessions_expiration_date"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sessions_user_account_id"`,
    );

    // Drop tables in reverse order (respecting foreign key constraints)
    await queryRunner.dropTable('sessions', true);
    await queryRunner.dropTable('user_account_roles', true);
    await queryRunner.dropTable('user_accounts', true);
    await queryRunner.dropTable('credentials', true);
    await queryRunner.dropTable('action_token_roles', true);
    await queryRunner.dropTable('action_tokens', true);
    await queryRunner.dropTable('establishments', true);
    await queryRunner.dropTable('organisations', true);
    await queryRunner.dropTable('users', true);
    await queryRunner.dropTable('roles', true);

    // Note: We don't drop the UUID extension as it might be used by other tables
  }
}
