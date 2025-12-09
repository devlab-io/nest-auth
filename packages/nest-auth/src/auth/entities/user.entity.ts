import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '@devlab-io/nest-auth-types';
import { ActionEntity } from './action-token.entity';
import { CredentialEntity } from './credential.entity';
import { UserAccountEntity } from './user-account.entity';

/**
 * Name of the user table.
 */
export const USERS = 'users';

/**
 * Base UserEntity implementation.
 *
 * This entity can be extended by users to add custom fields and relations.
 * Extended entities must use the same table name ('users') and should
 * inherit from this class.
 *
 * @example
 * ```typescript
 * @Entity('users')
 * export class ExtendedUserEntity extends UserEntity {
 *   @Column({ name: 'custom_field' })
 *   customField: string;
 *
 *   @OneToMany(() => CustomEntity, (custom) => custom.user)
 *   customRelations: CustomEntity[];
 * }
 * ```
 *
 * Note: When extending this entity, ensure that:
 * - The table name remains 'users'
 * - All base fields and relations are preserved
 * - Custom migrations are created to add new columns/relations
 */
@Entity({ name: USERS })
@Unique('unique_email', ['email'])
@Unique('unique_username', ['username'])
export class UserEntity implements User {
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

  @OneToMany(() => CredentialEntity, (credential) => credential.user, {
    cascade: false,
  })
  credentials: CredentialEntity[];

  @OneToMany(() => ActionEntity, (token) => token.user, {
    cascade: false,
  })
  actions: ActionEntity[];

  @OneToMany(() => UserAccountEntity, (userAccount) => userAccount.user, {
    cascade: false,
  })
  accounts: UserAccountEntity[];
}
