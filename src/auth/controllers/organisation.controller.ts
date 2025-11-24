import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrganisationService } from '../services';
import { OrganisationQueryParams } from '../types';
import {
  CreateOrganisationRequestDto,
  UpdateOrganisationRequestDto,
  OrganisationDto,
  OrganisationPageDto,
} from '../dtos';

/**
 * Organisation controller
 * Provides CRUD operations for organisations
 */
@ApiTags('organisations')
@Controller('organisations')
export class OrganisationController {
  /**
   * Constructor
   *
   * @param organisationService - The organisation service
   */
  constructor(private readonly organisationService: OrganisationService) {}

  /**
   * Create a new organisation
   *
   * @param createOrganisationRequest - The create organisation request
   * @returns The created organisation
   */
  @Post()
  @ApiOperation({ summary: 'Create a new organisation' })
  @ApiResponse({
    status: 201,
    type: OrganisationDto,
    description: 'Organisation created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Body() createOrganisationRequest: CreateOrganisationRequestDto,
  ): Promise<OrganisationDto> {
    return await this.organisationService.create(createOrganisationRequest);
  }

  /**
   * Search for organisations with pagination and filters
   *
   * @param query - The query parameters
   * @param page - The page number
   * @param limit - The number of organisations per page
   * @returns The organisations page
   */
  @Get()
  @ApiOperation({
    summary: 'Search for organisations with pagination and filters',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of organisations per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Organisations page with pagination',
    type: OrganisationPageDto,
  })
  async search(
    @Query() query: OrganisationQueryParams,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<OrganisationPageDto> {
    return await this.organisationService.search(query, page, limit);
  }

  /**
   * Find an organisation by ID
   *
   * @param id The ID of the organisation
   * @returns The organisation
   */
  @Get('by-id')
  @ApiOperation({ summary: 'Find an organisation by ID' })
  @ApiQuery({ name: 'id', type: String, description: 'Organisation ID' })
  @ApiResponse({ status: 200, type: OrganisationDto })
  async findById(@Query('id') id: string): Promise<OrganisationDto | null> {
    return await this.organisationService.findById(id);
  }

  /**
   * Find an organisation by name
   *
   * @param name The name of the organisation
   * @returns The organisation
   */
  @Get('by-name')
  @ApiOperation({ summary: 'Find an organisation by name' })
  @ApiQuery({ name: 'name', type: String, description: 'Organisation name' })
  @ApiResponse({ status: 200, type: OrganisationDto })
  async findByName(
    @Query('name') name: string,
  ): Promise<OrganisationDto | null> {
    return await this.organisationService.findByName(name);
  }

  /**
   * Get an organisation by ID
   *
   * @param id The ID of the organisation
   * @returns The organisation
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get an organisation by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Organisation ID' })
  @ApiResponse({ status: 200, type: OrganisationDto })
  @ApiResponse({ status: 404, description: 'Organisation not found' })
  async getById(@Param('id') id: string): Promise<OrganisationDto> {
    return await this.organisationService.getById(id);
  }

  /**
   * Check if an organisation exists by ID
   *
   * @param id The ID of the organisation
   * @returns True if the organisation exists, false otherwise
   */
  @Get(':id/exists')
  @ApiOperation({ summary: 'Check if an organisation exists by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Organisation ID' })
  @ApiResponse({ status: 200, type: Boolean })
  async exists(@Param('id') id: string): Promise<boolean> {
    return await this.organisationService.exists(id);
  }

  /**
   * Update an organisation
   *
   * @param id The ID of the organisation
   * @param updateOrganisationRequest The update organisation request
   * @returns The updated organisation
   */
  @Post(':id')
  @ApiOperation({ summary: 'Update an organisation (full update)' })
  @ApiParam({ name: 'id', type: String, description: 'Organisation ID' })
  @ApiResponse({ status: 200, type: OrganisationDto })
  @ApiResponse({ status: 404, description: 'Organisation not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async update(
    @Param('id') id: string,
    @Body() updateOrganisationRequest: UpdateOrganisationRequestDto,
  ): Promise<OrganisationDto> {
    return await this.organisationService.update(id, updateOrganisationRequest);
  }

  /**
   * Patch an organisation
   *
   * @param id The ID of the organisation
   * @param updateOrganisationRequest The patch organisation request
   * @returns The patched organisation
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update an organisation' })
  @ApiParam({ name: 'id', type: String, description: 'Organisation ID' })
  @ApiResponse({ status: 200, type: OrganisationDto })
  @ApiResponse({ status: 404, description: 'Organisation not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async patch(
    @Param('id') id: string,
    @Body() updateOrganisationRequest: UpdateOrganisationRequestDto,
  ): Promise<OrganisationDto> {
    return await this.organisationService.update(id, updateOrganisationRequest);
  }

  /**
   * Enable an organisation
   *
   * @param id The ID of the organisation
   * @returns The enabled organisation
   */
  @Patch(':id/enable')
  @ApiOperation({ summary: 'Enable an organisation' })
  @ApiParam({ name: 'id', type: String, description: 'Organisation ID' })
  @ApiResponse({ status: 200, type: OrganisationDto })
  @ApiResponse({ status: 404, description: 'Organisation not found' })
  async enable(@Param('id') id: string): Promise<OrganisationDto> {
    return await this.organisationService.enable(id);
  }

  /**
   * Disable an organisation
   *
   * @param id The ID of the organisation
   * @returns The disabled organisation
   */
  @Patch(':id/disable')
  @ApiOperation({ summary: 'Disable an organisation' })
  @ApiParam({ name: 'id', type: String, description: 'Organisation ID' })
  @ApiResponse({ status: 200, type: OrganisationDto })
  @ApiResponse({ status: 404, description: 'Organisation not found' })
  async disable(@Param('id') id: string): Promise<OrganisationDto> {
    return await this.organisationService.disable(id);
  }

  /**
   * Delete an organisation
   *
   * @param id The ID of the organisation
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an organisation' })
  @ApiParam({ name: 'id', type: String, description: 'Organisation ID' })
  @ApiResponse({
    status: 200,
    description: 'Organisation deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Organisation not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return await this.organisationService.delete(id);
  }
}
