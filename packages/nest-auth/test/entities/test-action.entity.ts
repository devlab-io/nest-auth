import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Action } from '@devlab-io/nest-auth-types';
import { TestUserEntity } from './test-user.entity';
import { TestRoleEntity } from './test-role.entity';

/**
 * Entité de test pour ActionEntity avec types compatibles SQLite
 * Remplace 'timestamp' par 'datetime' pour SQLite
 */
@Entity({ name: 'action_tokens' })
export class TestActionEntity implements Action {
  @PrimaryColumn({ name: 'token', type: 'text' })
  token: string;

  @Column({ name: 'type', type: 'integer' })
  type: number; // Bit mask of ActionType values

  @Column({ name: 'email', type: 'text' })
  email: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'datetime', name: 'expires_at', nullable: true })
  expiresAt?: Date;

  @ManyToOne(() => TestUserEntity, (user) => user.actions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user?: TestUserEntity;

  @ManyToMany(() => TestRoleEntity, (role) => role.actionTokens, {
    cascade: false,
  })
  @JoinTable({
    name: 'action_token_roles',
    joinColumn: {
      name: 'token',
      referencedColumnName: 'token',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
  })
  roles: TestRoleEntity[];

  @Column({ name: 'organisation_id', type: 'uuid', nullable: true })
  organisationId?: string;

  @Column({ name: 'establishment_id', type: 'uuid', nullable: true })
  establishmentId?: string;
}
