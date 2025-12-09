import { QueryRunner } from 'typeorm';
import { ClaimEntity } from '../../auth/entities/claim.entity';
import {
  ClaimAction,
  ClaimScope,
  ClaimsUtils,
} from '@devlab-io/nest-auth-types';

/**
 * Creates claims in the database for a given resource with specified actions and scopes.
 * This function generates all possible combinations of actions and scopes for the resource.
 *
 * @param queryRunner - The TypeORM query runner
 * @param actions - Array of actions to create claims for
 * @param scopes - Array of scopes to create claims for
 * @param resource - The resource name (e.g., 'users', 'organisations', etc.)
 * @returns Promise that resolves when all claims are created
 *
 * @example
 * ```typescript
 * await createClaimsForResource(
 *   queryRunner,
 *   [ClaimAction.READ, ClaimAction.CREATE],
 *   [ClaimScope.ANY, ClaimScope.OWN],
 *   'users'
 * );
 * // Creates: read:any:users, read:own:users, create:any:users, create:own:users
 * ```
 */
export async function createClaimsForResource(
  queryRunner: QueryRunner,
  actions: ClaimAction[],
  scopes: ClaimScope[],
  resource: string,
): Promise<void> {
  const claimsToCreate: ClaimEntity[] = [];

  // Generate all combinations of actions and scopes
  for (const action of actions) {
    for (const scope of scopes) {
      const claimString = ClaimsUtils.serialize({
        action,
        scope,
        resource,
      });

      // Check if claim already exists
      const existingClaim = await queryRunner.manager.findOne(ClaimEntity, {
        where: { claim: claimString },
      });

      if (!existingClaim) {
        const claimEntity = queryRunner.manager.create(ClaimEntity, {
          claim: claimString,
        });
        claimsToCreate.push(claimEntity);
      }
    }
  }

  // Insert all claims in batch
  if (claimsToCreate.length > 0) {
    await queryRunner.manager.save(ClaimEntity, claimsToCreate);
  }
}
