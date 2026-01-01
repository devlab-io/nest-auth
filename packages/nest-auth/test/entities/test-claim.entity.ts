import { Entity, ManyToMany, PrimaryColumn } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import {
  Claim,
  ClaimAction,
  ClaimScope,
  ClaimsUtils,
} from '@devlab-io/nest-auth-types';
import { TestRoleEntity } from './test-role.entity';

/**
 * Entité de test pour ClaimEntity qui référence TestRoleEntity
 * au lieu de RoleEntity pour la compatibilité SQLite
 */
@Entity({ name: 'claims' })
export class TestClaimEntity implements Claim {
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

  @ManyToMany(() => TestRoleEntity, (role) => role.claims, {
    cascade: false,
  })
  roles: TestRoleEntity[];

  public toString(): string {
    return this.claim;
  }
}
