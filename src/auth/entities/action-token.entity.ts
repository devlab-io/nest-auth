import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { ActionTokenType, ActionToken } from '../types';
import { UserEntity } from './user.entity';
import { RoleEntity } from './role.entity';

@Entity({ name: 'action_tokens' })
@Check(
  'check_action_tokens_type_valid',
  "type in ('invite','reset-password','accept-terms','validate-email','create-password','accept-privacy-policy')",
)
export class ActionTokenEntity implements ActionToken {
  @PrimaryColumn({ type: 'text' })
  token: string;

  @Column({ type: 'text' })
  type: ActionTokenType;

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
