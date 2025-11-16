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
import { ActionToken } from '../types';
import { UserEntity } from './user.entity';
import { RoleEntity } from './role.entity';

@Entity({ name: 'action_tokens' })
export class ActionTokenEntity implements ActionToken {
  @PrimaryColumn({ type: 'text' })
  token: string;

  @Column({ type: 'integer' })
  type: number; // Bit mask of ActionTokenType values

  @Column({ type: 'text' })
  email: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'expires_at', nullable: true })
  expiresAt?: Date;

  @ManyToOne(() => UserEntity, (user) => user.actionsTokens, {
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
  roles?: RoleEntity[];
}
