import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Session } from '../types';
import { UserDto } from './user.dtos';

export class SessionDto implements Session {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT token string',
  })
  token: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the user who owns this session',
  })
  userId: string;

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

  @ApiPropertyOptional({
    type: UserDto,
    description: 'User information associated with this session',
  })
  user?: UserDto;
}

export class DeleteSessionsResponseDto {
  @ApiProperty({
    example: 5,
    description: 'Number of deleted sessions',
  })
  count: number;
}
