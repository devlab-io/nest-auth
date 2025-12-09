import { BaseService } from './base.service';
import {
  User,
  CreateUserRequest,
  PatchUserRequest,
  UpdateUserRequest,
  UserQueryParams,
  Page,
  Session,
} from '@devlab-io/nest-auth-types';

/**
 * Service for interacting with the User API routes
 */
export class UserService extends BaseService {
  /**
   * Create a new user
   * POST /users
   */
  public async create(data: CreateUserRequest): Promise<User> {
    this.ensureInitialized();
    return this.request<User>('/users', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Search for users with pagination and filters
   * GET /users
   *
   * @param query - The query parameters
   * @param page - The page number (default: 1)
   * @param size - The number of users per page (default: 10)
   * @returns A page of users
   */
  public async search(
    query?: UserQueryParams,
    page: number = 1,
    size: number = 10,
  ): Promise<Page<User>> {
    this.ensureInitialized();
    return this.request<Page<User>>('/users', {
      method: 'GET',
      params: { ...query, page, size },
    });
  }

  /**
   * Find a user by ID
   * GET /users/by-id?id={id}
   */
  public async findById(id: string): Promise<User | null> {
    this.ensureInitialized();
    return this.request<User | null>('/users/by-id', {
      method: 'GET',
      params: { id },
    });
  }

  /**
   * Find a user by email
   * GET /users/by-email?email={email}
   */
  public async findByEmail(email: string): Promise<User | null> {
    this.ensureInitialized();
    return this.request<User | null>('/users/by-email', {
      method: 'GET',
      params: { email },
    });
  }

  /**
   * Get the current authenticated user's profile
   * GET /users/me
   */
  public async getMe(): Promise<User> {
    this.ensureInitialized();
    return this.request<User>('/users/me', {
      method: 'GET',
    });
  }

  /**
   * Update the current authenticated user's profile
   * POST /users/me
   */
  public async updateMe(data: UpdateUserRequest): Promise<User> {
    this.ensureInitialized();
    return this.request<User>('/users/me', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Delete the current authenticated user's account
   * DELETE /users/me
   */
  public async deleteMe(): Promise<void> {
    this.ensureInitialized();
    return this.request<void>('/users/me', {
      method: 'DELETE',
    });
  }

  /**
   * Get a user by ID
   * GET /users/:id
   */
  public async getById(id: string): Promise<User> {
    this.ensureInitialized();
    return this.request<User>(`/users/${id}`, {
      method: 'GET',
    });
  }

  /**
   * Check if a user exists by ID
   * GET /users/:id/exists
   */
  public async exists(id: string): Promise<boolean> {
    this.ensureInitialized();
    return this.request<boolean>(`/users/${id}/exists`, {
      method: 'GET',
    });
  }

  /**
   * Partially update a user
   * PATCH /users/:id
   */
  public async patch(id: string, data: PatchUserRequest): Promise<User> {
    this.ensureInitialized();
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: data,
    });
  }

  /**
   * Update a user (full update)
   * POST /users/:id
   */
  public async update(id: string, data: UpdateUserRequest): Promise<User> {
    this.ensureInitialized();
    return this.request<User>(`/users/${id}`, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Enable a user account
   * PATCH /users/:id/enable
   */
  public async enable(id: string): Promise<User> {
    this.ensureInitialized();
    return this.request<User>(`/users/${id}/enable`, {
      method: 'PATCH',
    });
  }

  /**
   * Disable a user account
   * PATCH /users/:id/disable
   */
  public async disable(id: string): Promise<User> {
    this.ensureInitialized();
    return this.request<User>(`/users/${id}/disable`, {
      method: 'PATCH',
    });
  }

  /**
   * Delete a user
   * DELETE /users/:id
   */
  public async delete(id: string): Promise<void> {
    this.ensureInitialized();
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get all sessions for a user
   * GET /users/:id/sessions
   */
  public async getUserSessions(id: string): Promise<Session[]> {
    this.ensureInitialized();
    return this.request<Session[]>(`/users/${id}/sessions`, {
      method: 'GET',
    });
  }

  /**
   * Get all active sessions for a user (not expired)
   * GET /users/:id/sessions/active
   */
  public async getUserActiveSessions(id: string): Promise<Session[]> {
    this.ensureInitialized();
    return this.request<Session[]>(`/users/${id}/sessions/active`, {
      method: 'GET',
    });
  }

  /**
   * Delete all sessions for a user
   * DELETE /users/:id/sessions
   */
  public async deleteUserSessions(id: string): Promise<{ count: number }> {
    this.ensureInitialized();
    return this.request<{ count: number }>(`/users/${id}/sessions`, {
      method: 'DELETE',
    });
  }
}
