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
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EstablishmentService, EstablishmentServiceToken } from '../services';
import { EstablishmentQueryParams } from '@devlab-io/nest-auth-types';
import {
  CreateEstablishmentRequestDto,
  UpdateEstablishmentRequestDto,
  EstablishmentDto,
  EstablishmentPageDto,
} from '../dtos';

/**
 * Establishment controller
 * Provides CRUD operations for establishments
 */
@ApiTags('establishments')
@Controller('establishments')
export class EstablishmentController {
  /**
   * Constructor
   *
   * @param establishmentService - The establishment service
   */
  constructor(
    @Inject(EstablishmentServiceToken)
    private readonly establishmentService: EstablishmentService,
  ) {}

  /**
   * Create a new establishment
   *
   * @param createEstablishmentRequest - The create establishment request
   * @returns The created establishment
   */
  @Post()
  @ApiOperation({ summary: 'Create a new establishment' })
  @ApiResponse({
    status: 201,
    type: EstablishmentDto,
    description: 'Establishment created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Organisation not found' })
  async create(
    @Body() createEstablishmentRequest: CreateEstablishmentRequestDto,
  ): Promise<EstablishmentDto> {
    return await this.establishmentService.create(createEstablishmentRequest);
  }

  /**
   * Search for establishments with pagination and filters
   *
   * @param query - The query parameters
   * @param page - The page number
   * @param limit - The number of establishments per page
   * @returns The establishments page
   */
  @Get()
  @ApiOperation({
    summary: 'Search for establishments with pagination and filters',
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
    description: 'Number of establishments per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Establishments page with pagination',
    type: EstablishmentPageDto,
  })
  async search(
    @Query() query: EstablishmentQueryParams,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<EstablishmentPageDto> {
    return await this.establishmentService.search(query, page, limit);
  }

  /**
   * Find an establishment by ID
   *
   * @param id The ID of the establishment
   * @returns The establishment
   */
  @Get('by-id')
  @ApiOperation({ summary: 'Find an establishment by ID' })
  @ApiQuery({ name: 'id', type: String, description: 'Establishment ID' })
  @ApiResponse({ status: 200, type: EstablishmentDto })
  async findById(@Query('id') id: string): Promise<EstablishmentDto | null> {
    return await this.establishmentService.findById(id);
  }

  /**
   * Find an establishment by name and organisation
   *
   * @param name The name of the establishment
   * @param organisationId The ID of the organisation
   * @returns The establishment
   */
  @Get('by-name')
  @ApiOperation({
    summary: 'Find an establishment by name and organisation',
  })
  @ApiQuery({
    name: 'name',
    type: String,
    description: 'Establishment name',
  })
  @ApiQuery({
    name: 'organisationId',
    type: String,
    description: 'Organisation ID',
  })
  @ApiResponse({ status: 200, type: EstablishmentDto })
  async findByNameAndOrganisation(
    @Query('name') name: string,
    @Query('organisationId') organisationId: string,
  ): Promise<EstablishmentDto | null> {
    return await this.establishmentService.findByNameAndOrganisation(
      name,
      organisationId,
    );
  }

  /**
   * Get an establishment by ID
   *
   * @param id The ID of the establishment
   * @returns The establishment
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get an establishment by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Establishment ID' })
  @ApiResponse({ status: 200, type: EstablishmentDto })
  @ApiResponse({ status: 404, description: 'Establishment not found' })
  async getById(@Param('id') id: string): Promise<EstablishmentDto> {
    return await this.establishmentService.getById(id);
  }

  /**
   * Check if an establishment exists by ID
   *
   * @param id The ID of the establishment
   * @returns True if the establishment exists, false otherwise
   */
  @Get(':id/exists')
  @ApiOperation({ summary: 'Check if an establishment exists by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Establishment ID' })
  @ApiResponse({ status: 200, type: Boolean })
  async exists(@Param('id') id: string): Promise<boolean> {
    return await this.establishmentService.exists(id);
  }

  /**
   * Update an establishment
   *
   * @param id The ID of the establishment
   * @param updateEstablishmentRequest The update establishment request
   * @returns The updated establishment
   */
  @Post(':id')
  @ApiOperation({ summary: 'Update an establishment (full update)' })
  @ApiParam({ name: 'id', type: String, description: 'Establishment ID' })
  @ApiResponse({ status: 200, type: EstablishmentDto })
  @ApiResponse({ status: 404, description: 'Establishment not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async update(
    @Param('id') id: string,
    @Body() updateEstablishmentRequest: UpdateEstablishmentRequestDto,
  ): Promise<EstablishmentDto> {
    return await this.establishmentService.update(
      id,
      updateEstablishmentRequest,
    );
  }

  /**
   * Patch an establishment
   *
   * @param id The ID of the establishment
   * @param updateEstablishmentRequest The patch establishment request
   * @returns The patched establishment
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update an establishment' })
  @ApiParam({ name: 'id', type: String, description: 'Establishment ID' })
  @ApiResponse({ status: 200, type: EstablishmentDto })
  @ApiResponse({ status: 404, description: 'Establishment not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async patch(
    @Param('id') id: string,
    @Body() updateEstablishmentRequest: UpdateEstablishmentRequestDto,
  ): Promise<EstablishmentDto> {
    return await this.establishmentService.update(
      id,
      updateEstablishmentRequest,
    );
  }

  /**
   * Enable an establishment
   *
   * @param id The ID of the establishment
   * @returns The enabled establishment
   */
  @Patch(':id/enable')
  @ApiOperation({ summary: 'Enable an establishment' })
  @ApiParam({ name: 'id', type: String, description: 'Establishment ID' })
  @ApiResponse({ status: 200, type: EstablishmentDto })
  @ApiResponse({ status: 404, description: 'Establishment not found' })
  async enable(@Param('id') id: string): Promise<EstablishmentDto> {
    return await this.establishmentService.enable(id);
  }

  /**
   * Disable an establishment
   *
   * @param id The ID of the establishment
   * @returns The disabled establishment
   */
  @Patch(':id/disable')
  @ApiOperation({ summary: 'Disable an establishment' })
  @ApiParam({ name: 'id', type: String, description: 'Establishment ID' })
  @ApiResponse({ status: 200, type: EstablishmentDto })
  @ApiResponse({ status: 404, description: 'Establishment not found' })
  async disable(@Param('id') id: string): Promise<EstablishmentDto> {
    return await this.establishmentService.disable(id);
  }

  /**
   * Delete an establishment
   *
   * @param id The ID of the establishment
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an establishment' })
  @ApiParam({ name: 'id', type: String, description: 'Establishment ID' })
  @ApiResponse({
    status: 200,
    description: 'Establishment deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Establishment not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return await this.establishmentService.delete(id);
  }
}
