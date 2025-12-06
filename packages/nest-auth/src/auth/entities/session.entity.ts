import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Session } from '@devlab-io/nest-auth-types';
import { UserAccountEntity } from './user-account.entity';

@Entity({ name: 'sessions' })
export class SessionEntity implements Session {
  @PrimaryColumn({ name: 'token', type: 'text' })
  token: string;

  @Column({ name: 'user_account_id', type: 'uuid' })
  userAccountId: string;

  @CreateDateColumn({ name: 'login_date' })
  loginDate: Date;

  @Column({ type: 'timestamp', name: 'expiration_date' })
  expirationDate: Date;

  @ManyToOne(() => UserAccountEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_account_id' })
  userAccount: UserAccountEntity;
}
