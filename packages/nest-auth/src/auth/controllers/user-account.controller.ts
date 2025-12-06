import {
  Body,
  Controller,
  Delete,
  Get,
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
  UserAccountQueryParams,
  USER_ACCOUNTS,
  CREATE_ANY_USER_ACCOUNTS,
  CREATE_EST_USER_ACCOUNTS,
  CREATE_ORG_USER_ACCOUNTS,
  READ_ANY_USER_ACCOUNTS,
  READ_EST_USER_ACCOUNTS,
  READ_ORG_USER_ACCOUNTS,
  READ_OWN_USER_ACCOUNTS,
  UPDATE_ANY_USER_ACCOUNTS,
  UPDATE_EST_USER_ACCOUNTS,
  UPDATE_ORG_USER_ACCOUNTS,
  UPDATE_OWN_USER_ACCOUNTS,
  ENABLE_ANY_USER_ACCOUNTS,
  ENABLE_ORG_USER_ACCOUNTS,
  ENABLE_EST_USER_ACCOUNTS,
  ENABLE_OWN_USER_ACCOUNTS,
  DISABLE_ANY_USER_ACCOUNTS,
  DISABLE_ORG_USER_ACCOUNTS,
  DISABLE_EST_USER_ACCOUNTS,
  DISABLE_OWN_USER_ACCOUNTS,
  DELETE_ANY_USER_ACCOUNTS,
  DELETE_ORG_USER_ACCOUNTS,
  DELETE_EST_USER_ACCOUNTS,
  DELETE_OWN_USER_ACCOUNTS,
} from '@devlab-io/nest-auth-types';
import { Claims } from '../decorators';
import {
  CreateUserAccountRequestDto,
  UpdateUserAccountRequestDto,
  UserAccountDto,
  PageDto,
} from '../dtos';
import { AuthGuard } from '../guards';
import { UserAccountService } from '../services';

/**
 * User account controller
 * Provides CRUD operations for user accounts
 */
@ApiTags(USER_ACCOUNTS)
@Controller(USER_ACCOUNTS)
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
  @UseGuards(AuthGuard)
  @Claims(
    CREATE_ANY_USER_ACCOUNTS,
    CREATE_ORG_USER_ACCOUNTS,
    CREATE_EST_USER_ACCOUNTS,
  )
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiResponse({ status: 201, type: UserAccountDto })
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
   * @param page - The page number (default: 1)
   * @param size - The number of user accounts per page (default: 10)
   * @returns A page of user accounts
   */
  @Get()
  @UseGuards(AuthGuard)
  @Claims(
    READ_ANY_USER_ACCOUNTS,
    READ_ORG_USER_ACCOUNTS,
    READ_EST_USER_ACCOUNTS,
    READ_OWN_USER_ACCOUNTS,
  )
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
    name: 'size',
    required: false,
    type: Number,
    description: 'Number of user accounts per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'User accounts page with pagination',
    type: PageDto,
  })
  async search(
    @Query() query: UserAccountQueryParams,
    @Query('page') page: number = 1,
    @Query('size') size: number = 10,
  ): Promise<PageDto<UserAccountDto>> {
    return await this.userAccountService.search(query, page, size);
  }

  /**
   * Find a user account by ID
   *
   * @param id The ID of the user account
   * @returns The user account
   */
  @Get('by-id')
  @UseGuards(AuthGuard)
  @Claims(
    READ_ANY_USER_ACCOUNTS,
    READ_ORG_USER_ACCOUNTS,
    READ_EST_USER_ACCOUNTS,
    READ_OWN_USER_ACCOUNTS,
  )
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
  @UseGuards(AuthGuard)
  @Claims(
    READ_ANY_USER_ACCOUNTS,
    READ_ORG_USER_ACCOUNTS,
    READ_EST_USER_ACCOUNTS,
    READ_OWN_USER_ACCOUNTS,
  )
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
  @UseGuards(AuthGuard)
  @Claims(
    READ_ANY_USER_ACCOUNTS,
    READ_ORG_USER_ACCOUNTS,
    READ_EST_USER_ACCOUNTS,
    READ_OWN_USER_ACCOUNTS,
  )
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
  @UseGuards(AuthGuard)
  @Claims(
    UPDATE_ANY_USER_ACCOUNTS,
    UPDATE_ORG_USER_ACCOUNTS,
    UPDATE_EST_USER_ACCOUNTS,
    UPDATE_OWN_USER_ACCOUNTS,
  )
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
  @UseGuards(AuthGuard)
  @Claims(
    UPDATE_ANY_USER_ACCOUNTS,
    UPDATE_ORG_USER_ACCOUNTS,
    UPDATE_EST_USER_ACCOUNTS,
    UPDATE_OWN_USER_ACCOUNTS,
  )
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
  @UseGuards(AuthGuard)
  @Claims(
    ENABLE_ANY_USER_ACCOUNTS,
    ENABLE_ORG_USER_ACCOUNTS,
    ENABLE_EST_USER_ACCOUNTS,
    ENABLE_OWN_USER_ACCOUNTS,
  )
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
  @UseGuards(AuthGuard)
  @Claims(
    DISABLE_ANY_USER_ACCOUNTS,
    DISABLE_ORG_USER_ACCOUNTS,
    DISABLE_EST_USER_ACCOUNTS,
    DISABLE_OWN_USER_ACCOUNTS,
  )
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
  @UseGuards(AuthGuard)
  @Claims(
    DELETE_ANY_USER_ACCOUNTS,
    DELETE_ORG_USER_ACCOUNTS,
    DELETE_EST_USER_ACCOUNTS,
    DELETE_OWN_USER_ACCOUNTS,
  )
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
