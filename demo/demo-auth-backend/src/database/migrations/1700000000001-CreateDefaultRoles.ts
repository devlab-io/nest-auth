import { MigrationInterface, QueryRunner } from 'typeorm';
import { RoleEntity } from '@devlab-io/nest-auth';
import { ClaimEntity } from '@devlab-io/nest-auth';
import {
  READ_OWN_USERS,
  READ_OWN_USER_ACCOUNTS,
  READ_OWN_ORGANISATIONS,
  READ_OWN_ESTABLISHMENTS,
  READ_OWN_SESSIONS,
  READ_ANY_ROLES,
  READ_ANY_CLAIMS,
  UPDATE_OWN_USERS,
  ENABLE_OWN_USERS,
  DISABLE_OWN_USER_ACCOUNTS,
  ClaimsUtils,
} from '@devlab-io/nest-auth-types';

/**
 * Migration to create default roles: user, free, basic, premium
 * The 'user' role has minimal claims for basic user operations
 */
export class CreateDefaultRoles1700000000001 implements MigrationInterface {
  public readonly name: string = 'CreateDefaultRoles1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get existing claims for the 'user' role using constants (claims are already created in CreateAuthSchema migration)
    const claimConstants = [
      // All READ:OWN claims for resources
      READ_OWN_USERS,
      READ_OWN_USER_ACCOUNTS,
      READ_OWN_ORGANISATIONS,
      READ_OWN_ESTABLISHMENTS,
      READ_OWN_SESSIONS,
      // READ:ANY for roles and claims (no READ:OWN available)
      READ_ANY_ROLES,
      READ_ANY_CLAIMS,
      // UPDATE:OWN:users (can modify own profile)
      UPDATE_OWN_USERS,
      // ENABLE:OWN:users (can enable/disable own profile)
      ENABLE_OWN_USERS,
      // DISABLE:OWN:user-accounts (can disable own account)
      DISABLE_OWN_USER_ACCOUNTS,
    ];

    // Convert claim constants to claim strings
    const claimStrings: string[] = claimConstants.map((claim) =>
      ClaimsUtils.serialize(claim),
    );

    // Get all claims at once
    const userClaims = await queryRunner.manager.find(ClaimEntity, {
      where: claimStrings.map((claim) => ({ claim })),
    });

    // Create the four roles with claims assigned to user role
    const userRole = queryRunner.manager.create(RoleEntity, {
      name: 'user',
      description: 'Basic user role with minimal permissions',
      claims: userClaims,
    });
    const freeRole = queryRunner.manager.create(RoleEntity, {
      name: 'free',
      description: 'Free tier user role',
    });
    const basicRole = queryRunner.manager.create(RoleEntity, {
      name: 'basic',
      description: 'Basic tier user role',
    });
    const premiumRole = queryRunner.manager.create(RoleEntity, {
      name: 'premium',
      description: 'Premium tier user role',
    });

    // Save all roles
    await queryRunner.manager.save(userRole);
    await queryRunner.manager.save(freeRole);
    await queryRunner.manager.save(basicRole);
    await queryRunner.manager.save(premiumRole);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the roles (cascade will remove role_claims associations)
    await queryRunner.manager.delete(RoleEntity, [
      { name: 'user' },
      { name: 'free' },
      { name: 'basic' },
      { name: 'premium' },
    ]);
  }
}
