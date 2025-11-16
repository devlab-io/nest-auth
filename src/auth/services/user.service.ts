import { Repository } from 'typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
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
  GenerateUsernameRequest,
  AcceptInvitationRequest,
  ResetPasswordRequest,
  AcceptTermsRequest,
  AcceptPrivacyPolicyRequest,
  ValidateEmailRequest,
  AnyActionRequest,
  CreateActionTokenRequest,
} from '../types';
import * as bcrypt from 'bcryptjs';
import { MailerService, MailerServiceToken } from '@devlab-io/nest-mailer';
import { ActionTokenService } from './action-token.service';
import { RoleService } from './role.service';
import { UserConfig, UserConfigToken } from '../config/user.config';
import { capitalize, normalize, ActionTokenTypeUtils } from '../utils';

@Injectable()
export class UserService {
  private readonly logger: Logger = new Logger(UserService.name);

  /**
   * Constructor
   *
   * @param userConfig - The user configuration
   * @param userRepository - The user repository
   * @param mailerService - The mailer service
   * @param actionTokenService - The action token service
   * @param roleService - The role service
   */
  public constructor(
    @Inject(UserConfigToken) private readonly userConfig: UserConfig,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(MailerServiceToken) private readonly mailerService: MailerService,
    @Inject() private readonly actionTokenService: ActionTokenService,
    @Inject() private readonly roleService: RoleService,
  ) {}

  /**
   * Hash a password using bcrypt
   *
   * @param password - The plain text password to hash
   * @returns The hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds: number = 10;
    return await bcrypt.hash(password, saltRounds);
  }

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
   * Get the maximum expiration time for a set of actions
   *
   * @param actions - Bit mask of actions
   * @returns The maximum expiration time in hours
   */
  private getMaxExpirationTime(actions: number): number {
    let maxExpiration: number = 0;

    if (ActionTokenTypeUtils.hasAction(actions, ActionTokenType.Invite)) {
      maxExpiration = Math.max(
        maxExpiration,
        this.userConfig.user.actions.invite,
      );
    }
    if (
      ActionTokenTypeUtils.hasAction(actions, ActionTokenType.ValidateEmail)
    ) {
      maxExpiration = Math.max(
        maxExpiration,
        this.userConfig.user.actions.validateEmail,
      );
    }
    if (ActionTokenTypeUtils.hasAction(actions, ActionTokenType.AcceptTerms)) {
      maxExpiration = Math.max(
        maxExpiration,
        this.userConfig.user.actions.acceptTerms,
      );
    }
    if (
      ActionTokenTypeUtils.hasAction(
        actions,
        ActionTokenType.AcceptPrivacyPolicy,
      )
    ) {
      maxExpiration = Math.max(
        maxExpiration,
        this.userConfig.user.actions.acceptPrivacyPolicy,
      );
    }
    if (
      ActionTokenTypeUtils.hasAction(actions, ActionTokenType.CreatePassword)
    ) {
      maxExpiration = Math.max(
        maxExpiration,
        this.userConfig.user.actions.createPassword,
      );
    }
    if (
      ActionTokenTypeUtils.hasAction(actions, ActionTokenType.ResetPassword)
    ) {
      maxExpiration = Math.max(
        maxExpiration,
        this.userConfig.user.actions.resetPassword,
      );
    }
    if (ActionTokenTypeUtils.hasAction(actions, ActionTokenType.ChangeEmail)) {
      maxExpiration = Math.max(
        maxExpiration,
        this.userConfig.user.actions.changeEmail,
      );
    }

    // If no action was found (should not happen in practice), return a default value
    if (maxExpiration === 0) {
      this.logger.warn(
        `No valid action found in bit mask ${actions}, using default expiration of 24 hours`,
      );
      return 24;
    }

    return maxExpiration;
  }

  /**
   * Generate email content from action bit mask
   *
   * @param actions - Bit mask of actions
   * @param token - The token value
   * @param expiresIn - Expiration time in hours
   * @returns Email subject and body
   */
  private generateEmailContent(
    actions: number,
    token: string,
    expiresIn: number,
  ): { subject: string; body: string } {
    const actionNames: string[] = [];
    const actionDescriptions: string[] = [];

    if (ActionTokenTypeUtils.hasAction(actions, ActionTokenType.Invite)) {
      actionNames.push('Invitation');
      actionDescriptions.push("Rejoindre l'application");
    }
    if (
      ActionTokenTypeUtils.hasAction(actions, ActionTokenType.ValidateEmail)
    ) {
      actionNames.push('Validation Email');
      actionDescriptions.push('Valider votre adresse email');
    }
    if (ActionTokenTypeUtils.hasAction(actions, ActionTokenType.AcceptTerms)) {
      actionNames.push('Acceptation CGU');
      actionDescriptions.push("Accepter les conditions d'utilisation");
    }
    if (
      ActionTokenTypeUtils.hasAction(
        actions,
        ActionTokenType.AcceptPrivacyPolicy,
      )
    ) {
      actionNames.push('Acceptation Politique de Confidentialité');
      actionDescriptions.push('Accepter la politique de confidentialité');
    }
    if (
      ActionTokenTypeUtils.hasAction(actions, ActionTokenType.CreatePassword)
    ) {
      actionNames.push('Création Mot de Passe');
      actionDescriptions.push('Créer votre mot de passe');
    }
    if (
      ActionTokenTypeUtils.hasAction(actions, ActionTokenType.ResetPassword)
    ) {
      actionNames.push('Réinitialisation Mot de Passe');
      actionDescriptions.push('Réinitialiser votre mot de passe');
    }
    if (ActionTokenTypeUtils.hasAction(actions, ActionTokenType.ChangeEmail)) {
      actionNames.push('Changement Email');
      actionDescriptions.push('Changer votre adresse email');
    }

    const subject: string =
      actionNames.length === 1
        ? actionNames[0]
        : `Actions Requises: ${actionNames.join(', ')}`;

    const actionList: string = actionDescriptions
      .map((desc, index) => `${index + 1}. ${desc}`)
      .join('\n');

    const body: string = `Bonjour,

Vous avez reçu ce message car vous devez effectuer une ou plusieurs actions sur votre compte.

${actionList}

Veuillez utiliser le lien suivant pour effectuer ces actions :
${token}

Ce lien est valide pendant ${expiresIn} heures.

Cordialement,
L'équipe`;

    return { subject, body };
  }

  /**
   * Send an action token email to a user (generic method)
   *
   * @param request - The create action token request
   * @param preActions - Optional callback to execute before creating the token (e.g., set fields to false)
   * @throws NotFoundException if the user is not found (when user is provided)
   * @throws BadRequestException if neither email nor user is provided
   */
  public async sendActionToken(
    request: CreateActionTokenRequest,
    preActions?: (user: UserEntity) => Promise<void> | void,
  ): Promise<void> {
    let user: UserEntity | undefined = undefined;
    let normalizedEmail: string;

    // Get the user and email
    if (request.user) {
      // Re-fetch the user to guarantee it's a UserEntity (even if redundant)
      user = await this.getById(request.user.id);
      normalizedEmail = user.email.toLowerCase();

      // Execute pre-actions if provided
      if (preActions) {
        await preActions(user);
        await this.userRepository.save(user);
      }
    } else if (request.email) {
      normalizedEmail = request.email.toLowerCase();
    } else {
      throw new BadRequestException(
        'Either email or user must be provided in the request',
      );
    }

    // Use provided expiresIn or calculate the maximum expiration time for the actions
    const expirationTime: number =
      request.expiresIn ?? this.getMaxExpirationTime(request.type);

    // Create the action token (actionTokenService.create will verify if a user is required)
    const token: ActionTokenEntity = await this.actionTokenService.create({
      type: request.type,
      email: normalizedEmail,
      user: user,
      roles: request.roles,
      expiresIn: expirationTime,
    });

    // Generate email content from actions
    const emailContent = this.generateEmailContent(
      request.type,
      token.token,
      expirationTime,
    );

    // Send the email
    await this.mailerService.send(
      normalizedEmail,
      emailContent.subject,
      emailContent.body,
    );

    // Log
    this.logger.debug(
      `Action token sent to ${normalizedEmail} for actions: ${request.type}`,
    );
  }

  /**
   * Process an action token (generic method)
   *
   * @param request - The process action token request
   * @param requiredActions - Bit mask of required actions
   * @throws ForbiddenException if the action token is not valid
   * @throws BadRequestException if required data is missing
   */
  public async processActionToken(
    request: AnyActionRequest,
    requiredActions: number,
  ): Promise<void> {
    // Validate the action token
    const token: ActionTokenEntity = await this.actionTokenService.validate(
      request.token,
      request.email,
      requiredActions,
    );

    // Get the user from the token (guaranteed to be defined by the token type)
    const user: UserEntity = token.user!;

    // Process each action in the bit mask
    if (
      ActionTokenTypeUtils.hasAnyAction(
        requiredActions,
        ActionTokenType.CreatePassword | ActionTokenType.ResetPassword,
      )
    ) {
      if (!('password' in request) || !request.password) {
        throw new BadRequestException('Password is required for this action');
      }
      user.password = await this.hashPassword(request.password);
    }

    if (
      ActionTokenTypeUtils.hasAction(
        requiredActions,
        ActionTokenType.ValidateEmail,
      )
    ) {
      user.emailValidated = true;
    }

    if (
      ActionTokenTypeUtils.hasAction(
        requiredActions,
        ActionTokenType.AcceptTerms,
      )
    ) {
      if (!('acceptedTerms' in request)) {
        throw new BadRequestException(
          'acceptedTerms is required for this action',
        );
      }
      if (!request.acceptedTerms) {
        this.logger.warn(
          `User with email ${request.email} has rejected the terms of service`,
        );
        throw new BadRequestException('User must accept the terms');
      }
      user.acceptedTerms = true;
    }

    if (
      ActionTokenTypeUtils.hasAction(
        requiredActions,
        ActionTokenType.AcceptPrivacyPolicy,
      )
    ) {
      if (!('acceptedPrivacyPolicy' in request)) {
        throw new BadRequestException(
          'acceptedPrivacyPolicy is required for this action',
        );
      }
      if (!request.acceptedPrivacyPolicy) {
        this.logger.warn(
          `User with email ${request.email} has rejected the privacy policy`,
        );
        throw new BadRequestException('User must accept the privacy policy');
      }
      user.acceptedPrivacyPolicy = true;
    }

    // Save the user
    await this.userRepository.save(user);

    // Revoke the action token
    await this.actionTokenService.revoke(request.token);

    // Log
    this.logger.debug(
      `User with email ${user.email} has processed actions: ${requiredActions}`,
    );
  }

  /**
   * Invite a user by creating an invitation token
   *
   * @param invite - The invite request containing the email and roles.
   * @returns The created action token
   * @throws BadRequestException if a user with the same email already exists
   */
  public async sendInvitation(invite: InviteRequest): Promise<void> {
    // Check if a user with the same email already exists
    const exists: boolean = await this.exists(invite.email);
    if (exists) {
      this.logger.warn(`A user with the same email already exists`);
      throw new BadRequestException(
        'A user with the same email already exists',
      );
    }

    // Use sendActionToken without userId (actionTokenService.create will verify if a user is required)
    await this.sendActionToken({
      email: invite.email,
      type: ActionTokenType.Invite,
      expiresIn: invite.expiresIn,
      roles: invite.roles ?? this.userConfig.user.defaultRoles,
    });
  }

  /**
   * Accept an invitation to join the application
   *
   * @param request - The accept invitation request containing the users information.
   * @returns The created user
   * @throws ForbiddenException if the action token is not valid
   * @throws BadRequestException if a user with the same email or username already exists
   */
  public async acceptInvitation(
    request: AcceptInvitationRequest,
  ): Promise<UserEntity> {
    // Validate the action token
    const token: ActionTokenEntity = await this.actionTokenService.validate(
      request.token,
      request.email,
      ActionTokenType.Invite as number,
    );

    // Generate username if not provided
    const username: string = await this.generateUsername(request);

    // Use the roles defined with the token or use the default roles
    const roles: RoleEntity[] =
      token.roles ??
      (await this.roleService.getAllByNames(this.userConfig.user.defaultRoles));

    // Hash password
    const hashedPassword: string = await this.hashPassword(request.password);

    // Create new user
    let user: UserEntity = this.userRepository.create({
      email: request.email.toLowerCase(),
      emailValidated: true,
      username: username,
      password: hashedPassword,
      firstName: request.firstName ? capitalize(request.firstName) : undefined,
      lastName: request.lastName?.toUpperCase(),
      phone: request.phone?.toUpperCase(),
      profilePicture: request.profilePicture,
      acceptedTerms: request.acceptedTerms,
      acceptedPrivacyPolicy: request.acceptedPrivacyPolicy,
      enabled: true,
      roles: roles,
    });

    // Revoke the action token
    await this.actionTokenService.revoke(request.token);

    // Save the user
    user = await this.userRepository.save(user);

    // Log
    this.logger.debug(`User with email ${user.email} accepted invitation`);

    // Return the user
    return user;
  }

  /**
   * Register a new user (sign up)
   *
   * @param request - The sign up request containing the users information.
   * @returns The created user
   * @throws BadRequestException if a user with the same email or username already exists
   */
  public async signUp(request: SignUpRequest): Promise<UserEntity> {
    // User must accept the terms and privacy policy
    if (!request.acceptedTerms || !request.acceptedPrivacyPolicy) {
      throw new BadRequestException(
        'User must accept the terms and privacy policy',
      );
    }

    // Generate username if not provided
    const username: string = await this.generateUsername(request);

    // Get the roles and verify they all exist
    const roles: RoleEntity[] = await this.roleService.getAllByNames(
      this.userConfig.user.defaultRoles,
    );

    // Hash password
    const hashedPassword: string = await this.hashPassword(request.password);

    // Create new user
    let user: UserEntity = this.userRepository.create({
      email: request.email.toLowerCase(),
      emailValidated: false,
      username: username,
      password: hashedPassword,
      firstName: request.firstName ? capitalize(request.firstName) : undefined,
      lastName: request.lastName?.toUpperCase(),
      phone: request.phone?.toUpperCase(),
      profilePicture: request.profilePicture,
      acceptedTerms: request.acceptedTerms,
      acceptedPrivacyPolicy: request.acceptedPrivacyPolicy,
      enabled: true,
      roles: roles,
    });

    // Save the user
    user = await this.userRepository.save(user);

    // Create and send an email validation token
    await this.sendEmailValidation(user.id);

    // Log
    this.logger.debug(`User with email ${user.email} signed up`);

    // Return the user
    return user;
  }

  /**
   * Update a user
   *
   * @param id - The ID of the user
   * @param request - The update request
   * @returns The updated user
   * @throws NotFoundException if the user is not found
   */
  public async update(
    id: string,
    request: UserUpdateRequest,
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
      user.phone = request.phone;
    }
    if (request.profilePicture !== undefined) {
      user.profilePicture = request.profilePicture;
    }
    if (request.roles) {
      user.roles = await this.roleService.getAllByNames(request.roles);
    }

    // Save the user
    user = await this.userRepository.save(user);

    // Log
    this.logger.debug(`User with email ${user.email} updated`);

    // Return the user
    return user;
  }

  /**
   * Send a password creation email to a user
   *
   * @param id - The ID of the user
   * @throws NotFoundException if the user is not found
   */
  public async sendCreatePassword(id: string): Promise<void> {
    const user: UserEntity = await this.getById(id);
    await this.sendActionToken({
      type: ActionTokenType.CreatePassword,
      user: user,
    });
  }

  /**
   * Create a user's password
   *
   * @param request - The create password request containing the new password.
   * @returns The updated user
   * @throws ForbiddenException if the action token is not valid
   */
  public async acceptCreatePassword(
    request: ResetPasswordRequest,
  ): Promise<void> {
    await this.processActionToken(request, ActionTokenType.CreatePassword);
  }

  /**
   * Send a password reset email to a user
   *
   * @param email - The email of the user
   */
  public async sendResetPassword(email: string): Promise<void> {
    // Get the user with the given email
    const user: UserEntity | null = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      this.logger.warn(
        `User with email ${email} not found, cannot send reset password email`,
      );
      // Return silently if the user is not found to not leak information about the existence of the email
      return;
    }

    await this.sendActionToken({
      type: ActionTokenType.ResetPassword,
      user: user,
    });
  }

  /**
   * Reset a user's password
   *
   * @param request - The reset password request containing the new password.
   * @returns The updated user
   * @throws ForbiddenException if the action token is not valid
   */
  public async acceptResetPassword(
    request: ResetPasswordRequest,
  ): Promise<void> {
    await this.processActionToken(
      {
        token: request.token,
        email: request.email,
        password: request.password,
      },
      ActionTokenType.ResetPassword,
    );
  }

  /**
   * Send a terms acceptance email to a user
   *
   * @param id - The ID of the user
   * @throws NotFoundException if the user is not found
   */
  public async sendAcceptTerms(id: string): Promise<void> {
    const user: UserEntity = await this.getById(id);
    await this.sendActionToken(
      {
        type: ActionTokenType.AcceptTerms,
        user: user,
      },
      (user: UserEntity): void => {
        user.acceptedTerms = false;
      },
    );
  }

  /**
   * Accept the terms of service
   *
   * @param request - The accept terms request containing the new password.
   * @returns The updated user
   * @throws ForbiddenException if the action token is not valid
   */
  public async acceptAcceptTerms(request: AcceptTermsRequest): Promise<void> {
    await this.processActionToken(
      {
        token: request.token,
        email: request.email,
        acceptedTerms: request.acceptedTerms,
      },
      ActionTokenType.AcceptTerms,
    );
  }

  /**
   * Send a privacy policy acceptance email to a user
   *
   * @param id - The ID of the user
   * @throws NotFoundException if the user is not found
   */
  public async sendAcceptPrivacyPolicy(id: string): Promise<void> {
    const user: UserEntity = await this.getById(id);
    await this.sendActionToken(
      {
        type: ActionTokenType.AcceptPrivacyPolicy,
        user: user,
      },
      (user: UserEntity): void => {
        user.acceptedPrivacyPolicy = false;
      },
    );
  }

  /**
   * Accept the privacy policy
   *
   * @param request - The accept privacy policy request containing the new password.
   * @returns The updated user
   * @throws ForbiddenException if the action token is not valid
   */
  public async acceptPrivacyPolicy(
    request: AcceptPrivacyPolicyRequest,
  ): Promise<void> {
    await this.processActionToken(
      {
        token: request.token,
        email: request.email,
        acceptedPrivacyPolicy: request.acceptedPrivacyPolicy,
      },
      ActionTokenType.AcceptPrivacyPolicy,
    );
  }

  /**
   * Send a email validation email to a user
   *
   * @param id - The ID of the user
   * @throws NotFoundException if the user is not found
   */
  public async sendEmailValidation(id: string): Promise<void> {
    const user: UserEntity = await this.getById(id);
    await this.sendActionToken(
      {
        type: ActionTokenType.ValidateEmail,
        user: user,
      },
      (user: UserEntity): void => {
        user.emailValidated = false;
      },
    );
  }

  /**
   * Validate a user's email
   *
   * @param request - The validate email request containing the new password.
   * @returns The updated user
   * @throws ForbiddenException if the action token is not valid
   */
  public async acceptEmailValidation(
    request: ValidateEmailRequest,
  ): Promise<void> {
    await this.processActionToken(
      {
        token: request.token,
        email: request.email,
      },
      ActionTokenType.ValidateEmail,
    );
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

    // Handle roles filter
    if (params.roles && params.roles.length > 0) {
      queryBuilder.andWhere('role.name IN (:...roles)', {
        roles: params.roles,
      });
    }

    // Handle action tokens filter
    if (params.actions && params.actions.length > 0) {
      queryBuilder.andWhere('actionsTokens.type IN (:...actions)', {
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
}
