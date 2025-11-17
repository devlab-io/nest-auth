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
import { UserService, SessionService } from '../services';
import { UserQueryParams } from '../types';
import {
  CreateUserRequestDto,
  PatchUserRequestDto,
  UpdateUserRequestDto,
  UserDto,
  UserPageDto,
  SessionDto,
  DeleteSessionsResponseDto,
} from '../dtos';

/**
 * User controller
 * Mutable actions of this controller bypass authentication and required action token validations.
 * Use it with caution.
 */
@ApiTags('users')
@Controller('users')
export class UserController {
  /**
   * Constructor
   *
   * @param userService - The user service
   * @param sessionService - The session service
   */
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Create a new user
   *
   * @param createUserRequest - The create user request
   * @returns The created user
   */
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    type: UserDto,
    description: 'User created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Body() createUserRequest: CreateUserRequestDto,
  ): Promise<UserDto> {
    return await this.userService.create(createUserRequest);
  }

  /**
   * Search for users with pagination and filters
   *
   * @param query - The query parameters
   * @param page - The page number
   * @param limit - The number of users per page
   * @returns The users page
   */
  @Get()
  @ApiOperation({ summary: 'Search for users with pagination and filters' })
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
    description: 'Number of users per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Users page with pagination',
    type: UserPageDto,
  })
  async search(
    @Query() query: UserQueryParams,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<UserPageDto> {
    return await this.userService.search(query, page, limit);
  }

  /**
   * Find a user by ID
   *
   * @param id The ID of the user
   * @returns The user
   */
  @Get('by-id')
  @ApiOperation({ summary: 'Find a user by ID' })
  @ApiQuery({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, type: UserDto })
  async findById(@Query('id') id: string): Promise<UserDto | null> {
    return await this.userService.findById(id);
  }

  /**
   * Find a user by email
   *
   * @param email The email of the user
   * @returns The user
   */
  @Get('by-email')
  @ApiOperation({ summary: 'Find a user by email' })
  @ApiQuery({ name: 'email', type: String, description: 'User email' })
  @ApiResponse({ status: 200, type: UserDto })
  async findByEmail(@Query('email') email: string): Promise<UserDto | null> {
    return await this.userService.findByEmail(email);
  }

  /**
   * Get a user by ID
   *
   * @param id The ID of the user
   * @returns The user
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getById(@Param('id') id: string): Promise<UserDto> {
    return await this.userService.getById(id);
  }

  /**
   * Check if a user exists by ID
   *
   * @param id The ID of the user
   * @returns True if the user exists, false otherwise
   */
  @Get(':id/exists')
  @ApiOperation({ summary: 'Check if a user exists by ID' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, type: Boolean })
  async exists(@Param('id') id: string): Promise<boolean> {
    return await this.userService.exists(id);
  }

  /**
   * Patch a user
   *
   * @param id The ID of the user
   * @param patchUserRequest The patch user request
   * @returns The patched user
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a user' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async patch(
    @Param('id') id: string,
    @Body() patchUserRequest: PatchUserRequestDto,
  ): Promise<UserDto> {
    return await this.userService.patch(id, patchUserRequest);
  }

  /**
   * Update a user
   *
   * @param id The ID of the user
   * @param updateUserRequest The update user request
   * @returns The updated user
   */
  @Post(':id')
  @ApiOperation({ summary: 'Update a user (full update)' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserRequest: UpdateUserRequestDto,
  ): Promise<UserDto> {
    return await this.userService.update(id, updateUserRequest);
  }

  /**
   * Enable a user account
   *
   * @param id The ID of the user
   * @returns The enabled user
   */
  @Patch(':id/enable')
  @ApiOperation({ summary: 'Enable a user account' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async enable(@Param('id') id: string): Promise<UserDto> {
    return await this.userService.enable(id);
  }

  /**
   * Disable a user account
   *
   * @param id The ID of the user
   * @returns The disabled user
   */
  @Patch(':id/disable')
  @ApiOperation({ summary: 'Disable a user account' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async disable(@Param('id') id: string): Promise<UserDto> {
    return await this.userService.disable(id);
  }

  /**
   * Delete a user
   *
   * @param id The ID of the user
   * @returns The deleted user
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return await this.userService.delete(id);
  }

  /**
   * Get all sessions for a user
   *
   * @param id - The user ID
   * @returns Array of sessions
   */
  @Get(':id/sessions')
  @ApiOperation({ summary: 'Get all sessions for a user' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, type: [SessionDto] })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserSessions(@Param('id') id: string): Promise<SessionDto[]> {
    return await this.sessionService.findByUserId(id);
  }

  /**
   * Get all active sessions for a user (not expired)
   *
   * @param id - The user ID
   * @returns Array of active sessions
   */
  @Get(':id/sessions/active')
  @ApiOperation({ summary: 'Get all active sessions for a user' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, type: [SessionDto] })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserActiveSessions(@Param('id') id: string): Promise<SessionDto[]> {
    return await this.sessionService.findActiveByUserId(id);
  }

  /**
   * Delete all sessions for a user
   *
   * @param id - The user ID
   * @returns Number of deleted sessions
   */
  @Delete(':id/sessions')
  @ApiOperation({ summary: 'Delete all sessions for a user' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Number of deleted sessions',
    type: DeleteSessionsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUserSessions(
    @Param('id') id: string,
  ): Promise<DeleteSessionsResponseDto> {
    const count = await this.sessionService.deleteAllByUserId(id);
    return { count };
  }
}
