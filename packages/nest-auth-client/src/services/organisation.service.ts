import { BaseService } from './base.service';
import {
  Organisation,
  CreateOrganisationRequest,
  UpdateOrganisationRequest,
  OrganisationQueryParams,
  OrganisationPage,
} from '@devlab-io/nest-auth-types';

/**
 * Service for interacting with the Organisation API routes
 */
export class OrganisationService extends BaseService {
  /**
   * Create a new organisation
   * POST /organisations
   */
  public async create(data: CreateOrganisationRequest): Promise<Organisation> {
    this.ensureInitialized();
    return this.request<Organisation>('/organisations', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Search for organisations with pagination and filters
   * GET /organisations
   */
  public async search(
    query?: OrganisationQueryParams,
    page: number = 1,
    limit: number = 10,
  ): Promise<OrganisationPage> {
    this.ensureInitialized();
    return this.request<OrganisationPage>('/organisations', {
      method: 'GET',
      params: { ...query, page, limit },
    });
  }

  /**
   * Find an organisation by ID
   * GET /organisations/by-id?id={id}
   */
  public async findById(id: string): Promise<Organisation | null> {
    this.ensureInitialized();
    return this.request<Organisation | null>('/organisations/by-id', {
      method: 'GET',
      params: { id },
    });
  }

  /**
   * Find an organisation by name
   * GET /organisations/by-name?name={name}
   */
  public async findByName(name: string): Promise<Organisation | null> {
    this.ensureInitialized();
    return this.request<Organisation | null>('/organisations/by-name', {
      method: 'GET',
      params: { name },
    });
  }

  /**
   * Get an organisation by ID
   * GET /organisations/:id
   */
  public async getById(id: string): Promise<Organisation> {
    this.ensureInitialized();
    return this.request<Organisation>(`/organisations/${id}`, {
      method: 'GET',
    });
  }

  /**
   * Check if an organisation exists by ID
   * GET /organisations/:id/exists
   */
  public async exists(id: string): Promise<boolean> {
    this.ensureInitialized();
    return this.request<boolean>(`/organisations/${id}/exists`, {
      method: 'GET',
    });
  }

  /**
   * Update an organisation (full update)
   * POST /organisations/:id
   */
  public async update(
    id: string,
    data: UpdateOrganisationRequest,
  ): Promise<Organisation> {
    this.ensureInitialized();
    return this.request<Organisation>(`/organisations/${id}`, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Partially update an organisation
   * PATCH /organisations/:id
   */
  public async patch(
    id: string,
    data: UpdateOrganisationRequest,
  ): Promise<Organisation> {
    this.ensureInitialized();
    return this.request<Organisation>(`/organisations/${id}`, {
      method: 'PATCH',
      body: data,
    });
  }

  /**
   * Enable an organisation
   * PATCH /organisations/:id/enable
   */
  public async enable(id: string): Promise<Organisation> {
    this.ensureInitialized();
    return this.request<Organisation>(`/organisations/${id}/enable`, {
      method: 'PATCH',
    });
  }

  /**
   * Disable an organisation
   * PATCH /organisations/:id/disable
   */
  public async disable(id: string): Promise<Organisation> {
    this.ensureInitialized();
    return this.request<Organisation>(`/organisations/${id}/disable`, {
      method: 'PATCH',
    });
  }

  /**
   * Delete an organisation
   * DELETE /organisations/:id
   */
  public async delete(id: string): Promise<void> {
    this.ensureInitialized();
    return this.request<void>(`/organisations/${id}`, {
      method: 'DELETE',
    });
  }
}
