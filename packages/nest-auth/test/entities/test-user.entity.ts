import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@devlab-io/nest-auth-types';
import { TestActionEntity } from './test-action.entity';
import { TestCredentialEntity } from './test-credential.entity';
import { TestUserAccountEntity } from './test-user-account.entity';

/**
 * Entité de test pour UserEntity qui référence TestActionEntity
 * au lieu de ActionEntity pour la compatibilité SQLite
 */
@Entity({ name: 'users' })
@Unique('unique_email', ['email'])
@Unique('unique_username', ['username'])
export class TestUserEntity implements User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'username' })
  username: string;

  @Column({ name: 'email' })
  email: string;

  @Column({ name: 'email_validated', default: false })
  emailValidated: boolean;

  @Column({ name: 'first_name', nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', nullable: true })
  lastName?: string;

  @Column({ name: 'phone', nullable: true })
  phone?: string;

  @Column({ name: 'enabled', default: true })
  enabled: boolean;

  @Column({ name: 'profile_picture', nullable: true })
  profilePicture?: string;

  @Column({ name: 'accepted_terms', default: false })
  acceptedTerms: boolean;

  @Column({ name: 'accepted_privacy_policy', default: false })
  acceptedPrivacyPolicy: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => TestCredentialEntity, (credential) => credential.user, {
    cascade: false,
  })
  credentials: TestCredentialEntity[];

  @OneToMany(() => TestActionEntity, (token) => token.user, {
    cascade: false,
  })
  actions: TestActionEntity[];

  @OneToMany(() => TestUserAccountEntity, (userAccount) => userAccount.user, {
    cascade: false,
  })
  accounts: TestUserAccountEntity[];
}
