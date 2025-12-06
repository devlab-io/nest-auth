import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MinLength } from 'class-validator';
import {
  CreateEstablishmentRequest,
  UpdateEstablishmentRequest,
  Establishment,
  Organisation,
  UserAccount,
} from '@devlab-io/nest-auth-types';

export class EstablishmentDto implements Establishment {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the establishment',
  })
  id: string;

  @ApiProperty({
    example: 'Restaurant Paris Centre',
    description: 'Name of the establishment',
  })
  name: string;

  @ApiProperty({
    description: 'Organisation that owns this establishment',
  })
  organisation: Organisation;

  @ApiProperty({
    description: 'User accounts associated with this establishment',
    type: 'array',
    items: { type: 'object' },
  })
  accounts: UserAccount[];

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the establishment was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the establishment was last updated',
  })
  updatedAt: Date;

  @ApiProperty({
    example: true,
    description: 'Indicates if the establishment is enabled',
  })
  enabled: boolean;
}

export class CreateEstablishmentRequestDto implements CreateEstablishmentRequest {
  @ApiProperty({
    example: 'Restaurant Paris Centre',
    description: 'Name of the establishment',
  })
  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name must not be empty' })
  name: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the organisation that owns this establishment',
  })
  @IsUUID(4, { message: 'organisationId must be a valid UUID' })
  organisationId: string;
}

export class UpdateEstablishmentRequestDto implements UpdateEstablishmentRequest {
  @ApiPropertyOptional({
    example: 'Restaurant Paris Centre',
    description: 'Name of the establishment',
  })
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name must not be empty' })
  name?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the organisation that owns this establishment',
  })
  @IsOptional()
  @IsUUID(4, { message: 'organisationId must be a valid UUID' })
  organisationId?: string;
}
