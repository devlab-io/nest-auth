import { BaseService } from './base.service';
import { Role } from '@devlab-io/nest-auth-types';

/**
 * Service for interacting with the Role API routes
 */
export class RoleService extends BaseService {
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
}
