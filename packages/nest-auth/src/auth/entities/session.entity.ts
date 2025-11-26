import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Session } from '@devlab-io/nest-auth-types';
import { UserAccountEntity } from './user-account.entity';

@Entity({ name: 'sessions' })
export class SessionEntity implements Session {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT token string',
  })
  @PrimaryColumn({ name: 'token', type: 'text' })
  token: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the user account that owns this session',
  })
  @Column({ name: 'user_account_id', type: 'uuid' })
  userAccountId: string;

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the user logged in',
  })
  @CreateDateColumn({ name: 'login_date' })
  loginDate: Date;

  @ApiProperty({
    example: '2024-02-20T11:00:00.000Z',
    description: 'Date when the session expires',
  })
  @Column({ type: 'timestamp', name: 'expiration_date' })
  expirationDate: Date;

  @ApiProperty({
    description: 'User account associated with this session',
    type: () => UserAccountEntity,
  })
  @ManyToOne(() => UserAccountEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_account_id' })
  userAccount: UserAccountEntity;
}
