import { Repository } from 'typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities';
import {
  UserQueryParams,
  UpdateUserRequest,
  UserPage,
  GenerateUsernameRequest,
  CreateUserRequest,
  PatchUserRequest,
} from '../types';
import { CredentialService } from './credential.service';
import { ActionService } from './action.service';
import { UserConfig, UserConfigToken } from '../config/user.config';
import { capitalize, normalize } from '../utils';
import { ActionType, CreateActionRequest } from '../types';

@Injectable()
export class UserService {
  private readonly logger: Logger = new Logger(UserService.name);

  /**
   * Constructor
   *
   * @param userConfig - The user configuration
   * @param userRepository - The user repository
   * @param credentialService - The credential service
   * @param actionService - The action service
   */
  public constructor(
    @Inject(UserConfigToken) private readonly userConfig: UserConfig,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject() private readonly credentialService: CredentialService,
    @Inject() private readonly actionService: ActionService,
  ) {}

  /**
   * Generate a random 6-digit suffix
   *
   * @returns A random 6-digit number as string
   */
  private generateRandomSuffix(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate a unique username from the provided information
   *
   * @param request - The request containing email and optional username, firstName, lastName
   * @returns A unique username with suffix
   */
  private async generateUsername(
    request: GenerateUsernameRequest,
  ): Promise<string> {
    let baseUsername: string;

    // Priority 1: Use provided username if available
    if (request.username) {
      baseUsername = normalize(request.username);
    }
    // Priority 2: Use firstName and lastName if both are provided
    else if (request.firstName && request.lastName) {
      const fullName: string = `${request.firstName}${request.lastName}`;
      baseUsername = normalize(fullName);
    }
    // Priority 3: Use email (part before @)
    else {
      const emailPrefix: string = request.email.split('@')[0];
      baseUsername = normalize(emailPrefix);
    }

    // Generate unique username by trying different suffixes until we find one that doesn't exist
    const maxAttempts: number = 100;
    for (let attempt: number = 0; attempt < maxAttempts; attempt++) {
      const suffix: string = this.generateRandomSuffix();
      const username: string = `${baseUsername}#${suffix}`;

      // Check if this username already exists
      const exists: boolean = await this.userRepository.exists({
        where: { username },
      });
      if (!exists) {
        return username;
      }
    }

    // If we couldn't find a unique username after maxAttempts, throw an error
    throw new BadRequestException(
      'Unable to generate a unique username. Please try again.',
    );
  }

  /**
   * Create a new user
   *
   * @param request - The create user request
   * @returns The created user
   */
  public async create(request: CreateUserRequest): Promise<UserEntity> {
    // Generate username if not provided
    const username: string = await this.generateUsername(request);

    // Create new user (without credentials)
    let user: UserEntity = this.userRepository.create({
      email: request.email.toLowerCase(),
      emailValidated: false,
      username: username,
      firstName: request.firstName ? capitalize(request.firstName) : undefined,
      lastName: request.lastName?.toUpperCase(),
      phone: request.phone?.toUpperCase(),
      profilePicture: request.profilePicture,
      acceptedTerms: request.acceptedTerms,
      acceptedPrivacyPolicy: request.acceptedPrivacyPolicy,
      enabled: true,
    });

    // Save the user first
    user = await this.userRepository.save(user);

    // Create credentials if provided
    if (request.credentials && request.credentials.length > 0) {
      for (const credential of request.credentials) {
        if (credential.type === 'password' && credential.password) {
          await this.credentialService.createPasswordCredential(
            user.id,
            credential.password,
          );
        } else if (credential.type === 'google' && credential.googleId) {
          await this.credentialService.createGoogleCredential(
            user.id,
            credential.googleId,
          );
        }
      }
    }

    // Create actions if provided
    if (request.actions && request.actions.length > 0) {
      for (const action of request.actions) {
        await this.actionService.create({
          type: action.type,
          user: user,
          expiresIn: action.expiresIn,
          roles: action.roles,
        });
      }
      this.logger.debug(
        `Created ${request.actions.length} action(s) for user ${user.id}`,
      );
    }

    // Log
    this.logger.debug(`User with email ${user.email} created`);

    // Return the user
    return user;
  }

  /**
   * Patch a user.
   *
   * @param id - The ID of the user
   * @param request - The patch request
   * @returns The patched user
   */
  public async patch(
    id: string,
    request: PatchUserRequest,
  ): Promise<UserEntity> {
    // Get the user with the given ID
    let user: UserEntity = await this.getById(id);

    // Update the user
    if (request.firstName !== undefined) {
      user.firstName = capitalize(request.firstName);
    }
    if (request.lastName !== undefined) {
      user.lastName = request.lastName.toUpperCase();
    }
    if (request.phone !== undefined) {
      user.phone = request.phone.toUpperCase();
    }
    if (request.profilePicture !== undefined) {
      user.profilePicture = request.profilePicture;
    }

    // Save the user
    user = await this.userRepository.save(user);

    // Log
    this.logger.debug(`User with email ${user.email} updated`);

    // Return the user
    return user;
  }

  /**
   * Update a user.
   * This method bypasses required action validation, use it with caution and do not expose it in the API.
   * Use patch in the public API.
   *
   * @param id - The ID of the user
   * @param request - The update request
   * @returns The updated user
   * @throws NotFoundException if the user is not found
   */
  public async update(
    id: string,
    request: UpdateUserRequest,
  ): Promise<UserEntity> {
    // Get the user with the given ID
    let user: UserEntity = await this.getById(id);

    // Update the user
    if (request.username !== undefined) {
      user.username = await this.generateUsername({
        ...user,
        ...request,
      } as GenerateUsernameRequest);
    }
    if (request.email !== undefined) {
      user.email = request.email.toLowerCase();
    }
    if (request.emailValidated !== undefined) {
      user.emailValidated = request.emailValidated;
    }
    if (request.firstName !== undefined) {
      user.firstName = capitalize(request.firstName);
    }
    if (request.lastName !== undefined) {
      user.lastName = request.lastName.toUpperCase();
    }
    if (request.phone !== undefined) {
      user.phone = request.phone.toUpperCase();
    }
    if (request.enabled !== undefined) {
      user.enabled = request.enabled;
    }
    if (request.profilePicture !== undefined) {
      user.profilePicture = request.profilePicture;
    }
    if (request.acceptedTerms !== undefined) {
      user.acceptedTerms = request.acceptedTerms;
    }
    if (request.acceptedPrivacyPolicy !== undefined) {
      user.acceptedPrivacyPolicy = request.acceptedPrivacyPolicy;
    }

    // Save the user first
    user = await this.userRepository.save(user);

    // Update credentials if provided
    if (request.credentials && request.credentials.length > 0) {
      for (const credential of request.credentials) {
        if (credential.type === 'password' && credential.password) {
          // Create or update password credential
          await this.credentialService.setPasswordCredential(
            user.id,
            credential.password,
          );
        } else if (credential.type === 'google' && credential.googleId) {
          // Check if Google credential already exists
          const existing = await this.credentialService.findGoogleCredential(
            user.id,
          );
          if (!existing) {
            await this.credentialService.createGoogleCredential(
              user.id,
              credential.googleId,
            );
          }
        }
      }
    }

    // Log
    this.logger.debug(`User with email ${user.email} updated`);

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
  public async search(
    params: UserQueryParams,
    page: number = 1,
    limit: number = 10,
  ): Promise<UserPage> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.credentials', 'credentials')
      .leftJoinAndSelect('user.actions', 'actions')
      .leftJoinAndSelect('user.accounts', 'accounts')
      .leftJoinAndSelect('accounts.roles', 'roles');

    // Apply basic filters
    if (params.id) {
      queryBuilder.andWhere('user.id = :id', { id: params.id });
    }
    if (params.email) {
      queryBuilder.andWhere('user.email ILIKE :email', {
        email: `%${params.email}%`,
      });
    }
    if (params.emailValidated !== undefined) {
      queryBuilder.andWhere('user.emailValidated = :emailValidated', {
        emailValidated: params.emailValidated,
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

    // Handle action tokens filter
    if (params.actions !== undefined) {
      // params.actions is a bit mask or single ActionType value
      queryBuilder.andWhere('actions.type = :actions', {
        actions: params.actions,
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
   * Find a user by its email
   *
   * @param email - The email of the user
   * @returns The user or null if not found
   */
  public async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['credentials', 'actions', 'accounts', 'accounts.roles'],
    });
  }

  /**
   * Find a user by ID
   *
   * @param id - The ID of the user
   * @returns The user or null if not found
   */
  public async findById(id: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['credentials', 'actions', 'accounts', 'accounts.roles'],
    });
  }

  /**
   * Get a user by ID
   *
   * @param id - The ID of the user
   * @returns The user
   * @throws NotFoundException if the user is not found
   */
  public async getById(id: string): Promise<UserEntity> {
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
   * Check if a user with the given email exists
   *
   * @param email Check if a user with the given email exists
   * @returns True if the user exists, false otherwise
   */
  public async exists(email: string): Promise<boolean> {
    return await this.userRepository.exists({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Enable a user account
   *
   * @param id - The ID of the user
   * @returns The enabled user
   * @throws NotFoundException if the user is not found
   */
  public async enable(id: string): Promise<UserEntity> {
    // Get the user with the given ID
    const user: UserEntity = await this.getById(id);

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
  public async disable(id: string): Promise<UserEntity> {
    // Get the user with the given ID
    const user: UserEntity = await this.getById(id);

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
  public async delete(id: string): Promise<void> {
    // Get the user with the given ID
    const user: UserEntity = await this.getById(id);

    // Delete the user
    await this.userRepository.remove(user);
  }

  // ==========================================
  // Credential Management Facade Methods
  // ==========================================

  /**
   * Add a password credential to a user
   *
   * @param userId - The ID of the user
   * @param password - The plain text password
   * @returns The created credential
   * @throws NotFoundException if the user is not found
   * @throws BadRequestException if a password credential already exists
   */
  public async addPasswordCredential(
    userId: string,
    password: string,
  ): Promise<void> {
    // Verify user exists
    await this.getById(userId);

    // Create password credential
    await this.credentialService.createPasswordCredential(userId, password);

    this.logger.debug(`Password credential added to user ${userId}`);
  }

  /**
   * Add a Google credential to a user
   *
   * @param userId - The ID of the user
   * @param googleId - The Google OAuth ID
   * @returns The created credential
   * @throws NotFoundException if the user is not found
   * @throws BadRequestException if a Google credential already exists
   */
  public async addGoogleCredential(
    userId: string,
    googleId: string,
  ): Promise<void> {
    // Verify user exists
    await this.getById(userId);

    // Create Google credential
    await this.credentialService.createGoogleCredential(userId, googleId);

    this.logger.debug(`Google credential added to user ${userId}`);
  }

  /**
   * Remove a password credential from a user
   *
   * @param userId - The ID of the user
   * @throws NotFoundException if the user is not found
   */
  public async removePasswordCredential(userId: string): Promise<void> {
    // Verify user exists
    await this.getById(userId);

    // Delete password credential
    await this.credentialService.deletePasswordCredential(userId);

    this.logger.debug(`Password credential removed from user ${userId}`);
  }

  /**
   * Remove a Google credential from a user
   *
   * @param userId - The ID of the user
   * @throws NotFoundException if the user is not found
   */
  public async removeGoogleCredential(userId: string): Promise<void> {
    // Verify user exists
    await this.getById(userId);

    // Delete Google credential
    await this.credentialService.deleteGoogleCredential(userId);

    this.logger.debug(`Google credential removed from user ${userId}`);
  }

  /**
   * Remove a credential by its ID
   *
   * @param userId - The ID of the user (for verification)
   * @param credentialId - The ID of the credential to remove
   * @throws NotFoundException if the user or credential is not found
   */
  public async removeCredential(
    userId: string,
    credentialId: string,
  ): Promise<void> {
    // Verify user exists
    await this.getById(userId);

    // Get all credentials for the user to verify ownership
    const credentials = await this.credentialService.findByUserId(userId);
    const credential = credentials.find((c) => c.id === credentialId);

    if (!credential) {
      throw new NotFoundException(
        `Credential with ID ${credentialId} not found for user ${userId}`,
      );
    }

    // Delete the credential
    await this.credentialService.delete(credentialId);

    this.logger.debug(`Credential ${credentialId} removed from user ${userId}`);
  }

  // ==========================================
  // Action Management Facade Methods
  // ==========================================

  /**
   * Add an action to a user (create an action token)
   *
   * @param userId - The ID of the user
   * @param actionType - The action type (bit mask from ActionType enum)
   * @param expiresIn - Optional expiration time in hours
   * @param roles - Optional roles to assign with the action
   * @returns The created action token
   * @throws NotFoundException if the user is not found
   */
  public async addAction(
    userId: string,
    actionType: ActionType | number,
    expiresIn?: number,
    roles?: string[],
  ): Promise<string> {
    // Get the user
    const user = await this.getById(userId);

    // Create action request
    const createRequest: CreateActionRequest = {
      type: actionType,
      user: user,
      expiresIn: expiresIn,
      roles: roles,
    };

    // Create the action token
    const action = await this.actionService.create(createRequest);

    this.logger.debug(
      `Action ${actionType} added to user ${userId} with token ${action.token}`,
    );

    // Return the token for reference
    return action.token;
  }

  /**
   * Remove an action from a user (revoke an action token)
   *
   * @param userId - The ID of the user (for verification)
   * @param token - The action token to revoke
   * @throws NotFoundException if the user or token is not found
   */
  public async removeAction(userId: string, token: string): Promise<void> {
    // Verify user exists
    await this.getById(userId);

    // Find the action token to verify it belongs to the user
    const action = await this.actionService.findByToken(token);
    if (!action) {
      throw new NotFoundException(`Action token ${token} not found`);
    }

    if (action.user && action.user.id !== userId) {
      throw new BadRequestException(
        `Action token ${token} does not belong to user ${userId}`,
      );
    }

    // Revoke the action token
    await this.actionService.revoke(token);

    this.logger.debug(`Action token ${token} removed from user ${userId}`);
  }

  /**
   * Remove all actions for a user
   *
   * @param userId - The ID of the user
   * @throws NotFoundException if the user is not found
   */
  public async removeAllActions(userId: string): Promise<void> {
    // Get the user
    const user = await this.getById(userId);

    // Find all action tokens for this user
    const actionsPage = await this.actionService.findAll(
      { username: user.username },
      1,
      1000, // Get all actions (assuming reasonable limit)
    );

    // Revoke all action tokens
    for (const action of actionsPage.data) {
      if (action.user && action.user.id === userId) {
        await this.actionService.revoke(action.token);
      }
    }

    this.logger.debug(
      `All actions removed from user ${userId} (${actionsPage.data.length} tokens)`,
    );
  }
}
