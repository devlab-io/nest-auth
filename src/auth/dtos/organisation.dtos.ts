import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';
import {
  CreateOrganisationRequest,
  UpdateOrganisationRequest,
  Organisation,
  OrganisationPage,
} from '../types';
import { EstablishmentDto } from './establishment.dtos';

export class OrganisationDto implements Organisation {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the organisation',
  })
  id: string;

  @ApiProperty({
    example: 'Restaurant Chain Inc.',
    description: 'Name of the organisation',
  })
  name: string;

  @ApiProperty({
    description: 'Establishments belonging to this organisation',
    type: [EstablishmentDto],
  })
  establishments: EstablishmentDto[];

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the organisation was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the organisation was last updated',
  })
  updatedAt: Date;

  @ApiProperty({
    example: true,
    description: 'Indicates if the organisation is enabled',
  })
  enabled: boolean;
}

export class CreateOrganisationRequestDto implements CreateOrganisationRequest {
  @ApiProperty({
    example: 'Restaurant Chain Inc.',
    description: 'Name of the organisation',
  })
  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name must not be empty' })
  name: string;
}

export class UpdateOrganisationRequestDto implements UpdateOrganisationRequest {
  @ApiPropertyOptional({
    example: 'Restaurant Chain Inc.',
    description: 'Name of the organisation',
  })
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name must not be empty' })
  name?: string;
}

export class OrganisationPageDto implements OrganisationPage {
  @ApiProperty({
    description: 'List of organisations',
    type: [OrganisationDto],
  })
  data: OrganisationDto[];

  @ApiProperty({
    example: 100,
    description: 'Total number of organisations',
  })
  total: number;

  @ApiProperty({
    example: 1,
    description: 'Current page number',
  })
  page: number;

  @ApiProperty({
    example: 10,
    description: 'Number of organisations per page',
  })
  limit: number;
}
