import { BaseService } from './base.service';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '@devlab-io/nest-auth-types';

/**
 * Service for interacting with the Role API routes
 */
export class RoleService extends BaseService {
  /**
   * Create a new role
   * POST /roles
   */
  public async create(createRequest: CreateRoleRequest): Promise<Role> {
    this.ensureInitialized();
    return this.request<Role>('/roles', {
      method: 'POST',
      body: createRequest,
    });
  }

  /**
   * Get all roles
   * GET /roles
   */
  public async getAll(): Promise<Role[]> {
    this.ensureInitialized();
    return this.request<Role[]>('/roles', {
      method: 'GET',
    });
  }

  /**
   * Get a role by name
   * GET /roles/:name
   */
  public async getByName(name: string): Promise<Role> {
    this.ensureInitialized();
    return this.request<Role>(`/roles/${encodeURIComponent(name)}`, {
      method: 'GET',
    });
  }

  /**
   * Update a role
   * POST /roles/:name
   */
  public async update(
    name: string,
    updateRequest: UpdateRoleRequest,
  ): Promise<Role> {
    this.ensureInitialized();
    return this.request<Role>(`/roles/${encodeURIComponent(name)}`, {
      method: 'POST',
      body: updateRequest,
    });
  }

  /**
   * Delete a role
   * DELETE /roles/:name
   */
  public async delete(name: string): Promise<void> {
    this.ensureInitialized();
    return this.request<void>(`/roles/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  }
}
