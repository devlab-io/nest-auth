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
import { UserService } from '../services/user.service';
import {
  CreateUserRequest,
  PatchUserRequest,
  UpdateUserRequest,
  User,
  UserPage,
  UserQueryParams,
} from '../types';

/**
 * User controller
 * Mutable actions of this controller bypass authentication and required action token validations.
 * Use it with caution.
 */
@Controller('users')
export class UserController {
  /**
   * Constructor
   *
   * @param userService - The user service
   */
  constructor(private readonly userService: UserService) {}

  /**
   * Create a new user
   *
   * @param createUserRequest - The create user request
   * @returns The created user
   */
  @Post()
  async create(@Body() createUserRequest: CreateUserRequest): Promise<User> {
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
  async search(
    @Query() query: UserQueryParams,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<UserPage> {
    return await this.userService.search(query, page, limit);
  }

  /**
   * Find a user by ID
   *
   * @param id The ID of the user
   * @returns The user
   */
  @Get('by-id')
  async findById(@Param('id') id: string): Promise<User | null> {
    return await this.userService.findById(id);
  }

  /**
   * Find a user by email
   *
   * @param email The email of the user
   * @returns The user
   */
  @Get('by-email')
  async findByEmail(@Param('email') email: string): Promise<User | null> {
    return await this.userService.findByEmail(email);
  }

  /**
   * Get a user by ID
   *
   * @param id The ID of the user
   * @returns The user
   */
  @Get(':id')
  async getById(@Param('id') id: string): Promise<User> {
    return await this.userService.getById(id);
  }

  /**
   * Check if a user exists by ID
   *
   * @param id The ID of the user
   * @returns True if the user exists, false otherwise
   */
  @Get(':id/exists')
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
  async patch(
    @Param('id') id: string,
    @Body() patchUserRequest: PatchUserRequest,
  ): Promise<User> {
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
  async update(
    @Param('id') id: string,
    @Body() updateUserRequest: UpdateUserRequest,
  ): Promise<User> {
    return await this.userService.update(id, updateUserRequest);
  }

  /**
   * Enable a user account
   *
   * @param id The ID of the user
   * @returns The enabled user
   */
  @Patch(':id/enable')
  async enable(@Param('id') id: string): Promise<User> {
    return await this.userService.enable(id);
  }

  /**
   * Disable a user account
   *
   * @param id The ID of the user
   * @returns The disabled user
   */
  @Patch(':id/disable')
  async disable(@Param('id') id: string): Promise<User> {
    return await this.userService.disable(id);
  }

  /**
   * Delete a user
   *
   * @param id The ID of the user
   * @returns The deleted user
   */
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return await this.userService.delete(id);
  }
}
