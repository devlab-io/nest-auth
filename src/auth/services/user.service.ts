import { Repository } from 'typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity, RoleEntity, ActionTokenEntity } from '../entities';
import {
  UserQueryParams,
  UserUpdateRequest,
  UserPage,
  InviteRequest,
  SignUpRequest,
  ActionTokenType,
} from '../types';
import { MailerService, MailerServiceToken } from '@devlab-io/nest-mailer';
import { ActionTokenService } from './action-token.service';
import { RoleService } from './role.service';
import { UserConfig, UserConfigToken } from '../config/user.config';

@Injectable()
export class UserService {
  /**
   * Constructor
   *
   * @param userConfig - The user configuration
   * @param userRepository - The user repository
   * @param mailerService - The mailer service
   * @param actionTokenService - The action token service
   * @param roleService - The role service
   */
  constructor(
    @Inject(UserConfigToken) private readonly userConfig: UserConfig,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(MailerServiceToken) private readonly mailerService: MailerService,
    @Inject() private readonly actionTokenService: ActionTokenService,
    @Inject() private readonly roleService: RoleService,
  ) {}

  /**
   * Invite a user by creating an invitation token
   */
  async invite(invite: InviteRequest): Promise<ActionTokenEntity> {
    // Look for the user with the same email
    const user: UserEntity | null = await this.userRepository.findOne({
      where: { email: invite.email },
    });

    // If such user exists, throw an error
    if (user) {
      throw new BadRequestException(
        `User with email ${invite.email} already exists`,
      );
    }

    // Create invitation token
    const actionToken: ActionTokenEntity = await this.actionTokenService.create(
      {
        type: ActionTokenType.Invite,
        email: invite.email,
        roles: invite.roles ?? this.userConfig.user.defaultRoles, // action token service will verify if the roles exists
        expiresIn: invite.expiresIn,
      },
    );

    // Send invitation email
    await this.mailerService.send(
      invite.email,
      'Invitation to join the application',
      `You are invited to join the application. Please use the following link to sign up: ${actionToken.token}`,
    );

    // Return the action token
    return actionToken;
  }

  /**
   * Register a new user (sign up)
   */
  async signUp(request: SignUpRequest): Promise<UserEntity> {
    // Generate username if not provided
    const username: string = request.username || request.email.split('@')[0];

    // Check if a user with the same email or username already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email: request.email }, { username: username }],
    });
    if (existingUser) {
      throw new BadRequestException(
        existingUser.email === request.email
          ? `User with email ${request.email} already exists`
          : `User with username ${username} already exists`,
      );
    }

    // Get the roles and verify they all exist
    const roles: RoleEntity[] = await this.roleService.getAllByNames(
      this.userConfig.user.defaultRoles,
    );

    // Create new user
    const user = this.userRepository.create({
      email: request.email,
      username: username,
      password: request.password,
      firstName: request.firstName,
      lastName: request.lastName,
      phone: request.phone,
      profilePicture: request.profilePicture,
      acceptedTerms: request.acceptedTerms,
      acceptedPrivacyPolicy: request.acceptedPrivacyPolicy,
      enabled: true,
      roles: roles,
    });

    // Save the user
    return await this.userRepository.save(user);
  }

  /**
   * Update a user
   *
   * @param id - The ID of the user
   * @param request - The update request
   * @returns The updated user
   * @throws NotFoundException if the user is not found
   */
  async update(id: string, request: UserUpdateRequest): Promise<UserEntity> {
    // Get the user with the given ID
    const user: UserEntity | null = await this.getById(id);

    // Update the user
    if (request.firstName !== undefined) {
      user.firstName = request.firstName;
    }
    if (request.lastName !== undefined) {
      user.lastName = request.lastName;
    }
    if (request.phone !== undefined) {
      user.phone = request.phone;
    }
    if (request.profilePicture !== undefined) {
      user.profilePicture = request.profilePicture;
    }
    if (request.roles) {
      user.roles = await this.roleService.getAllByNames(request.roles);
    }

    // Save the user
    return await this.userRepository.save(user);
  }

  /**
   * Find a user by ID
   *
   * @param id - The ID of the user
   * @returns The user or null if not found
   */
  async findById(id: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'actionsTokens'],
    });
  }

  /**
   * Get a user by ID
   *
   * @param id - The ID of the user
   * @returns The user
   * @throws NotFoundException if the user is not found
   */
  async getById(id: string): Promise<UserEntity> {
    // Look for the user with the given ID
    const user: UserEntity | null = await this.findById(id);

    // If the user is not found, throw an error
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // Return the user
    return user;
  }

  /**
   * Search users with pagination and filters
   *
   * @param params - The query parameters
   * @param page - The page number
   * @param limit - The number of users per page
   * @returns The users page
   */
  async search(
    params: UserQueryParams,
    page: number = 1,
    limit: number = 10,
  ): Promise<UserPage> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('user.actionsTokens', 'actionsTokens');

    // Apply basic filters
    if (params.id) {
      queryBuilder.andWhere('user.id = :id', { id: params.id });
    }
    if (params.email) {
      queryBuilder.andWhere('user.email ILIKE :email', {
        email: `%${params.email}%`,
      });
    }
    if (params.username) {
      queryBuilder.andWhere('user.username ILIKE :username', {
        username: `%${params.username}%`,
      });
    }
    if (params.firstName) {
      queryBuilder.andWhere('user.firstName ILIKE :firstName', {
        firstName: `%${params.firstName}%`,
      });
    }
    if (params.lastName) {
      queryBuilder.andWhere('user.lastName ILIKE :lastName', {
        lastName: `%${params.lastName}%`,
      });
    }
    if (params.phone) {
      queryBuilder.andWhere('user.phone ILIKE :phone', {
        phone: `%${params.phone}%`,
      });
    }
    if (params.enabled !== undefined) {
      queryBuilder.andWhere('user.enabled = :enabled', {
        enabled: params.enabled,
      });
    }
    if (params.acceptedTerms !== undefined) {
      queryBuilder.andWhere('user.acceptedTerms = :acceptedTerms', {
        acceptedTerms: params.acceptedTerms,
      });
    }
    if (params.acceptedPrivacyPolicy !== undefined) {
      queryBuilder.andWhere(
        'user.acceptedPrivacyPolicy = :acceptedPrivacyPolicy',
        {
          acceptedPrivacyPolicy: params.acceptedPrivacyPolicy,
        },
      );
    }

    // Handle roles filter
    if (params.roles && params.roles.length > 0) {
      queryBuilder.andWhere('role.name IN (:...roles)', {
        roles: params.roles,
      });
    }

    // Handle action tokens filter
    if (params.actions && params.actions.length > 0) {
      queryBuilder.andWhere('actionsTokens.type IN (:...actions)', {
        actions: params.actions.map((action) => action.toString()),
      });
    }

    // Apply pagination and ordering
    queryBuilder
      .distinct(true)
      .skip(skip)
      .take(limit)
      .orderBy('user.username', 'ASC');

    // Execute query
    const [data, total]: [UserEntity[], number] =
      await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Enable a user account
   *
   * @param id - The ID of the user
   * @returns The enabled user
   * @throws NotFoundException if the user is not found
   */
  async enable(id: string): Promise<UserEntity> {
    // Get the user with the given ID
    const user: UserEntity | null = await this.getById(id);

    // Enable the user
    user.enabled = true;

    // Save the user
    return await this.userRepository.save(user);
  }

  /**
   * Disable a user account
   *
   * @param id - The ID of the user
   * @returns The disabled user
   * @throws NotFoundException if the user is not found
   */
  async disable(id: string): Promise<UserEntity> {
    // Get the user with the given ID
    const user: UserEntity | null = await this.getById(id);

    // Disable the user
    user.enabled = false;

    // Save the user
    return await this.userRepository.save(user);
  }

  /**
   * Permanently delete a user
   *
   * @param id - The ID of the user
   * @throws NotFoundException if the user is not found
   */
  async delete(id: string): Promise<void> {
    // Get the user with the given ID
    const user: UserEntity | null = await this.getById(id);

    // Delete the user
    await this.userRepository.remove(user);
  }
}
