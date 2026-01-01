import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Session } from '@devlab-io/nest-auth-types';
import { TestUserAccountEntity } from './test-user-account.entity';

/**
 * Entité de test pour SessionEntity avec types compatibles SQLite
 * Remplace 'timestamp' par 'datetime' pour SQLite
 */
@Entity({ name: 'sessions' })
export class TestSessionEntity implements Session {
  @PrimaryColumn({ name: 'token', type: 'text' })
  token: string;

  @Column({ name: 'user_account_id', type: 'uuid' })
  userAccountId: string;

  @CreateDateColumn({ name: 'login_date' })
  loginDate: Date;

  @Column({ type: 'datetime', name: 'expiration_date' })
  expirationDate: Date;

  @ManyToOne(() => TestUserAccountEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_account_id' })
  userAccount: TestUserAccountEntity;
}
