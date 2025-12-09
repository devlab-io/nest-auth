import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  OrganisationEntity,
  EstablishmentEntity,
  UserAccountEntity,
  UserEntity,
} from '../entities';
import { ScopeService } from './scope.service';
import {
  CreateOrganisationRequest,
  UpdateOrganisationRequest,
  OrganisationQueryParams,
  Organisation,
  Page,
  AuthScope,
  ClaimScope,
} from '@devlab-io/nest-auth-types';

/**
 * Symbol used to inject the OrganisationService.
 */
export const OrganisationServiceToken: symbol = Symbol('OrganisationService');

/**
 * Interface for organisation services.
 */
export interface OrganisationService {
  create(request: CreateOrganisationRequest): Promise<OrganisationEntity>;
  getById(id: string): Promise<OrganisationEntity>;
  findById(id: string): Promise<OrganisationEntity | null>;
  findByName(name: string): Promise<OrganisationEntity | null>;
  exists(id: string): Promise<boolean>;
  search(
    params: OrganisationQueryParams,
    page?: number,
    size?: number,
  ): Promise<Page<Organisation>>;
  update(
    id: string,
    request: UpdateOrganisationRequest,
  ): Promise<OrganisationEntity>;
  enable(id: string): Promise<OrganisationEntity>;
  disable(id: string): Promise<OrganisationEntity>;
  delete(id: string): Promise<void>;
}

/**
 * Default OrganisationService implementation.
 *
 * This service can be extended by users to add custom logic for organisation management.
 * Extended services should inherit from this class and can override methods
 * to add custom behavior while preserving the base authentication functionality.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class ExtendedOrganisationService extends OrganisationService {
 *   async create(request: CreateOrganisationRequest): Promise<ExtendedOrganisationEntity> {
 *     const organisation = await super.create(request);
 *     // Add custom logic here
 *     return organisation;
 *   }
 * }
 * ```
 */
@Injectable()
export class DefaultOrganisationService implements OrganisationService {
  private readonly logger: Logger = new Logger(DefaultOrganisationService.name);

  /**
   * Constructor
   *
   * @param dataSource - The data source for transactions
   * @param organisationRepository - The organisation repository
   * @param scopeService - The scope service
   */
  public constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OrganisationEntity)
    private readonly organisationRepository: Repository<OrganisationEntity>,
    private readonly scopeService: ScopeService,
  ) {}

  /**
   * Create a new organisation
   *
   * @param request - The create organisation request
   * @returns The created organisation
   * @throws BadRequestException if an organisation with the same name already exists
   */
  public async create(
    request: CreateOrganisationRequest,
  ): Promise<OrganisationEntity> {
    // Check if an organisation with the same name already exists
    const existing = await this.findByName(request.name);

    if (existing) {
      throw new BadRequestException(
        `Organisation with name "${request.name}" already exists`,
      );
    }

    // Create new organisation
    const organisation: OrganisationEntity = this.organisationRepository.create(
      {
        name: request.name,
      },
    );

    // Save the organisation
    const saved = await this.organisationRepository.save(organisation);

    // Log
    this.logger.debug(
      `Organisation "${saved.name}" created with ID ${saved.id}`,
    );

    // Return the organisation
    return saved;
  }

  /**
   * Apply scope filters to a query builder for organisations.
   * Filters based on organisationId of the connected account.
   * This ensures cross-resource access respects organisation boundaries.
   *
   * @param queryBuilder - The query builder
   */
  private applyScopeFilters(
    queryBuilder: SelectQueryBuilder<OrganisationEntity>,
  ): void {
    const authScope: AuthScope | null = this.scopeService.getScopeFromRequest();

    // No scope = no filtering (e.g., unauthenticated or internal call)
    if (!authScope) {
      return;
    }

    // ANY scope = no constraints
    if (authScope.scope === ClaimScope.ANY) {
      return;
    }

    // If organisationId is defined, filter by it
    // This applies regardless of the resource type (USER_ACCOUNTS, ORGANISATIONS, etc.)
    if (authScope.organisationId) {
      queryBuilder.andWhere('organisation.id = :organisationId', {
        organisationId: authScope.organisationId,
      });
      return;
    }

    // If scope is ORGANISATION/ESTABLISHMENT/OWN but no organisationId, deny all (safety fallback)
    if (
      authScope.scope === ClaimScope.ORGANISATION ||
      authScope.scope === ClaimScope.ESTABLISHMENT ||
      authScope.scope === ClaimScope.OWN
    ) {
      queryBuilder.andWhere('1 = 0'); // No results
      return;
    }
  }

  /**
   * Get an organisation by ID
   *
   * @param id - The ID of the organisation
   * @returns The organisation
   * @throws NotFoundException if the organisation is not found or out of scope
   */
  public async getById(id: string): Promise<OrganisationEntity> {
    const organisation = await this.findById(id);

    if (!organisation) {
      throw new NotFoundException(`Organisation with ID ${id} not found`);
    }

    return organisation;
  }

  /**
   * Find an organisation by ID
   * Applies scope filters to ensure organisations outside the current scope are not found.
   *
   * @param id - The ID of the organisation
   * @returns The organisation or null if not found or out of scope
   */
  public async findById(id: string): Promise<OrganisationEntity | null> {
    const queryBuilder = this.organisationRepository
      .createQueryBuilder('organisation')
      .leftJoinAndSelect('organisation.establishments', 'establishments')
      .where('organisation.id = :id', { id });

    this.applyScopeFilters(queryBuilder);

    return await queryBuilder.getOne();
  }

  /**
   * Find an organisation by name
   * Applies scope filters to ensure organisations outside the current scope are not found.
   *
   * @param name - The name of the organisation
   * @returns The organisation or null if not found or out of scope
   */
  public async findByName(name: string): Promise<OrganisationEntity | null> {
    const queryBuilder = this.organisationRepository
      .createQueryBuilder('organisation')
      .leftJoinAndSelect('organisation.establishments', 'establishments')
      .where('organisation.name = :name', { name });

    this.applyScopeFilters(queryBuilder);

    return await queryBuilder.getOne();
  }

  /**
   * Check if an organisation exists by ID
   * Applies scope filters to ensure organisations outside the current scope are not found.
   *
   * @param id - The ID of the organisation
   * @returns True if the organisation exists within scope, false otherwise
   */
  public async exists(id: string): Promise<boolean> {
    const queryBuilder = this.organisationRepository
      .createQueryBuilder('organisation')
      .where('organisation.id = :id', { id });

    this.applyScopeFilters(queryBuilder);

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  /**
   * Search organisations with pagination and filters
   *
   * @param params - The query parameters
   * @param page - The page number (default: 1)
   * @param size - The number of organisations per page (default: 10)
   * @returns A page of organisations
   */
  public async search(
    params: OrganisationQueryParams,
    page: number = 1,
    size: number = 10,
  ): Promise<Page<Organisation>> {
    const skip = (page - 1) * size;
    const queryBuilder = this.organisationRepository
      .createQueryBuilder('organisation')
      .leftJoinAndSelect('organisation.establishments', 'establishments');

    // Apply filters
    if (params.id) {
      queryBuilder.andWhere('organisation.id = :id', { id: params.id });
    }
    if (params.name) {
      queryBuilder.andWhere('organisation.name ILIKE :name', {
        name: `%${params.name}%`,
      });
    }

    // Apply scope filters
    this.applyScopeFilters(queryBuilder);

    // Apply pagination and ordering
    queryBuilder
      .distinct(true)
      .skip(skip)
      .take(size)
      .orderBy('organisation.name', 'ASC');

    // Execute query
    const [contents, total]: [OrganisationEntity[], number] =
      await queryBuilder.getManyAndCount();

    const pages = Math.ceil(total / size);

    return {
      contents,
      total,
      page,
      pages,
      size,
    };
  }

  /**
   * Update an organisation
   *
   * @param id - The ID of the organisation
   * @param request - The update request
   * @returns The updated organisation
   * @throws NotFoundException if the organisation is not found
   * @throws BadRequestException if an organisation with the new name already exists
   */
  public async update(
    id: string,
    request: UpdateOrganisationRequest,
  ): Promise<OrganisationEntity> {
    // Get the organisation with the given ID
    let organisation: OrganisationEntity = await this.getById(id);

    // Check if name is being updated and if it conflicts with existing organisation
    if (request.name && request.name !== organisation.name) {
      const existing = await this.findByName(request.name);

      if (existing) {
        throw new BadRequestException(
          `Organisation with name "${request.name}" already exists`,
        );
      }
    }

    // Update the organisation
    if (request.name !== undefined) {
      organisation.name = request.name;
    }

    // Save the organisation
    organisation = await this.organisationRepository.save(organisation);

    // Log
    this.logger.debug(`Organisation with ID ${organisation.id} updated`);

    // Return the organisation
    return organisation;
  }

  /**
   * Enable an organisation
   *
   * @param id - The ID of the organisation
   * @returns The enabled organisation
   * @throws NotFoundException if the organisation is not found
   */
  public async enable(id: string): Promise<OrganisationEntity> {
    // Get the organisation with the given ID
    const organisation: OrganisationEntity = await this.getById(id);

    // Enable the organisation
    organisation.enabled = true;

    // Save the organisation
    const saved = await this.organisationRepository.save(organisation);

    // Log
    this.logger.debug(`Organisation with ID ${id} enabled`);

    // Return the organisation
    return saved;
  }

  /**
   * Disable an organisation
   *
   * @param id - The ID of the organisation
   * @returns The disabled organisation
   * @throws NotFoundException if the organisation is not found
   */
  public async disable(id: string): Promise<OrganisationEntity> {
    // Use a transaction to ensure all operations are atomic
    return await this.dataSource.transaction(async (manager) => {
      // Get the organisation with the given ID
      const organisation: OrganisationEntity | null = await manager.findOne(
        OrganisationEntity,
        {
          where: { id },
        },
      );

      if (!organisation) {
        throw new NotFoundException(`Organisation with ID ${id} not found`);
      }

      // Disable the organisation
      organisation.enabled = false;

      // Save the organisation
      const saved = await manager.save(OrganisationEntity, organisation);

      // Disable all associated establishments
      const establishments = await manager.find(EstablishmentEntity, {
        where: { organisation: { id } },
      });

      const affectedUserIds = new Set<string>();

      if (establishments.length > 0) {
        for (const establishment of establishments) {
          establishment.enabled = false;
        }
        await manager.save(EstablishmentEntity, establishments);

        // Log
        this.logger.debug(
          `Disabled ${establishments.length} establishment(s) associated with organisation ${id}`,
        );

        // Disable all user accounts associated with these establishments
        const establishmentIds = establishments.map((est) => est.id);
        const userAccounts = await manager
          .createQueryBuilder(UserAccountEntity, 'userAccount')
          .leftJoinAndSelect('userAccount.user', 'user')
          .where('userAccount.establishment_id IN (:...establishmentIds)', {
            establishmentIds,
          })
          .getMany();

        if (userAccounts.length > 0) {
          for (const userAccount of userAccounts) {
            userAccount.enabled = false;
            affectedUserIds.add(userAccount.user.id);
          }
          await manager.save(UserAccountEntity, userAccounts);

          // Log
          this.logger.debug(
            `Disabled ${userAccounts.length} user account(s) associated with organisation ${id}`,
          );
        }
      }

      // For each affected user, check if all their accounts are disabled
      for (const userId of affectedUserIds) {
        const allUserAccounts = await manager.find(UserAccountEntity, {
          where: { user: { id: userId } },
        });

        const hasEnabledAccount = allUserAccounts.some(
          (account) => account.enabled,
        );

        // If the user has no enabled accounts, disable the user as well
        if (!hasEnabledAccount) {
          const user = await manager.findOne(UserEntity, {
            where: { id: userId },
          });

          if (user && user.enabled) {
            user.enabled = false;
            await manager.save(UserEntity, user);

            // Log
            this.logger.debug(
              `User ${userId} disabled because all user accounts are disabled`,
            );
          }
        }
      }

      // Log
      this.logger.debug(`Organisation with ID ${id} disabled`);

      // Return the organisation
      return saved;
    });
  }

  /**
   * Delete an organisation
   *
   * @param id - The ID of the organisation
   * @throws NotFoundException if the organisation is not found
   */
  public async delete(id: string): Promise<void> {
    // Get the organisation with the given ID
    const organisation: OrganisationEntity = await this.getById(id);

    // Delete the organisation (cascade will handle related establishments and user accounts)
    await this.organisationRepository.remove(organisation);

    // Log
    this.logger.debug(`Organisation with ID ${id} deleted`);
  }
}
