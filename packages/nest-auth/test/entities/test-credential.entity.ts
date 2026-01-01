import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Credential } from '@devlab-io/nest-auth-types';
import { TestUserEntity } from './test-user.entity';

/**
 * Entité de test pour CredentialEntity qui référence TestUserEntity
 * au lieu de UserEntity pour la compatibilité SQLite
 */
@Entity({ name: 'credentials' })
export class TestCredentialEntity implements Credential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'type', type: 'varchar' })
  type: 'password' | 'google';

  @Column({ name: 'password', nullable: true })
  password?: string;

  @Column({ name: 'google_id', nullable: true })
  googleId?: string;

  @ManyToOne(() => TestUserEntity, (user) => user.credentials, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: TestUserEntity;
}
