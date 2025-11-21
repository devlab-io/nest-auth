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
import { User } from '../types';
import { ActionEntity } from './action-token.entity';
import { CredentialEntity } from './credential.entity';
import { UserAccountEntity } from './user-account.entity';

@Entity('users')
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
  @Column()
  username: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
  })
  @Column()
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
  @Column({ nullable: true })
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
  @Column({ nullable: true })
  profilePicture?: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user accepted the terms of service',
  })
  @Column({ default: false })
  acceptedTerms: boolean;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user accepted the privacy policy',
  })
  @Column({ default: false })
  acceptedPrivacyPolicy: boolean;

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the user account was created',
  })
  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the user account was last updated',
  })
  @UpdateDateColumn({ name: 'updatedAt' })
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
