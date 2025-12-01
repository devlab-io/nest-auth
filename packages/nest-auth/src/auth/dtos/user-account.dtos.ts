import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator';
import {
  UserAccount,
  CreateUserAccountRequest,
  UpdateUserAccountRequest,
  UserAccountPage,
} from '@devlab-io/nest-auth-types';
import { OrganisationDto } from './organisation.dtos';
import { EstablishmentDto } from './establishment.dtos';
import { UserDto } from './user.dtos';
import { RoleDto } from './role.dtos';

export class UserAccountDto implements UserAccount {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the user account',
  })
  id: string;

  @ApiPropertyOptional({
    type: OrganisationDto,
    description: 'Organisation this user account belongs to',
  })
  organisation?: OrganisationDto;

  @ApiPropertyOptional({
    type: EstablishmentDto,
    description: 'Establishment this user account belongs to',
  })
  establishment?: EstablishmentDto;

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

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the user account was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the user account was last updated',
  })
  updatedAt: Date;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user account is enabled',
  })
  enabled: boolean;
}

export class CreateUserAccountRequestDto implements CreateUserAccountRequest {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the user',
  })
  @IsUUID(4, { message: 'userId must be a valid UUID' })
  userId: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the organisation',
  })
  @IsOptional()
  @IsUUID(4, { message: 'organisationId must be a valid UUID' })
  organisationId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the establishment',
  })
  @IsOptional()
  @IsUUID(4, { message: 'establishmentId must be a valid UUID' })
  establishmentId?: string;

  @ApiPropertyOptional({
    description: 'Array of role names to assign to the user account',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}

export class UpdateUserAccountRequestDto implements UpdateUserAccountRequest {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the organisation',
  })
  @IsOptional()
  @IsUUID(4, { message: 'organisationId must be a valid UUID' })
  organisationId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the establishment',
  })
  @IsOptional()
  @IsUUID(4, { message: 'establishmentId must be a valid UUID' })
  establishmentId?: string;

  @ApiPropertyOptional({
    description: 'Array of role names to assign to the user account',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}

export class UserAccountPageDto implements UserAccountPage {
  @ApiProperty({
    description: 'List of user accounts',
    type: [UserAccountDto],
  })
  data: UserAccountDto[];

  @ApiProperty({
    example: 100,
    description: 'Total number of user accounts',
  })
  total: number;

  @ApiProperty({
    example: 1,
    description: 'Current page number',
  })
  page: number;

  @ApiProperty({
    example: 10,
    description: 'Number of user accounts per page',
  })
  limit: number;
}
