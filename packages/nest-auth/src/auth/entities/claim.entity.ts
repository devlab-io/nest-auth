import { Entity, ManyToMany, PrimaryColumn } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import {
  Claim,
  ClaimAction,
  ClaimScope,
  ClaimsUtils,
} from '@devlab-io/nest-auth-types';
import { RoleEntity } from './role.entity';

/**
 * Base ClaimEntity implementation.
 *
 * This entity stores claims as a concatenated string in the format "action:scope:resource".
 * The claim string is the primary key.
 *
 * This entity can be extended by users to add custom fields and relations.
 * Extended entities must use the same table name ('claims') and should
 * inherit from this class.
 *
 * @example
 * ```typescript
 * @Entity({ name: 'claims' })
 * export class ExtendedClaimEntity extends ClaimEntity {
 *   @Column({ name: 'custom_field' })
 *   customField: string;
 * }
 * ```
 *
 * Note: When extending this entity, ensure that:
 * - The table name remains 'claims'
 * - All base fields and relations are preserved
 * - Custom migrations are created to add new columns/relations
 */
@Entity({ name: 'claims' })
export class ClaimEntity implements Claim {
  @PrimaryColumn({ name: 'claim', type: 'text' })
  @Exclude()
  claim: string;

  @Expose()
  get action(): ClaimAction {
    return ClaimsUtils.parse(this.claim).action;
  }

  @Expose()
  get scope(): ClaimScope {
    return ClaimsUtils.parse(this.claim).scope;
  }

  @Expose()
  get resource(): string {
    return ClaimsUtils.parse(this.claim).resource;
  }

  @ManyToMany(() => RoleEntity, (role) => role.claims, {
    cascade: false,
  })
  roles: RoleEntity[];

  public toString(): string {
    return this.claim;
  }
}
