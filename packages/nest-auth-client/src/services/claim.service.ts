import { BaseService } from './base.service';
import { Claim } from '@devlab-io/nest-auth-types';

/**
 * Service for interacting with the Claim API routes
 */
export class ClaimService extends BaseService {
  /**
   * Get all claims
   * GET /claims
   */
  public async getAll(): Promise<Claim[]> {
    this.ensureInitialized();
    return this.request<Claim[]>('/claims', {
      method: 'GET',
    });
  }

  /**
   * Get a claim by its string representation
   * GET /claims/:claim
   *
   * @param claim - Claim string in format "action:scope:resource" (e.g., "read:any:users")
   * @returns The claim entity
   */
  public async getByClaim(claim: string): Promise<Claim> {
    this.ensureInitialized();
    return this.request<Claim>(`/claims/${encodeURIComponent(claim)}`, {
      method: 'GET',
    });
  }
}
