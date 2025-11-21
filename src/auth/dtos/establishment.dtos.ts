import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MinLength } from 'class-validator';
import {
  CreateEstablishmentRequest,
  UpdateEstablishmentRequest,
  Establishment,
  EstablishmentPage,
} from '../types';
import { OrganisationDto } from './organisation.dtos';

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
    type: OrganisationDto,
  })
  organisation: OrganisationDto;

  @ApiProperty({
    description: 'User accounts associated with this establishment',
    type: [Object],
  })
  userAccounts: any[];
}

export class CreateEstablishmentRequestDto
  implements CreateEstablishmentRequest
{
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

export class UpdateEstablishmentRequestDto
  implements UpdateEstablishmentRequest
{
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

export class EstablishmentPageDto implements EstablishmentPage {
  @ApiProperty({
    description: 'List of establishments',
    type: [EstablishmentDto],
  })
  data: EstablishmentDto[];

  @ApiProperty({
    example: 100,
    description: 'Total number of establishments',
  })
  total: number;

  @ApiProperty({
    example: 1,
    description: 'Current page number',
  })
  page: number;

  @ApiProperty({
    example: 10,
    description: 'Number of establishments per page',
  })
  limit: number;
}
