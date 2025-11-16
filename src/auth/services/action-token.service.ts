import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  LessThan,
  In,
  FindOptionsWhere,
  DeleteResult,
} from 'typeorm';
import { ActionTokenEntity, RoleEntity, UserEntity } from '../entities';
import {
  CreateActionTokenRequest,
  ActionTokenType,
  ActionTokenQueryParams,
  ActionTokenPage,
  ActionRequest,
} from '../types';
import { ActionTokenTypeUtils } from '../utils';
import { randomBytes } from 'crypto';
import { Logger } from '@nestjs/common';

@Injectable()
export class ActionTokenService {
  private readonly logger: Logger = new Logger(ActionTokenService.name);

  /**
   * Constructor
   *
   * @param actionTokenRepository - The action token repository
   * @param roleRepository - The role repository
   * @param userRepository - The user repository
   */
  public constructor(
    @InjectRepository(ActionTokenEntity)
    private readonly actionTokenRepository: Repository<ActionTokenEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Create a new action token.
   *
   * @param create - The create action token request
   * @returns The created action token
   * @throws BadRequestException if the request is invalid
   * @throws InternalServerErrorException if the token generation fails
   */
  public async create(
    create: CreateActionTokenRequest,
  ): Promise<ActionTokenEntity> {
    // Email is required for all action tokens
    if (!create.email && !create.user) {
      throw new BadRequestException(
        'An email is required for any action token',
      );
    }
    // Validate the create action token request
    // Actions that require an existing user
    const actionsRequiringUser =
      ActionTokenType.ResetPassword |
      ActionTokenType.AcceptTerms |
      ActionTokenType.AcceptPrivacyPolicy |
      ActionTokenType.ValidateEmail |
      ActionTokenType.CreatePassword |
      ActionTokenType.ChangeEmail;

    // Check if the bit mask contains any action that requires a user
    if (
      ActionTokenTypeUtils.hasAnyAction(create.type, actionsRequiringUser) &&
      !create.user
    ) {
      throw new BadRequestException(
        'A user is required for this action token type',
      );
    }

    // Invite action cannot be combined with user-requiring actions
    if (
      ActionTokenTypeUtils.hasAction(create.type, ActionTokenType.Invite) &&
      ActionTokenTypeUtils.hasAnyAction(create.type, actionsRequiringUser)
    ) {
      throw new BadRequestException(
        'Invite action cannot be combined with actions requiring an existing user',
      );
    }

    // Generate a unique token
    let token: string;
    let entity: ActionTokenEntity | null;

    // Ensure token is unique
    let count = 0;
    do {
      token = this.generateToken();
      entity = await this.actionTokenRepository.findOne({
        where: { token },
      });
      count++;
    } while (entity && count < 100);
    if (count >= 100) {
      throw new InternalServerErrorException(
        'Failed to generate a unique token',
      );
    }

    // If the token is associated with roles, find the roles
    let roles: RoleEntity[] = [];
    if (create.roles && create.roles.length > 0) {
      roles = await this.roleRepository.find({
        where: { name: In(create.roles) },
      });

      if (roles.length !== create.roles.length) {
        throw new BadRequestException('One or more roles not found');
      }
    }

    // If the token is associated with a user, find the user
    let user: UserEntity | null = null;
    if (create.user) {
      user = await this.userRepository.findOne({
        where: { id: create.user.id },
      });
      if (!user) {
        throw new BadRequestException(
          `User with id ${create.user.id} not found`,
        );
      }
      create.email = user.email;
    }

    // Expiration date
    let expiresAt: Date | undefined;
    if (create.expiresIn) {
      expiresAt = new Date(Date.now() + create.expiresIn * 60 * 60 * 1000);
    }

    // Create the token
    const actionToken: ActionTokenEntity = this.actionTokenRepository.create({
      token,
      type: create.type,
      email: create.email!.toLowerCase(), // we use either the provided email or the user email, it is defined above
      user: user ?? undefined,
      roles: roles.length > 0 ? roles : undefined,
      expiresAt: expiresAt,
    });

    // Save the token
    return await this.actionTokenRepository.save(actionToken);
  }

  /**
   * Find a token by its value
   *
   * @param token - The token value
   * @returns The action token, or null if not found
   */
  public async findByToken(token: string): Promise<ActionTokenEntity | null> {
    return await this.actionTokenRepository.findOne({
      where: { token },
      relations: ['user', 'roles'],
    });
  }

  /**
   * Find all action tokens by query parameters
   *
   * @param params - The query parameters
   * @returns The action tokens
   */
  public async findAll(
    params: ActionTokenQueryParams,
    page: number = 1,
    limit: number = 10,
  ): Promise<ActionTokenPage> {
    const where: FindOptionsWhere<ActionTokenEntity> = {};
    if (params.type) {
      where.type = params.type;
    }
    if (params.createdAt) {
      where.createdAt = params.createdAt;
    }
    if (params.expiresAt) {
      where.expiresAt = params.expiresAt;
    }
    if (params.roles) {
      where.roles = { name: In(params.roles) };
    }
    if (params.email) {
      where.user = { email: params.email };
    }
    if (params.username) {
      where.user = { username: params.username };
    }
    const skip: number = (page - 1) * limit;
    const [data, total]: [ActionTokenEntity[], number] =
      await this.actionTokenRepository.findAndCount({
        where,
        skip,
        take: limit,
      });
    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Check if an action request is valid (exists and not expired)
   * The token must be associated to the given email.
   * The token must contain all required actions.
   * If the token exists but is expired, it is deleted and the token is not valid
   *
   * @param request - The action request to validate.
   * @param requiredActions - The required actions (bit mask)
   * @returns The action token if it is valid
   * @throws ForbiddenException if the token is not valid
   */
  public async validate(
    request: ActionRequest,
    requiredActions: number,
  ): Promise<ActionTokenEntity> {
    // Look for the token
    const actionToken: ActionTokenEntity | null = await this.findByToken(
      request.token,
    );

    // If the token is not found, it is not valid
    if (!actionToken) {
      throw new ForbiddenException('Invalid action token');
    }

    // If the token is not associated to the given email, it is not valid
    if (actionToken.email !== request.email.toLowerCase()) {
      throw new ForbiddenException('Invalid action token');
    }

    // Check if the token contains all required actions
    if (
      !ActionTokenTypeUtils.hasAllActions(actionToken.type, requiredActions)
    ) {
      throw new ForbiddenException(
        'Token does not contain all required actions',
      );
    }

    // If the token has expired, it is not valid
    if (actionToken.expiresAt && actionToken.expiresAt < new Date()) {
      // Delete the action token
      await this.actionTokenRepository.remove(actionToken);

      // The token is not valid
      throw new ForbiddenException('Invalid action token');
    }

    // The token is valid
    return actionToken;
  }

  /**
   * Revoke (delete) a specific token
   *
   * @param token - The token value
   * @throws NotFoundException if the token is not found
   */
  public async revoke(token: string): Promise<void> {
    // Look for the token
    const actionToken: ActionTokenEntity | null =
      await this.actionTokenRepository.findOne({
        where: { token },
      });

    // If the token is not found, throw an error
    if (!actionToken) {
      throw new NotFoundException(`Action token with token ${token} not found`);
    }

    // Delete the action token
    await this.actionTokenRepository.remove(actionToken);
  }

  /**
   * Purge expired tokens
   */
  public async purge(): Promise<void> {
    const now: Date = new Date();
    const result: DeleteResult = await this.actionTokenRepository.delete({
      expiresAt: LessThan(now),
    });
    this.logger.log(`Purged ${result.affected} expired tokens`);
  }
}
