import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
} from '@devlab-io/nest-auth-types';
import { ClaimDto } from './claim.dtos';

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

  @ApiProperty({
    description: 'Claims assigned to this role',
    type: [ClaimDto],
  })
  claims: ClaimDto[];
}

export class CreateRoleRequestDto implements CreateRoleRequest {
  @ApiProperty({
    example: 'admin',
    description: 'Name of the role',
  })
  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name must not be empty' })
  name: string;

  @ApiPropertyOptional({
    example: "Donne accès à toute l'application",
    description: 'Description of the role',
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @ApiProperty({
    description: 'Claims assigned to this role',
    type: [ClaimDto],
  })
  @IsArray({ message: 'claims must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ClaimDto)
  claims: ClaimDto[];
}

export class UpdateRoleRequestDto implements UpdateRoleRequest {
  @ApiPropertyOptional({
    example: 'admin',
    description: 'Name of the role',
  })
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name must not be empty' })
  name?: string;

  @ApiPropertyOptional({
    example: "Donne accès à toute l'application",
    description: 'Description of the role',
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Claims assigned to this role',
    type: [ClaimDto],
  })
  @IsOptional()
  @IsArray({ message: 'claims must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ClaimDto)
  claims?: ClaimDto[];
}
