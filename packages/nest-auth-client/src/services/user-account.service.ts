import { BaseService } from './base.service';
import {
  UserAccount,
  CreateUserAccountRequest,
  UpdateUserAccountRequest,
  UserAccountQueryParams,
  UserAccountPage,
} from '@devlab-io/nest-auth-types';

/**
 * Service for interacting with the UserAccount API routes
 */
export class UserAccountService extends BaseService {
  /**
   * Create a new user account
   * POST /user-accounts
   */
  public async create(data: CreateUserAccountRequest): Promise<UserAccount> {
    this.ensureInitialized();
    return this.request<UserAccount>('/user-accounts', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Search for user accounts with pagination and filters
   * GET /user-accounts
   */
  public async search(
    query?: UserAccountQueryParams,
    page: number = 1,
    limit: number = 10,
  ): Promise<UserAccountPage> {
    this.ensureInitialized();
    return this.request<UserAccountPage>('/user-accounts', {
      method: 'GET',
      params: { ...query, page, limit },
    });
  }

  /**
   * Find a user account by ID
   * GET /user-accounts/by-id?id={id}
   */
  public async findById(id: string): Promise<UserAccount | null> {
    this.ensureInitialized();
    return this.request<UserAccount | null>('/user-accounts/by-id', {
      method: 'GET',
      params: { id },
    });
  }

  /**
   * Get a user account by ID
   * GET /user-accounts/:id
   */
  public async getById(id: string): Promise<UserAccount> {
    this.ensureInitialized();
    return this.request<UserAccount>(`/user-accounts/${id}`, {
      method: 'GET',
    });
  }

  /**
   * Check if a user account exists by ID
   * GET /user-accounts/:id/exists
   */
  public async exists(id: string): Promise<boolean> {
    this.ensureInitialized();
    return this.request<boolean>(`/user-accounts/${id}/exists`, {
      method: 'GET',
    });
  }

  /**
   * Update a user account (full update)
   * POST /user-accounts/:id
   */
  public async update(
    id: string,
    data: UpdateUserAccountRequest,
  ): Promise<UserAccount> {
    this.ensureInitialized();
    return this.request<UserAccount>(`/user-accounts/${id}`, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Partially update a user account
   * PATCH /user-accounts/:id
   */
  public async patch(
    id: string,
    data: UpdateUserAccountRequest,
  ): Promise<UserAccount> {
    this.ensureInitialized();
    return this.request<UserAccount>(`/user-accounts/${id}`, {
      method: 'PATCH',
      body: data,
    });
  }

  /**
   * Enable a user account
   * PATCH /user-accounts/:id/enable
   */
  public async enable(id: string): Promise<UserAccount> {
    this.ensureInitialized();
    return this.request<UserAccount>(`/user-accounts/${id}/enable`, {
      method: 'PATCH',
    });
  }

  /**
   * Disable a user account
   * PATCH /user-accounts/:id/disable
   */
  public async disable(id: string): Promise<UserAccount> {
    this.ensureInitialized();
    return this.request<UserAccount>(`/user-accounts/${id}/disable`, {
      method: 'PATCH',
    });
  }

  /**
   * Delete a user account
   * DELETE /user-accounts/:id
   */
  public async delete(id: string): Promise<void> {
    this.ensureInitialized();
    return this.request<void>(`/user-accounts/${id}`, {
      method: 'DELETE',
    });
  }
}
