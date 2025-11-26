import { BaseService } from './base.service';
import { Session, SessionQueryParams } from '@devlab-io/nest-auth-types';

/**
 * Service for interacting with the Session API routes
 */
export class SessionService extends BaseService {
  /**
   * Search sessions with filters
   * GET /sessions
   */
  public async search(query?: SessionQueryParams): Promise<Session[]> {
    this.ensureInitialized();
    const params: Record<string, string | number | boolean | Date> = {};
    if (query) {
      if (query.userAccountId) params.userAccountId = query.userAccountId;
      if (query.userId) params.userId = query.userId;
      if (query.loginDate) params.loginDate = query.loginDate;
      if (query.expirationDate) params.expirationDate = query.expirationDate;
      if (query.active !== undefined) params.active = query.active;
    }
    return this.request<Session[]>('/sessions', {
      method: 'GET',
      params,
    });
  }

  /**
   * Get all active sessions (not expired)
   * GET /sessions/active
   */
  public async findAllActive(): Promise<Session[]> {
    this.ensureInitialized();
    return this.request<Session[]>('/sessions/active', {
      method: 'GET',
    });
  }

  /**
   * Get a session by token
   * GET /sessions/:token
   */
  public async getByToken(token: string): Promise<Session> {
    this.ensureInitialized();
    return this.request<Session>(`/sessions/${token}`, {
      method: 'GET',
    });
  }

  /**
   * Delete a session by token
   * DELETE /sessions/:token
   */
  public async deleteByToken(token: string): Promise<void> {
    this.ensureInitialized();
    return this.request<void>(`/sessions/${token}`, {
      method: 'DELETE',
    });
  }

  /**
   * Delete all expired sessions
   * DELETE /sessions/expired
   */
  public async deleteExpired(): Promise<{ count: number }> {
    this.ensureInitialized();
    return this.request<{ count: number }>('/sessions/expired', {
      method: 'DELETE',
    });
  }
}
