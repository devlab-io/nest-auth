import { DataSource, Repository } from 'typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EstablishmentEntity,
  UserAccountEntity,
  UserEntity,
} from '../entities';
import {
  OrganisationService,
  OrganisationServiceToken,
} from './organisation.service';
import {
  CreateEstablishmentRequest,
  UpdateEstablishmentRequest,
  EstablishmentQueryParams,
  EstablishmentPage,
} from '@devlab-io/nest-auth-types';

/**
 * Symbol used to inject the EstablishmentService.
 */
export const EstablishmentServiceToken: symbol = Symbol('EstablishmentService');

/**
 * Interface for establishment services.
 */
export interface EstablishmentService {
  create(request: CreateEstablishmentRequest): Promise<EstablishmentEntity>;
  getById(id: string): Promise<EstablishmentEntity>;
  findById(id: string): Promise<EstablishmentEntity | null>;
  findByNameAndOrganisation(
    name: string,
    organisationId: string,
  ): Promise<EstablishmentEntity | null>;
  exists(id: string): Promise<boolean>;
  search(
    params: EstablishmentQueryParams,
    page?: number,
    limit?: number,
  ): Promise<EstablishmentPage>;
  update(
    id: string,
    request: UpdateEstablishmentRequest,
  ): Promise<EstablishmentEntity>;
  enable(id: string): Promise<EstablishmentEntity>;
  disable(id: string): Promise<EstablishmentEntity>;
  delete(id: string): Promise<void>;
}

/**
 * Base EstablishmentService implementation.
 *
 * This service can be extended by users to add custom logic for establishment management.
 * Extended services should inherit from this class and can override methods
 * to add custom behavior while preserving the base authentication functionality.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class ExtendedEstablishmentService extends EstablishmentService {
 *   async create(request: CreateEstablishmentRequest): Promise<ExtendedEstablishmentEntity> {
 *     const establishment = await super.create(request);
 *     // Add custom logic here
 *     return establishment;
 *   }
 * }
 * ```
 */
@Injectable()
export class DefaultEstablishmentService implements EstablishmentService {
  private readonly logger: Logger = new Logger(
    DefaultEstablishmentService.name,
  );

  /**
   * Constructor
   *
   * @param dataSource - The data source for transactions
   * @param establishmentRepository - The establishment repository
   * @param organisationService - The organisation service
   */
  public constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(EstablishmentEntity)
    private readonly establishmentRepository: Repository<EstablishmentEntity>,
    @Inject(OrganisationServiceToken)
    private readonly organisationService: OrganisationService,
  ) {}

  /**
   * Create a new establishment
   *
   * @param request - The create establishment request
   * @returns The created establishment
   * @throws NotFoundException if the organisation is not found
   * @throws BadRequestException if an establishment with the same name already exists in the organisation
   */
  public async create(
    request: CreateEstablishmentRequest,
  ): Promise<EstablishmentEntity> {
    // Verify that the organisation exists
    const organisation = await this.organisationService.getById(
      request.organisationId,
    );

    // Check if an establishment with the same name already exists in this organisation
    const existing = await this.findByNameAndOrganisation(
      request.name,
      request.organisationId,
    );

    if (existing) {
      throw new BadRequestException(
        `Establishment with name "${request.name}" already exists in this organisation`,
      );
    }

    // Create new establishment
    const establishment: EstablishmentEntity =
      this.establishmentRepository.create({
        name: request.name,
        organisation: organisation,
      });

    // Save the establishment
    const saved = await this.establishmentRepository.save(establishment);

    // Log
    this.logger.debug(
      `Establishment "${saved.name}" created with ID ${saved.id} in organisation ${organisation.name}`,
    );

    // Return the establishment
    return saved;
  }

  /**
   * Get an establishment by ID
   *
   * @param id - The ID of the establishment
   * @returns The establishment
   * @throws NotFoundException if the establishment is not found
   */
  public async getById(id: string): Promise<EstablishmentEntity> {
    const establishment = await this.findById(id);

    if (!establishment) {
      throw new NotFoundException(`Establishment with ID ${id} not found`);
    }

    return establishment;
  }

  /**
   * Find an establishment by ID
   *
   * @param id - The ID of the establishment
   * @returns The establishment or null if not found
   */
  public async findById(id: string): Promise<EstablishmentEntity | null> {
    return await this.establishmentRepository.findOne({
      where: { id },
      relations: ['organisation', 'accounts'],
    });
  }

  /**
   * Find an establishment by name and organisation
   *
   * @param name - The name of the establishment
   * @param organisationId - The ID of the organisation
   * @returns The establishment or null if not found
   */
  public async findByNameAndOrganisation(
    name: string,
    organisationId: string,
  ): Promise<EstablishmentEntity | null> {
    return await this.establishmentRepository.findOne({
      where: {
        name,
        organisation: { id: organisationId },
      },
      relations: ['organisation', 'accounts'],
    });
  }

  /**
   * Check if an establishment exists by ID
   *
   * @param id - The ID of the establishment
   * @returns True if the establishment exists, false otherwise
   */
  public async exists(id: string): Promise<boolean> {
    const count = await this.establishmentRepository.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Search establishments with pagination and filters
   *
   * @param params - The query parameters
   * @param page - The page number (default: 1)
   * @param limit - The number of establishments per page (default: 10)
   * @returns The establishments page
   */
  public async search(
    params: EstablishmentQueryParams,
    page: number = 1,
    limit: number = 10,
  ): Promise<EstablishmentPage> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.establishmentRepository
      .createQueryBuilder('establishment')
      .leftJoinAndSelect('establishment.organisation', 'organisation')
      .leftJoinAndSelect('establishment.accounts', 'accounts');

    // Apply filters
    if (params.id) {
      queryBuilder.andWhere('establishment.id = :id', { id: params.id });
    }
    if (params.name) {
      queryBuilder.andWhere('establishment.name ILIKE :name', {
        name: `%${params.name}%`,
      });
    }
    if (params.organisationId) {
      queryBuilder.andWhere('organisation.id = :organisationId', {
        organisationId: params.organisationId,
      });
    }

    // Apply pagination and ordering
    queryBuilder
      .distinct(true)
      .skip(skip)
      .take(limit)
      .orderBy('establishment.name', 'ASC');

    // Execute query
    const [data, total]: [EstablishmentEntity[], number] =
      await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Update an establishment
   *
   * @param id - The ID of the establishment
   * @param request - The update request
   * @returns The updated establishment
   * @throws NotFoundException if the establishment is not found
   * @throws NotFoundException if the new organisation is not found
   * @throws BadRequestException if an establishment with the new name already exists in the organisation
   */
  public async update(
    id: string,
    request: UpdateEstablishmentRequest,
  ): Promise<EstablishmentEntity> {
    // Get the establishment with the given ID
    let establishment: EstablishmentEntity = await this.getById(id);

    // Handle organisation change if provided
    if (request.organisationId) {
      const newOrganisation = await this.organisationService.getById(
        request.organisationId,
      );
      establishment.organisation = newOrganisation;
    }

    // Check if name is being updated and if it conflicts with existing establishment in the same organisation
    const targetOrganisationId: string =
      request.organisationId || establishment.organisation.id;
    if (request.name && request.name !== establishment.name) {
      const existing = await this.findByNameAndOrganisation(
        request.name,
        targetOrganisationId,
      );

      if (existing && existing.id !== establishment.id) {
        throw new BadRequestException(
          `Establishment with name "${request.name}" already exists in this organisation`,
        );
      }
    }

    // Update the establishment
    if (request.name !== undefined) {
      establishment.name = request.name;
    }

    // Save the establishment
    establishment = await this.establishmentRepository.save(establishment);

    // Log
    this.logger.debug(`Establishment with ID ${establishment.id} updated`);

    // Return the establishment
    return establishment;
  }

  /**
   * Enable an establishment
   *
   * @param id - The ID of the establishment
   * @returns The enabled establishment
   * @throws NotFoundException if the establishment is not found
   */
  public async enable(id: string): Promise<EstablishmentEntity> {
    // Get the establishment with the given ID
    const establishment: EstablishmentEntity = await this.getById(id);

    // Enable the establishment
    establishment.enabled = true;

    // Save the establishment
    const saved = await this.establishmentRepository.save(establishment);

    // Log
    this.logger.debug(`Establishment with ID ${id} enabled`);

    // Return the establishment
    return saved;
  }

  /**
   * Disable an establishment
   *
   * @param id - The ID of the establishment
   * @returns The disabled establishment
   * @throws NotFoundException if the establishment is not found
   */
  public async disable(id: string): Promise<EstablishmentEntity> {
    // Use a transaction to ensure all operations are atomic
    return await this.dataSource.transaction(async (manager) => {
      // Get the establishment with the given ID
      const establishment: EstablishmentEntity | null = await manager.findOne(
        EstablishmentEntity,
        {
          where: { id },
        },
      );

      if (!establishment) {
        throw new NotFoundException(`Establishment with ID ${id} not found`);
      }

      // Disable the establishment
      establishment.enabled = false;

      // Save the establishment
      const saved = await manager.save(EstablishmentEntity, establishment);

      // Disable all associated user accounts
      const userAccounts = await manager.find(UserAccountEntity, {
        where: { establishment: { id } },
        relations: ['user'],
      });

      const affectedUserIds = new Set<string>();

      if (userAccounts.length > 0) {
        for (const userAccount of userAccounts) {
          userAccount.enabled = false;
          affectedUserIds.add(userAccount.user.id);
        }
        await manager.save(UserAccountEntity, userAccounts);

        // Log
        this.logger.debug(
          `Disabled ${userAccounts.length} user account(s) associated with establishment ${id}`,
        );
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
      this.logger.debug(`Establishment with ID ${id} disabled`);

      // Return the establishment
      return saved;
    });
  }

  /**
   * Delete an establishment
   *
   * @param id - The ID of the establishment
   * @throws NotFoundException if the establishment is not found
   */
  public async delete(id: string): Promise<void> {
    // Get the establishment with the given ID
    const establishment: EstablishmentEntity = await this.getById(id);

    // Delete the establishment (cascade will handle related user accounts)
    await this.establishmentRepository.remove(establishment);

    // Log
    this.logger.debug(`Establishment with ID ${id} deleted`);
  }
}
