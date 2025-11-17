import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateAuthSchema1700000000000 implements MigrationInterface {
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
            name: 'password',
            type: 'varchar',
            isNullable: true,
            comment: 'Hashed password (bcrypt), nullable for OAuth users',
          },
          {
            name: 'googleId',
            type: 'varchar',
            isNullable: true,
            comment: 'Google OAuth ID if user signed in with Google',
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

    // Create user_roles junction table
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
        comment:
          'Junction table for many-to-many relationship between users and roles',
        columns: [
          {
            name: 'userId',
            type: 'uuid',
            isPrimary: true,
            comment: 'Foreign key to users.id, cascades on delete',
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

    // Rename the composite primary key constraint for user_roles
    await queryRunner.query(
      `ALTER TABLE "user_roles" RENAME CONSTRAINT "user_roles_pkey" TO "PK_user_roles_composite"`,
    );

    // Create foreign keys for user_roles
    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        name: 'FK_user_roles_userId_users_id',
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        name: 'FK_user_roles_roleId_roles_id',
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
              'Bit mask of ActionTokenType values (Invite, ValidateEmail, ResetPassword, etc.)',
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
        ],
      }),
      true,
    );

    // Create foreign key for action_tokens
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

    // Rename the composite primary key constraint for action_token_roles
    await queryRunner.query(
      `ALTER TABLE "action_token_roles" RENAME CONSTRAINT "action_token_roles_pkey" TO "PK_action_token_roles_composite"`,
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
        comment: 'Stores active JWT sessions for authenticated users',
        columns: [
          {
            name: 'token',
            type: 'text',
            isPrimary: true,
            comment: 'Primary key, JWT token string',
            primaryKeyConstraintName: 'PK_sessions_token',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
            comment: 'Foreign key to users.id, cascades on delete',
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
      }),
      true,
    );

    // Create foreign key for sessions
    await queryRunner.createForeignKey(
      'sessions',
      new TableForeignKey({
        name: 'FK_sessions_user_id_users_id',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for sessions (for better query performance)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_expiration_date',
        columnNames: ['expiration_date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sessions_expiration_date"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sessions_user_id"`);

    // Drop tables in reverse order (respecting foreign key constraints)
    await queryRunner.dropTable('sessions', true);
    await queryRunner.dropTable('action_token_roles', true);
    await queryRunner.dropTable('action_tokens', true);
    await queryRunner.dropTable('user_roles', true);
    await queryRunner.dropTable('users', true);
    await queryRunner.dropTable('roles', true);

    // Note: We don't drop the UUID extension as it might be used by other tables
  }
}
