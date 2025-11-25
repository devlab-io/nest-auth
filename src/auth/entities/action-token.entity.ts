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
import { Action } from '../types';
import { UserEntity } from './user.entity';
import { RoleEntity } from './role.entity';

@Entity({ name: 'action_tokens' })
export class ActionEntity implements Action {
  @PrimaryColumn({ name: 'token', type: 'text' })
  token: string;

  @Column({ name: 'type', type: 'integer' })
  type: number; // Bit mask of ActionType values

  @Column({ name: 'email', type: 'text' })
  email: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'expires_at', nullable: true })
  expiresAt?: Date;

  @ManyToOne(() => UserEntity, (user) => user.actions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @ManyToMany(() => RoleEntity, (role) => role.actionTokens, {
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
  roles: RoleEntity[];

  @Column({ name: 'organisation_id', type: 'uuid', nullable: true })
  organisationId?: string;

  @Column({ name: 'establishment_id', type: 'uuid', nullable: true })
  establishmentId?: string;
}
