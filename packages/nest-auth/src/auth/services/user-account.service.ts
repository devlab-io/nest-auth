import { DataSource, Repository } from 'typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAccountEntity, UserEntity } from '../entities';
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
import {
  CreateUserAccountRequest,
  UpdateUserAccountRequest,
  UserAccountQueryParams,
  UserAccountPage,
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
  ) {}

  /**
   * Create a new user account
   *
   * @param request - The create user account request
   * @returns The created user account
   * @throws NotFoundException if the user, organisation or establishment is not found
   * @throws BadRequestException if a user account already exists for this user in this organisation/establishment
   */
  public async create(
    request: CreateUserAccountRequest,
  ): Promise<UserAccountEntity> {
    // Verify that the user exists
    const user = await this.userService.getById(request.userId);

    // Verify that the organisation exists
    const organisation = await this.organisationService.getById(
      request.organisationId,
    );

    // Verify that the establishment exists
    const establishment = await this.establishmentService.getById(
      request.establishmentId,
    );

    // Verify that the establishment belongs to the organisation
    if (establishment.organisation.id !== organisation.id) {
      throw new BadRequestException(
        `Establishment ${establishment.id} does not belong to organisation ${organisation.id}`,
      );
    }

    // Check if a user account already exists for this user in this organisation/establishment
    const existing = await this.findByUserAndOrganisationAndEstablishment(
      request.userId,
      request.organisationId,
      request.establishmentId,
    );

    if (existing) {
      throw new BadRequestException(
        `User account already exists for this user in this organisation and establishment`,
      );
    }

    // Get the roles
    const roles = request.roles
      ? await this.roleService.getAllByNames(request.roles)
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
    this.logger.debug(
      `User account created with ID ${saved.id} for user ${user.email} in organisation ${organisation.name}, establishment ${establishment.name}`,
    );

    // Return the user account
    return saved;
  }

  /**
   * Get a user account by ID
   *
   * @param id - The ID of the user account
   * @returns The user account
   * @throws NotFoundException if the user account is not found
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
   *
   * @param id - The ID of the user account
   * @returns The user account or null if not found
   */
  public async findById(id: string): Promise<UserAccountEntity | null> {
    return await this.userAccountRepository.findOne({
      where: { id },
      relations: ['user', 'organisation', 'establishment', 'roles'],
    });
  }

  /**
   * Find a user account by user, organisation and establishment
   *
   * @param userId - The ID of the user
   * @param organisationId - The ID of the organisation
   * @param establishmentId - The ID of the establishment
   * @returns The user account or null if not found
   */
  public async findByUserAndOrganisationAndEstablishment(
    userId: string,
    organisationId: string,
    establishmentId: string,
  ): Promise<UserAccountEntity | null> {
    return await this.userAccountRepository.findOne({
      where: {
        user: { id: userId },
        organisation: { id: organisationId },
        establishment: { id: establishmentId },
      },
      relations: ['user', 'organisation', 'establishment', 'roles'],
    });
  }

  /**
   * Search user accounts with pagination and filters
   *
   * @param params - The query parameters
   * @param page - The page number (default: 1)
   * @param limit - The number of user accounts per page (default: 10)
   * @returns The user accounts page
   */
  public async search(
    params: UserAccountQueryParams,
    page: number = 1,
    limit: number = 10,
  ): Promise<UserAccountPage> {
    const skip = (page - 1) * limit;
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

    // Apply pagination and ordering
    queryBuilder
      .distinct(true)
      .skip(skip)
      .take(limit)
      .orderBy('userAccount.id', 'ASC');

    // Execute query
    const [data, total]: [UserAccountEntity[], number] =
      await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Update a user account
   *
   * @param id - The ID of the user account
   * @param request - The update request
   * @returns The updated user account
   * @throws NotFoundException if the user account is not found
   * @throws NotFoundException if the new organisation or establishment is not found
   * @throws BadRequestException if the establishment does not belong to the organisation
   * @throws BadRequestException if a user account already exists for this user in the new organisation/establishment
   */
  public async update(
    id: string,
    request: UpdateUserAccountRequest,
  ): Promise<UserAccountEntity> {
    // Get the user account with the given ID
    let userAccount: UserAccountEntity = await this.getById(id);

    // Handle organisation change if provided
    if (request.organisationId) {
      const newOrganisation = await this.organisationService.getById(
        request.organisationId,
      );
      userAccount.organisation = newOrganisation;
    }

    // Handle establishment change if provided
    if (request.establishmentId) {
      const newEstablishment = await this.establishmentService.getById(
        request.establishmentId,
      );
      userAccount.establishment = newEstablishment;

      // Verify that the establishment belongs to the organisation
      const targetOrganisationId =
        request.organisationId || userAccount.organisation.id;
      if (newEstablishment.organisation.id !== targetOrganisationId) {
        throw new BadRequestException(
          `Establishment ${newEstablishment.id} does not belong to organisation ${targetOrganisationId}`,
        );
      }
    }

    // Check if changing organisation/establishment would create a duplicate
    const targetOrganisationId =
      request.organisationId || userAccount.organisation.id;
    const targetEstablishmentId =
      request.establishmentId || userAccount.establishment.id;

    if (
      (request.organisationId || request.establishmentId) &&
      (targetOrganisationId !== userAccount.organisation.id ||
        targetEstablishmentId !== userAccount.establishment.id)
    ) {
      const existing = await this.findByUserAndOrganisationAndEstablishment(
        userAccount.user.id,
        targetOrganisationId,
        targetEstablishmentId,
      );

      if (existing && existing.id !== userAccount.id) {
        throw new BadRequestException(
          `User account already exists for this user in this organisation and establishment`,
        );
      }
    }

    // Update roles if provided
    if (request.roles !== undefined) {
      userAccount.roles = await this.roleService.getAllByNames(request.roles);
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
