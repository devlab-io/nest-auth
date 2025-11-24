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
import { UserAccountService } from '../services';
import { UserAccountQueryParams } from '../types';
import {
  CreateUserAccountRequestDto,
  UpdateUserAccountRequestDto,
  UserAccountDto,
  UserAccountPageDto,
} from '../dtos';

/**
 * User account controller
 * Provides CRUD operations for user accounts
 */
@ApiTags('user-accounts')
@Controller('user-accounts')
export class UserAccountController {
  /**
   * Constructor
   *
   * @param userAccountService - The user account service
   */
  constructor(private readonly userAccountService: UserAccountService) {}

  /**
   * Create a new user account
   *
   * @param createUserAccountRequest - The create user account request
   * @returns The created user account
   */
  @Post()
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiResponse({
    status: 201,
    type: UserAccountDto,
    description: 'User account created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 404,
    description: 'User, organisation or establishment not found',
  })
  async create(
    @Body() createUserAccountRequest: CreateUserAccountRequestDto,
  ): Promise<UserAccountDto> {
    return await this.userAccountService.create(createUserAccountRequest);
  }

  /**
   * Search for user accounts with pagination and filters
   *
   * @param query - The query parameters
   * @param page - The page number
   * @param limit - The number of user accounts per page
   * @returns The user accounts page
   */
  @Get()
  @ApiOperation({
    summary: 'Search for user accounts with pagination and filters',
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
    description: 'Number of user accounts per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'User accounts page with pagination',
    type: UserAccountPageDto,
  })
  async search(
    @Query() query: UserAccountQueryParams,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<UserAccountPageDto> {
    return await this.userAccountService.search(query, page, limit);
  }

  /**
   * Find a user account by ID
   *
   * @param id The ID of the user account
   * @returns The user account
   */
  @Get('by-id')
  @ApiOperation({ summary: 'Find a user account by ID' })
  @ApiQuery({ name: 'id', type: String, description: 'User account ID' })
  @ApiResponse({ status: 200, type: UserAccountDto })
  async findById(@Query('id') id: string): Promise<UserAccountDto | null> {
    return await this.userAccountService.findById(id);
  }

  /**
   * Get a user account by ID
   *
   * @param id The ID of the user account
   * @returns The user account
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a user account by ID' })
  @ApiParam({ name: 'id', type: String, description: 'User account ID' })
  @ApiResponse({ status: 200, type: UserAccountDto })
  @ApiResponse({ status: 404, description: 'User account not found' })
  async getById(@Param('id') id: string): Promise<UserAccountDto> {
    return await this.userAccountService.getById(id);
  }

  /**
   * Check if a user account exists by ID
   *
   * @param id The ID of the user account
   * @returns True if the user account exists, false otherwise
   */
  @Get(':id/exists')
  @ApiOperation({ summary: 'Check if a user account exists by ID' })
  @ApiParam({ name: 'id', type: String, description: 'User account ID' })
  @ApiResponse({ status: 200, type: Boolean })
  async exists(@Param('id') id: string): Promise<boolean> {
    const userAccount = await this.userAccountService.findById(id);
    return userAccount !== null;
  }

  /**
   * Update a user account
   *
   * @param id The ID of the user account
   * @param updateUserAccountRequest The update user account request
   * @returns The updated user account
   */
  @Post(':id')
  @ApiOperation({ summary: 'Update a user account (full update)' })
  @ApiParam({ name: 'id', type: String, description: 'User account ID' })
  @ApiResponse({ status: 200, type: UserAccountDto })
  @ApiResponse({ status: 404, description: 'User account not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async update(
    @Param('id') id: string,
    @Body() updateUserAccountRequest: UpdateUserAccountRequestDto,
  ): Promise<UserAccountDto> {
    return await this.userAccountService.update(id, updateUserAccountRequest);
  }

  /**
   * Patch a user account
   *
   * @param id The ID of the user account
   * @param updateUserAccountRequest The patch user account request
   * @returns The patched user account
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a user account' })
  @ApiParam({ name: 'id', type: String, description: 'User account ID' })
  @ApiResponse({ status: 200, type: UserAccountDto })
  @ApiResponse({ status: 404, description: 'User account not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async patch(
    @Param('id') id: string,
    @Body() updateUserAccountRequest: UpdateUserAccountRequestDto,
  ): Promise<UserAccountDto> {
    return await this.userAccountService.update(id, updateUserAccountRequest);
  }

  /**
   * Enable a user account
   *
   * @param id The ID of the user account
   * @returns The enabled user account
   */
  @Patch(':id/enable')
  @ApiOperation({ summary: 'Enable a user account' })
  @ApiParam({ name: 'id', type: String, description: 'User account ID' })
  @ApiResponse({ status: 200, type: UserAccountDto })
  @ApiResponse({ status: 404, description: 'User account not found' })
  async enable(@Param('id') id: string): Promise<UserAccountDto> {
    return await this.userAccountService.enable(id);
  }

  /**
   * Disable a user account
   *
   * @param id The ID of the user account
   * @returns The disabled user account
   */
  @Patch(':id/disable')
  @ApiOperation({ summary: 'Disable a user account' })
  @ApiParam({ name: 'id', type: String, description: 'User account ID' })
  @ApiResponse({ status: 200, type: UserAccountDto })
  @ApiResponse({ status: 404, description: 'User account not found' })
  async disable(@Param('id') id: string): Promise<UserAccountDto> {
    return await this.userAccountService.disable(id);
  }

  /**
   * Delete a user account
   *
   * @param id The ID of the user account
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user account' })
  @ApiParam({ name: 'id', type: String, description: 'User account ID' })
  @ApiResponse({
    status: 200,
    description: 'User account deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'User account not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return await this.userAccountService.delete(id);
  }
}
