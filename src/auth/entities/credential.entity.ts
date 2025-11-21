import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Credential } from '../types';
import { UserEntity } from './user.entity';

@Entity({ name: 'credentials' })
export class CredentialEntity implements Credential {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the credential',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'password',
    description: 'Type of credential (password or google)',
    enum: ['password', 'google'],
  })
  @Column({ type: 'varchar' })
  type: 'password' | 'google';

  @ApiProperty({
    example: 'hashedPassword123',
    description: 'Hashed password (only for type=password)',
    nullable: true,
  })
  @Column({ nullable: true })
  password?: string;

  @ApiProperty({
    example: '123456789',
    description: 'Google OAuth ID (only for type=google)',
    nullable: true,
  })
  @Column({ nullable: true })
  googleId?: string;

  @ApiProperty({
    description: 'User that owns this credential',
    type: () => UserEntity,
  })
  @ManyToOne(() => UserEntity, (user) => user.credentials, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
