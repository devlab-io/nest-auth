import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the user',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'johndoe',
    description: 'Username of the user',
  })
  @Column({ name: 'username' })
  username: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
  })
  @Column({ name: 'email' })
  email: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user email is validated',
  })
  @Column({ name: 'email_validated', default: false })
  emailValidated: boolean;

  @ApiProperty({
    example: 'John',
    description: 'First name of the user',
    nullable: true,
  })
  @Column({ name: 'first_name', nullable: true })
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the user',
    nullable: true,
  })
  @Column({ name: 'last_name', nullable: true })
  lastName?: string;

  @ApiProperty({
    example: '+689123456789',
    description: 'Phone number of the user',
    nullable: true,
  })
  @Column({ name: 'phone', nullable: true })
  phone?: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user account is enabled',
  })
  @Column({ name: 'enabled', default: true })
  enabled: boolean;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: "URL of the user's profile picture",
    nullable: true,
  })
  @Column({ name: 'profile_picture', nullable: true })
  profilePicture?: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user accepted the terms of service',
  })
  @Column({ name: 'accepted_terms', default: false })
  acceptedTerms: boolean;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user accepted the privacy policy',
  })
  @Column({ name: 'accepted_privacy_policy', default: false })
  acceptedPrivacyPolicy: boolean;

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the user account was created',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the user account was last updated',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Credentials for authentication (password, google, etc.)',
    type: () => [CredentialEntity],
  })
  @OneToMany(() => CredentialEntity, (credential) => credential.user, {
    cascade: false,
  })
  credentials: CredentialEntity[];

  @ApiProperty({
    description: 'Action tokens associated with this user',
    type: () => [ActionEntity],
  })
  @OneToMany(() => ActionEntity, (token) => token.user, {
    cascade: false,
  })
  actions: ActionEntity[];

  @ApiProperty({
    description: 'User accounts associated with this user',
    type: () => [UserAccountEntity],
  })
  @OneToMany(() => UserAccountEntity, (userAccount) => userAccount.user, {
    cascade: false,
  })
  accounts: UserAccountEntity[];
}
