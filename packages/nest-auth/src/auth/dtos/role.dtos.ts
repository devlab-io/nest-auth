import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  MinLength,
  ValidateBy,
  ValidationOptions,
} from 'class-validator';
import {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  ClaimsUtils,
} from '@devlab-io/nest-auth-types';
import { ClaimDto } from './claim.dtos';

/**
 * Custom validator for ClaimLike (string or ClaimDto)
 */
function IsClaimLike(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isClaimLike',
      validator: {
        validate: (value: any): boolean => {
          // Accept strings
          if (typeof value === 'string') {
            try {
              // Validate that it's a valid claim string format
              ClaimsUtils.parse(value);
              return true;
            } catch {
              return false;
            }
          }
          // Accept objects that match ClaimDto structure
          if (typeof value === 'object' && value !== null) {
            return (
              typeof value.action === 'string' &&
              typeof value.scope === 'string' &&
              typeof value.resource === 'string'
            );
          }
          return false;
        },
        defaultMessage: () =>
          'Each claim must be either a string in format "action:scope:resource" or a Claim object',
      },
    },
    validationOptions,
  );
}

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
    description:
      'Claims assigned to this role (can be strings in format "action:scope:resource" or Claim objects)',
    oneOf: [
      { type: 'string' },
      { type: 'object', $ref: '#/components/schemas/ClaimDto' },
    ],
  })
  @IsArray({ message: 'claims must be an array' })
  @IsClaimLike({ each: true })
  claims: (string | ClaimDto)[];
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
    description:
      'Claims assigned to this role (can be strings in format "action:scope:resource" or Claim objects)',
    oneOf: [
      { type: 'string' },
      { type: 'object', $ref: '#/components/schemas/ClaimDto' },
    ],
  })
  @IsOptional()
  @IsArray({ message: 'claims must be an array' })
  @IsClaimLike({ each: true })
  claims?: (string | ClaimDto)[];
}
