import { BaseService } from './base.service';
import {
  Establishment,
  CreateEstablishmentRequest,
  UpdateEstablishmentRequest,
  EstablishmentQueryParams,
  Page,
} from '@devlab-io/nest-auth-types';

/**
 * Service for interacting with the Establishment API routes
 */
export class EstablishmentService extends BaseService {
  /**
   * Create a new establishment
   * POST /establishments
   */
  public async create(
    data: CreateEstablishmentRequest,
  ): Promise<Establishment> {
    this.ensureInitialized();
    return this.request<Establishment>('/establishments', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Search for establishments with pagination and filters
   * GET /establishments
   *
   * @param query - The query parameters
   * @param page - The page number (default: 1)
   * @param size - The number of establishments per page (default: 10)
   * @returns A page of establishments
   */
  public async search(
    query?: EstablishmentQueryParams,
    page: number = 1,
    size: number = 10,
  ): Promise<Page<Establishment>> {
    this.ensureInitialized();
    return this.request<Page<Establishment>>('/establishments', {
      method: 'GET',
      params: { ...query, page, size },
    });
  }

  /**
   * Find an establishment by ID
   * GET /establishments/by-id?id={id}
   */
  public async findById(id: string): Promise<Establishment | null> {
    this.ensureInitialized();
    return this.request<Establishment | null>('/establishments/by-id', {
      method: 'GET',
      params: { id },
    });
  }

  /**
   * Find an establishment by name and organisation
   * GET /establishments/by-name?name={name}&organisationId={organisationId}
   */
  public async findByNameAndOrganisation(
    name: string,
    organisationId: string,
  ): Promise<Establishment | null> {
    this.ensureInitialized();
    return this.request<Establishment | null>('/establishments/by-name', {
      method: 'GET',
      params: { name, organisationId },
    });
  }

  /**
   * Get an establishment by ID
   * GET /establishments/:id
   */
  public async getById(id: string): Promise<Establishment> {
    this.ensureInitialized();
    return this.request<Establishment>(`/establishments/${id}`, {
      method: 'GET',
    });
  }

  /**
   * Check if an establishment exists by ID
   * GET /establishments/:id/exists
   */
  public async exists(id: string): Promise<boolean> {
    this.ensureInitialized();
    return this.request<boolean>(`/establishments/${id}/exists`, {
      method: 'GET',
    });
  }

  /**
   * Update an establishment (full update)
   * POST /establishments/:id
   */
  public async update(
    id: string,
    data: UpdateEstablishmentRequest,
  ): Promise<Establishment> {
    this.ensureInitialized();
    return this.request<Establishment>(`/establishments/${id}`, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Partially update an establishment
   * PATCH /establishments/:id
   */
  public async patch(
    id: string,
    data: UpdateEstablishmentRequest,
  ): Promise<Establishment> {
    this.ensureInitialized();
    return this.request<Establishment>(`/establishments/${id}`, {
      method: 'PATCH',
      body: data,
    });
  }

  /**
   * Enable an establishment
   * PATCH /establishments/:id/enable
   */
  public async enable(id: string): Promise<Establishment> {
    this.ensureInitialized();
    return this.request<Establishment>(`/establishments/${id}/enable`, {
      method: 'PATCH',
    });
  }

  /**
   * Disable an establishment
   * PATCH /establishments/:id/disable
   */
  public async disable(id: string): Promise<Establishment> {
    this.ensureInitialized();
    return this.request<Establishment>(`/establishments/${id}/disable`, {
      method: 'PATCH',
    });
  }

  /**
   * Delete an establishment
   * DELETE /establishments/:id
   */
  public async delete(id: string): Promise<void> {
    this.ensureInitialized();
    return this.request<void>(`/establishments/${id}`, {
      method: 'DELETE',
    });
  }
}
