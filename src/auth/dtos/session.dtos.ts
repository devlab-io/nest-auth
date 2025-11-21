import { ApiProperty } from '@nestjs/swagger';
import { Session } from '../types';
import { UserAccountDto } from './user-account.dtos';

// Forward declaration to avoid circular dependency
export type UserAccountDtoType = UserAccountDto;

export class SessionDto implements Session {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT token string',
  })
  token: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the user account who owns this session',
  })
  userAccountId: string;

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the user logged in',
  })
  loginDate: Date;

  @ApiProperty({
    example: '2024-02-20T11:00:00.000Z',
    description: 'Date when the session expires',
  })
  expirationDate: Date;

  @ApiProperty({
    description: 'User account information associated with this session',
    type: Object,
  })
  userAccount: any;
}

export class DeleteSessionsResponseDto {
  @ApiProperty({
    example: 5,
    description: 'Number of deleted sessions',
  })
  count: number;
}
