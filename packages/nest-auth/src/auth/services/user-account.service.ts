import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  UserAccountEntity,
  UserEntity,
  OrganisationEntity,
  EstablishmentEntity,
} from '../entities';
import { UserService, UserServiceToken } from './user.service';
import {
  OrganisationService,
  OrganisationServiceToken,
} from './organisation.service';
import {
  EstablishmentService,
  EstablishmentServiceToken,
} from './establishment.service';
import { RoleService } from './role.service';
import { ScopeService } from './scope.service';
import {
  CreateUserAccountRequest,
  UpdateUserAccountRequest,
  UserAccountQueryParams,
  UserAccount,
  Page,
  USER_ACCOUNTS,
  AuthScope,
} from '@devlab-io/nest-auth-types';

@Injectable()
export class UserAccountService {
  private readonly logger: Logger = new Logger(UserAccountService.name);

  /**
   * Constructor
   *
   * @param dataSource - The data source for transactions
   * @param userAccountRepository - The user account repository
   * @param userService - The user service
   * @param organisationService - The organisation service
   * @param establishmentService - The establishment service
   * @param roleService - The role service
   * @param scopeService - The scope service
   */
  public constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(UserAccountEntity)
    private readonly userAccountRepository: Repository<UserAccountEntity>,
    @Inject(UserServiceToken)
    private readonly userService: UserService,
    @Inject(OrganisationServiceToken)
    private readonly organisationService: OrganisationService,
    @Inject(EstablishmentServiceToken)
    private readonly establishmentService: EstablishmentService,
    private readonly roleService: RoleService,
    private readonly scopeService: ScopeService,
  ) {}

  /**
   * Create a new user account
   *
   * @param request - The create user account request
   * @returns The created user account
   * @throws NotFoundException if the user, organisation or establishment (when provided) is not found
   * @throws BadRequestException if a user account already exists for this user in this organisation/establishment combination
   */
  public async create(
    request: CreateUserAccountRequest,
  ): Promise<UserAccountEntity> {
    // Verify that the user exists
    const user = await this.userService.getById(request.userId);

    // Verify that the organisation exists if provided
    let organisation: OrganisationEntity | undefined;
    if (request.organisationId) {
      organisation = await this.organisationService.getById(
        request.organisationId,
      );
    }

    // Verify that the establishment exists if provided
    let establishment: EstablishmentEntity | undefined;
    if (request.establishmentId) {
      establishment = await this.establishmentService.getById(
        request.establishmentId,
      );

      // If both organisation and establishment are provided, verify that the establishment belongs to the organisation
      if (organisation && establishment.organisation.id !== organisation.id) {
        throw new BadRequestException(
          `Establishment ${establishment.id} does not belong to organisation ${organisation.id}`,
        );
      }

      // If establishment is provided but organisation is not, use the establishment's organisation
      if (!organisation) {
        organisation = establishment.organisation;
      }
    }

    // Determine the final organisation and establishment IDs
    const finalOrganisationId = organisation?.id || null;
    const finalEstablishmentId = establishment?.id || null;

    // Check if a user account already exists for this user in this organisation/establishment combination
    const existing = await this.findByUserAndOrganisationAndEstablishment(
      request.userId,
      finalOrganisationId,
      finalEstablishmentId,
    );

    if (existing) {
      throw new BadRequestException(
        `User account already exists for this user in this organisation and establishment combination`,
      );
    }

    // Get the roles
    const roles = request.roles
      ? await this.roleService.getByNames(request.roles)
      : [];

    // Create new user account
    const userAccount: UserAccountEntity = this.userAccountRepository.create({
      user,
      organisation,
      establishment,
      roles,
    });

    // Save the user account
    const saved = await this.userAccountRepository.save(userAccount);

    // Log
    const orgInfo = organisation
      ? `organisation ${organisation.name}`
      : 'no organisation';
    const estInfo = establishment
      ? `, establishment ${establishment.name}`
      : ', no establishment';
    this.logger.debug(
      `User account created with ID ${saved.id} for user ${user.email} in ${orgInfo}${estInfo}`,
    );

    // Return the user account
    return saved;
  }

  /**
   * Apply scope filters to a query builder for user accounts
   *
   * @param queryBuilder - The query builder
   */
  private applyScopeFilters(
    queryBuilder: SelectQueryBuilder<UserAccountEntity>,
  ): void {
    const authScope: AuthScope | null = this.scopeService.getScopeFromRequest();

    if (!authScope || authScope.resource !== USER_ACCOUNTS) {
      return;
    }

    // If OWN scope, filter by user ID
    if (authScope.userId) {
      queryBuilder.andWhere('user.id = :userId', {
        userId: authScope.userId,
      });
      return;
    }

    // If ORGANISATION scope, filter by organisation
    if (authScope.organisationId) {
      queryBuilder.andWhere('organisation.id = :organisationId', {
        organisationId: authScope.organisationId,
      });
      return;
    }

    // If ESTABLISHMENT scope, filter by establishment
    if (authScope.establishmentId) {
      queryBuilder.andWhere('establishment.id = :establishmentId', {
        establishmentId: authScope.establishmentId,
      });
      return;
    }

    // If ANY scope, no constraints needed
  }

  /**
   * Get a user account by ID
   *
   * @param id - The ID of the user account
   * @returns The user account
   * @throws NotFoundException if the user account is not found or out of scope
   */
  public async getById(id: string): Promise<UserAccountEntity> {
    const userAccount = await this.findById(id);

    if (!userAccount) {
      throw new NotFoundException(`User account with ID ${id} not found`);
    }

    return userAccount;
  }

  /**
   * Find a user account by ID
   * Applies scope filters to ensure user accounts outside the current scope are not found.
   *
   * @param id - The ID of the user account
   * @returns The user account or null if not found or out of scope
   */
  public async findById(id: string): Promise<UserAccountEntity | null> {
    const queryBuilder = this.userAccountRepository
      .createQueryBuilder('userAccount')
      .leftJoinAndSelect('userAccount.user', 'user')
      .leftJoinAndSelect('userAccount.organisation', 'organisation')
      .leftJoinAndSelect('userAccount.establishment', 'establishment')
      .leftJoinAndSelect('userAccount.roles', 'roles')
      .leftJoinAndSelect('roles.claims', 'claims')
      .where('userAccount.id = :id', { id });

    this.applyScopeFilters(queryBuilder);

    return await queryBuilder.getOne();
  }

  /**
   * Find all user accounts for a given user
   * Applies scope filters to ensure user accounts outside the current scope are not found.
   *
   * @param userId - The ID of the user
   * @returns Array of user accounts within scope
   */
  public async findByUserId(userId: string): Promise<UserAccountEntity[]> {
    const queryBuilder = this.userAccountRepository
      .createQueryBuilder('userAccount')
      .leftJoinAndSelect('userAccount.user', 'user')
      .leftJoinAndSelect('userAccount.organisation', 'organisation')
      .leftJoinAndSelect('userAccount.establishment', 'establishment')
      .leftJoinAndSelect('userAccount.roles', 'roles')
      .where('user.id = :userId', { userId });

    this.applyScopeFilters(queryBuilder);

    return await queryBuilder.getMany();
  }

  /**
   * Find a user account by user, organisation and establishment
   * Applies scope filters to ensure user accounts outside the current scope are not found.
   *
   * @param userId - The ID of the user
   * @param organisationId - The ID of the organisation (optional)
   * @param establishmentId - The ID of the establishment (optional)
   * @returns The user account or null if not found or out of scope
   */
  public async findByUserAndOrganisationAndEstablishment(
    userId: string,
    organisationId?: string | null,
    establishmentId?: string | null,
  ): Promise<UserAccountEntity | null> {
    const queryBuilder = this.userAccountRepository
      .createQueryBuilder('userAccount')
      .leftJoinAndSelect('userAccount.user', 'user')
      .leftJoinAndSelect('userAccount.organisation', 'organisation')
      .leftJoinAndSelect('userAccount.establishment', 'establishment')
      .leftJoinAndSelect('userAccount.roles', 'roles')
      .where('user.id = :userId', { userId });

    if (organisationId) {
      queryBuilder.andWhere('organisation.id = :organisationId', {
        organisationId,
      });
    } else {
      queryBuilder.andWhere('organisation.id IS NULL');
    }

    if (establishmentId) {
      queryBuilder.andWhere('establishment.id = :establishmentId', {
        establishmentId,
      });
    } else {
      queryBuilder.andWhere('establishment.id IS NULL');
    }

    this.applyScopeFilters(queryBuilder);

    return await queryBuilder.getOne();
  }

  /**
   * Search user accounts with pagination and filters
   *
   * @param params - The query parameters
   * @param page - The page number (default: 1)
   * @param size - The number of user accounts per page (default: 10)
   * @returns A page of user accounts
   */
  public async search(
    params: UserAccountQueryParams,
    page: number = 1,
    size: number = 10,
  ): Promise<Page<UserAccount>> {
    const skip = (page - 1) * size;
    const queryBuilder = this.userAccountRepository
      .createQueryBuilder('userAccount')
      .leftJoinAndSelect('userAccount.user', 'user')
      .leftJoinAndSelect('userAccount.organisation', 'organisation')
      .leftJoinAndSelect('userAccount.establishment', 'establishment')
      .leftJoinAndSelect('userAccount.roles', 'roles');

    // Apply filters
    if (params.id) {
      queryBuilder.andWhere('userAccount.id = :id', { id: params.id });
    }
    if (params.userId) {
      queryBuilder.andWhere('user.id = :userId', { userId: params.userId });
    }
    if (params.organisationId) {
      queryBuilder.andWhere('organisation.id = :organisationId', {
        organisationId: params.organisationId,
      });
    }
    if (params.establishmentId) {
      queryBuilder.andWhere('establishment.id = :establishmentId', {
        establishmentId: params.establishmentId,
      });
    }
    if (params.roles && params.roles.length > 0) {
      queryBuilder.andWhere('roles.name IN (:...roles)', {
        roles: params.roles,
      });
    }

    // Apply scope filters
    this.applyScopeFilters(queryBuilder);

    // Apply pagination and ordering
    queryBuilder
      .distinct(true)
      .skip(skip)
      .take(size)
      .orderBy('userAccount.id', 'ASC');

    // Execute query
    const [contents, total]: [UserAccountEntity[], number] =
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
   * Update a user account
   *
   * @param id - The ID of the user account
   * @param request - The update request
   * @returns The updated user account
   * @throws NotFoundException if the user account is not found
   * @throws NotFoundException if the new organisation or establishment (when provided) is not found
   * @throws BadRequestException if the establishment does not belong to the organisation (when both are provided)
   * @throws BadRequestException if a user account already exists for this user in the new organisation/establishment combination
   */
  public async update(
    id: string,
    request: UpdateUserAccountRequest,
  ): Promise<UserAccountEntity> {
    // Get the user account with the given ID
    let userAccount: UserAccountEntity = await this.getById(id);

    // Handle organisation change if provided
    let newOrganisation: OrganisationEntity | undefined;
    if (request.organisationId !== undefined) {
      if (request.organisationId) {
        newOrganisation = await this.organisationService.getById(
          request.organisationId,
        );
      }
      userAccount.organisation = newOrganisation || undefined;
    }

    // Handle establishment change if provided
    let newEstablishment: EstablishmentEntity | undefined;
    if (request.establishmentId !== undefined) {
      if (request.establishmentId) {
        newEstablishment = await this.establishmentService.getById(
          request.establishmentId,
        );

        // Verify that the establishment belongs to the organisation if both are set
        const targetOrganisationId =
          request.organisationId !== undefined
            ? newOrganisation?.id || null
            : userAccount.organisation?.id || null;

        if (
          targetOrganisationId &&
          newEstablishment.organisation.id !== targetOrganisationId
        ) {
          throw new BadRequestException(
            `Establishment ${newEstablishment.id} does not belong to organisation ${targetOrganisationId}`,
          );
        }

        // If establishment is set but organisation is not (and wasn't set in this update), use establishment's organisation
        if (!targetOrganisationId && newEstablishment) {
          userAccount.organisation = newEstablishment.organisation;
        }
      }
      userAccount.establishment = newEstablishment || undefined;
    }

    // Check if changing organisation/establishment would create a duplicate
    const targetOrganisationId =
      request.organisationId !== undefined
        ? request.organisationId || userAccount.organisation?.id || null
        : userAccount.organisation?.id || null;
    const targetEstablishmentId =
      request.establishmentId !== undefined
        ? request.establishmentId || userAccount.establishment?.id || null
        : userAccount.establishment?.id || null;

    const organisationChanged =
      request.organisationId !== undefined &&
      targetOrganisationId !== (userAccount.organisation?.id || null);
    const establishmentChanged =
      request.establishmentId !== undefined &&
      targetEstablishmentId !== (userAccount.establishment?.id || null);

    if (organisationChanged || establishmentChanged) {
      const existing = await this.findByUserAndOrganisationAndEstablishment(
        userAccount.user.id,
        targetOrganisationId,
        targetEstablishmentId,
      );

      if (existing && existing.id !== userAccount.id) {
        throw new BadRequestException(
          `User account already exists for this user in this organisation and establishment combination`,
        );
      }
    }

    // Update roles if provided
    if (request.roles !== undefined) {
      userAccount.roles = await this.roleService.getByNames(request.roles);
    }

    // Save the user account
    userAccount = await this.userAccountRepository.save(userAccount);

    // Log
    this.logger.debug(`User account with ID ${userAccount.id} updated`);

    // Return the user account
    return userAccount;
  }

  /**
   * Enable a user account
   *
   * @param id - The ID of the user account
   * @returns The enabled user account
   * @throws NotFoundException if the user account is not found
   */
  public async enable(id: string): Promise<UserAccountEntity> {
    // Get the user account with the given ID
    const userAccount: UserAccountEntity = await this.getById(id);

    // Enable the user account
    userAccount.enabled = true;

    // Save the user account
    const saved = await this.userAccountRepository.save(userAccount);

    // Log
    this.logger.debug(`User account with ID ${id} enabled`);

    // Return the user account
    return saved;
  }

  /**
   * Disable a user account
   *
   * @param id - The ID of the user account
   * @returns The disabled user account
   * @throws NotFoundException if the user account is not found
   */
  public async disable(id: string): Promise<UserAccountEntity> {
    // Use a transaction to ensure all operations are atomic
    return await this.dataSource.transaction(async (manager) => {
      // Get the user account with the given ID
      const userAccount: UserAccountEntity | null = await manager.findOne(
        UserAccountEntity,
        {
          where: { id },
          relations: ['user'],
        },
      );

      if (!userAccount) {
        throw new NotFoundException(`User account with ID ${id} not found`);
      }

      const userId = userAccount.user.id;

      // Disable the user account
      userAccount.enabled = false;

      // Save the user account
      const saved = await manager.save(UserAccountEntity, userAccount);

      // Check if the user has any other enabled user accounts
      const allUserAccounts = await manager.find(UserAccountEntity, {
        where: { user: { id: userId } },
      });

      const hasEnabledAccount = allUserAccounts.some(
        (account) => account.enabled && account.id !== id,
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

      // Log
      this.logger.debug(`User account with ID ${id} disabled`);

      // Return the user account
      return saved;
    });
  }

  /**
   * Delete a user account
   *
   * @param id - The ID of the user account
   * @throws NotFoundException if the user account is not found
   */
  public async delete(id: string): Promise<void> {
    // Get the user account with the given ID
    const userAccount: UserAccountEntity = await this.getById(id);

    // Delete the user account (cascade will handle related sessions)
    await this.userAccountRepository.remove(userAccount);

    // Log
    this.logger.debug(`User account with ID ${id} deleted`);
  }
}
