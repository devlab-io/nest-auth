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
import {
  UserQueryParams,
  USERS,
  CREATE_ANY_USERS,
  READ_OWN_USERS,
  READ_EST_USERS,
  READ_ORG_USERS,
  READ_ANY_USERS,
  UPDATE_OWN_USERS,
  DELETE_OWN_USERS,
  UPDATE_ANY_USERS,
  UPDATE_ORG_USERS,
  UPDATE_EST_USERS,
  ENABLE_OWN_USERS,
  ENABLE_EST_USERS,
  ENABLE_ORG_USERS,
  ENABLE_ANY_USERS,
  DISABLE_OWN_USERS,
  DISABLE_EST_USERS,
  DISABLE_ORG_USERS,
  DISABLE_ANY_USERS,
  DELETE_EST_USERS,
  DELETE_ORG_USERS,
  DELETE_ANY_USERS,
  READ_OWN_SESSIONS,
  READ_EST_SESSIONS,
  READ_ORG_SESSIONS,
  READ_ANY_SESSIONS,
  DELETE_OWN_SESSIONS,
  DELETE_EST_SESSIONS,
  DELETE_ORG_SESSIONS,
  DELETE_ANY_SESSIONS,
} from '@devlab-io/nest-auth-types';
import { Claims, CurrentUser } from '../decorators';
import {
  CreateUserRequestDto,
  PatchUserRequestDto,
  UpdateUserRequestDto,
  UserDto,
  PageDto,
  SessionDto,
  DeleteSessionsResponseDto,
} from '../dtos';
import { UserEntity } from '../entities';
import { AuthGuard } from '../guards';
import { UserService, SessionService, UserServiceToken } from '../services';

/**
 * User controller
 * Mutable actions of this controller bypass authentication and required action token validations.
 * Use it with caution.
 */
@ApiTags(USERS)
@Controller(USERS)
export class UserController {
  /**
   * Constructor
   *
   * @param userService - The user service
   * @param sessionService - The session service
   */
  constructor(
    @Inject(UserServiceToken)
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
  @UseGuards(AuthGuard)
  @Claims(CREATE_ANY_USERS)
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
   * @param page - The page number (default: 1)
   * @param size - The number of users per page (default: 10)
   * @returns A page of users
   */
  @Get()
  @UseGuards(AuthGuard)
  @Claims(READ_ANY_USERS, READ_ORG_USERS, READ_EST_USERS, READ_OWN_USERS)
  @ApiOperation({ summary: 'Search for users with pagination and filters' })
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
    description: 'Number of users per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Users page with pagination',
    type: PageDto,
  })
  async search(
    @Query() query: UserQueryParams,
    @Query('page') page: number = 1,
    @Query('size') size: number = 10,
  ): Promise<PageDto<UserDto>> {
    return await this.userService.search(query, page, size);
  }

  /**
   * Find a user by ID
   *
   * @param id The ID of the user
   * @returns The user
   */
  @Get('by-id')
  @UseGuards(AuthGuard)
  @Claims(READ_ANY_USERS, READ_ORG_USERS, READ_EST_USERS, READ_OWN_USERS)
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
  @UseGuards(AuthGuard)
  @Claims(READ_ANY_USERS, READ_ORG_USERS, READ_EST_USERS, READ_OWN_USERS)
  @ApiOperation({ summary: 'Find a user by email' })
  @ApiQuery({ name: 'email', type: String, description: 'User email' })
  @ApiResponse({ status: 200, type: UserDto })
  async findByEmail(@Query('email') email: string): Promise<UserDto | null> {
    return await this.userService.findByEmail(email);
  }

  /**
   * Get the current authenticated user's profile
   *
   * @param user - The current authenticated user
   * @returns The user profile
   */
  @Get('me')
  @UseGuards(AuthGuard)
  @Claims(READ_OWN_USERS)
  @ApiOperation({ summary: 'Get the current authenticated user profile' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: UserEntity): Promise<UserDto> {
    return user;
  }

  /**
   * Update the current authenticated user's profile
   *
   * @param user - The current authenticated user
   * @param updateUserRequest - The update user request
   * @returns The updated user
   */
  @Post('me')
  @UseGuards(AuthGuard)
  @Claims(UPDATE_OWN_USERS)
  @ApiOperation({ summary: 'Update the current authenticated user profile' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMe(
    @CurrentUser() user: UserEntity,
    @Body() updateUserRequest: UpdateUserRequestDto,
  ): Promise<UserDto> {
    return await this.userService.update(user.id, updateUserRequest);
  }

  /**
   * Delete the current authenticated user's account
   *
   * @param user - The current authenticated user
   */
  @Delete('me')
  @UseGuards(AuthGuard)
  @Claims(DELETE_OWN_USERS)
  @ApiOperation({ summary: 'Delete the current authenticated user account' })
  @ApiResponse({
    status: 200,
    description: 'User account deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteMe(@CurrentUser() user: UserEntity): Promise<void> {
    return await this.userService.delete(user.id);
  }

  /**
   * Get a user by ID
   *
   * @param id The ID of the user
   * @returns The user
   */
  @Get(':id')
  @UseGuards(AuthGuard)
  @Claims(READ_ANY_USERS, READ_ORG_USERS, READ_EST_USERS, READ_OWN_USERS)
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
  @UseGuards(AuthGuard)
  @Claims(READ_ANY_USERS, READ_ORG_USERS, READ_EST_USERS, READ_OWN_USERS)
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
  @UseGuards(AuthGuard)
  @Claims(
    UPDATE_ANY_USERS,
    UPDATE_ORG_USERS,
    UPDATE_EST_USERS,
    UPDATE_OWN_USERS,
  )
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
  @UseGuards(AuthGuard)
  @Claims(
    UPDATE_ANY_USERS,
    UPDATE_ORG_USERS,
    UPDATE_EST_USERS,
    UPDATE_OWN_USERS,
  )
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
  @UseGuards(AuthGuard)
  @Claims(
    ENABLE_ANY_USERS,
    ENABLE_ORG_USERS,
    ENABLE_EST_USERS,
    ENABLE_OWN_USERS,
  )
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
  @UseGuards(AuthGuard)
  @Claims(
    DISABLE_ANY_USERS,
    DISABLE_ORG_USERS,
    DISABLE_EST_USERS,
    DISABLE_OWN_USERS,
  )
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
  @UseGuards(AuthGuard)
  @Claims(
    DELETE_ANY_USERS,
    DELETE_ORG_USERS,
    DELETE_EST_USERS,
    DELETE_OWN_USERS,
  )
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
  @UseGuards(AuthGuard)
  @Claims(
    READ_ANY_SESSIONS,
    READ_ORG_SESSIONS,
    READ_EST_SESSIONS,
    READ_OWN_SESSIONS,
  )
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
  @UseGuards(AuthGuard)
  @Claims(
    READ_ANY_SESSIONS,
    READ_ORG_SESSIONS,
    READ_EST_SESSIONS,
    READ_OWN_SESSIONS,
  )
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
  @UseGuards(AuthGuard)
  @Claims(
    DELETE_ANY_SESSIONS,
    DELETE_ORG_SESSIONS,
    DELETE_EST_SESSIONS,
    DELETE_OWN_SESSIONS,
  )
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
