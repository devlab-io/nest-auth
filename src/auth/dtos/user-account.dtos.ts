import { ApiProperty } from '@nestjs/swagger';
import { UserAccount } from '../types';
import { OrganisationDto } from './organisation.dtos';
import { EstablishmentDto } from './establishment.dtos';
import { UserDto } from './user.dtos';
import { RoleDto } from './user.dtos';

export class UserAccountDto implements UserAccount {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the user account',
  })
  id: string;

  @ApiProperty({
    type: OrganisationDto,
    description: 'Organisation this user account belongs to',
  })
  organisation: OrganisationDto;

  @ApiProperty({
    type: EstablishmentDto,
    description: 'Establishment this user account belongs to',
  })
  establishment: EstablishmentDto;

  @ApiProperty({
    type: UserDto,
    description: 'User associated with this account',
  })
  user: UserDto;

  @ApiProperty({
    description: 'Roles assigned to this user account',
    type: [RoleDto],
  })
  roles: RoleDto[];
}
