import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrganisationService, OrganisationServiceToken } from '../services';
import { OrganisationQueryParams } from '@devlab-io/nest-auth-types';
import {
  CreateOrganisationRequestDto,
  UpdateOrganisationRequestDto,
  OrganisationDto,
  PageDto,
} from '../dtos';
import { AuthGuard } from '../guards';
import { Claims } from '../decorators/claims';
import { ORGANISATIONS } from '@devlab-io/nest-auth-types/constants';
import {
  CREATE_ANY_ORGANISATIONS,
  DELETE_ANY_ORGANISATIONS,
  DELETE_OWN_ORGANISATIONS,
  DISABLE_ANY_ORGANISATIONS,
  DISABLE_OWN_ORGANISATIONS,
  ENABLE_ANY_ORGANISATIONS,
  ENABLE_OWN_ORGANISATIONS,
  READ_ANY_ORGANISATIONS,
  READ_OWN_ORGANISATIONS,
  UPDATE_ANY_ORGANISATIONS,
  UPDATE_OWN_ORGANISATIONS,
} from '@devlab-io/nest-auth-types/constants';

/**
 * Organisation controller
 * Provides CRUD operations for organisations
 */
@ApiTags(ORGANISATIONS)
@Controller(ORGANISATIONS)
export class OrganisationController {
  /**
   * Constructor
   *
   * @param organisationService - The organisation service
   */
  constructor(
    @Inject(OrganisationServiceToken)
    private readonly organisationService: OrganisationService,
  ) {}

  /**
   * Create a new organisation
   *
   * @param createOrganisationRequest - The create organisation request
   * @returns The created organisation
   */
  @Post()
  @UseGuards(AuthGuard)
  @Claims(CREATE_ANY_ORGANISATIONS)
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
   * @param page - The page number (default: 1)
   * @param size - The number of organisations per page (default: 10)
   * @returns A page of organisations
   */
  @Get()
  @UseGuards(AuthGuard)
  @Claims(READ_ANY_ORGANISATIONS, READ_OWN_ORGANISATIONS)
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
    name: 'size',
    required: false,
    type: Number,
    description: 'Number of organisations per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Organisations page with pagination',
    type: PageDto,
  })
  async search(
    @Query() query: OrganisationQueryParams,
    @Query('page') page: number = 1,
    @Query('size') size: number = 10,
  ): Promise<PageDto<OrganisationDto>> {
    return await this.organisationService.search(query, page, size);
  }

  /**
   * Find an organisation by ID
   *
   * @param id The ID of the organisation
   * @returns The organisation
   */
  @Get('by-id')
  @UseGuards(AuthGuard)
  @Claims(READ_ANY_ORGANISATIONS, READ_OWN_ORGANISATIONS)
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
  @UseGuards(AuthGuard)
  @Claims(READ_ANY_ORGANISATIONS, READ_OWN_ORGANISATIONS)
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
  @UseGuards(AuthGuard)
  @Claims(READ_ANY_ORGANISATIONS, READ_OWN_ORGANISATIONS)
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
  @UseGuards(AuthGuard)
  @Claims(READ_ANY_ORGANISATIONS, READ_OWN_ORGANISATIONS)
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
  @UseGuards(AuthGuard)
  @Claims(UPDATE_ANY_ORGANISATIONS, UPDATE_OWN_ORGANISATIONS)
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
   * Enable an organisation
   *
   * @param id The ID of the organisation
   * @returns The enabled organisation
   */
  @Patch(':id/enable')
  @UseGuards(AuthGuard)
  @Claims(ENABLE_ANY_ORGANISATIONS, ENABLE_OWN_ORGANISATIONS)
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
  @UseGuards(AuthGuard)
  @Claims(DISABLE_ANY_ORGANISATIONS, DISABLE_OWN_ORGANISATIONS)
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
  @UseGuards(AuthGuard)
  @Claims(DELETE_ANY_ORGANISATIONS, DELETE_OWN_ORGANISATIONS)
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
