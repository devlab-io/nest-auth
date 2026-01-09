import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '@devlab-io/nest-auth-types';
import { TestActionEntity } from './test-action.entity';
import { TestClaimEntity } from './test-claim.entity';

/**
 * Entité de test pour RoleEntity qui référence TestActionEntity
 * au lieu de ActionEntity pour la compatibilité SQLite
 */
@Entity({ name: 'roles' })
export class TestRoleEntity implements Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', unique: true })
  name: string;

  @Column({ name: 'description', nullable: true })
  description?: string;

  @ManyToMany(() => TestActionEntity, (token) => token.roles, {
    cascade: false,
  })
  actionTokens: TestActionEntity[];

  @ManyToMany(() => TestClaimEntity, (claim) => claim.roles, {
    cascade: false,
  })
  @JoinTable({
    name: 'role_claims',
    joinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'claim',
      referencedColumnName: 'claim',
    },
  })
  claims: TestClaimEntity[];
}
