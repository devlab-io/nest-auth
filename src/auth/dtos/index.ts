import { ApiProperty } from '@nestjs/swagger';
import { InviteRequest } from '../types';

export class InviteRequestDto implements InviteRequest {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
  })
  email: string;
  expiresIn?: number; // hours
  message?: string;
  roles?: string[];
}
