import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../types';

export class RoleDto implements Role {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier of the role',
  })
  id: number;

  @ApiProperty({
    example: 'admin',
    description: 'Name of the role',
  })
  name: string;

  @ApiPropertyOptional({
    example: "Donne accès à toute l'application",
    description: 'Description of the role',
  })
  description?: string;
}
