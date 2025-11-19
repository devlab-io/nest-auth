import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ActionTokenEntity, UserEntity } from '../entities';
import { UserService } from './user.service';
import {
  AcceptInvitationRequest,
  AcceptPrivacyPolicyRequest,
  AcceptTermsRequest,
  ActionTokenType,
  AnyActionRequest,
  AuthResponse,
  CreateActionTokenRequest,
  CreatePasswordRequest,
  InviteRequest,
  JwtToken,
  ResetPasswordRequest,
  SignInRequest,
  SignUpRequest,
  UpdateUserRequest,
  ValidateEmailRequest,
} from '../types';
import { UserConfig, UserConfigToken } from '../config/user.config';
import { ActionConfig, ActionConfigToken } from '../config/action.config';
import { ActionTokenService } from './action-token.service';
import { ActionTokenTypeUtils } from '../utils';
import { MailerService, MailerServiceToken } from '@devlab-io/nest-mailer';
import { JwtService } from './jwt.service';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  public constructor(
    @Inject(UserConfigToken) private readonly userConfig: UserConfig,
    @Inject(ActionConfigToken) private readonly actionConfig: ActionConfig,
    @Inject() private readonly actionTokenService: ActionTokenService,
    @Inject() private readonly userService: UserService,
    @Inject(MailerServiceToken) private readonly mailerService: MailerService,
    @Inject() private readonly jwtService: JwtService,
  ) {}

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
        this.actionConfig.invite.validity,
      );
    }
    if (
      ActionTokenTypeUtils.hasAction(actions, ActionTokenType.ValidateEmail)
    ) {
      maxExpiration = Math.max(
        maxExpiration,
        this.actionConfig.validateEmail.validity,
      );
    }
    if (ActionTokenTypeUtils.hasAction(actions, ActionTokenType.AcceptTerms)) {
      maxExpiration = Math.max(
        maxExpiration,
        this.actionConfig.acceptTerms.validity,
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
        this.actionConfig.acceptPrivacyPolicy.validity,
      );
    }
    if (
      ActionTokenTypeUtils.hasAction(actions, ActionTokenType.CreatePassword)
    ) {
      maxExpiration = Math.max(
        maxExpiration,
        this.actionConfig.createPassword.validity,
      );
    }
    if (
      ActionTokenTypeUtils.hasAction(actions, ActionTokenType.ResetPassword)
    ) {
      maxExpiration = Math.max(
        maxExpiration,
        this.actionConfig.resetPassword.validity,
      );
    }
    if (ActionTokenTypeUtils.hasAction(actions, ActionTokenType.ChangeEmail)) {
      maxExpiration = Math.max(
        maxExpiration,
        this.actionConfig.changeEmail.validity,
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
   * Build a custom frontend link for an action token
   *
   * @param actionType - The action token type
   * @param frontendUrl - The frontend URL
   * @param token - The token value
   * @param email - The user email
   * @returns The custom link if route is configured, undefined otherwise
   */
  private buildActionLink(
    actionType: ActionTokenType,
    frontendUrl: string,
    token: string,
    email: string,
  ): string | undefined {
    let actionRoute: string | undefined;

    // Get the route for the specific action type
    if (actionType === ActionTokenType.Invite) {
      actionRoute = this.actionConfig.invite.route;
    } else if (actionType === ActionTokenType.ValidateEmail) {
      actionRoute = this.actionConfig.validateEmail.route;
    } else if (actionType === ActionTokenType.CreatePassword) {
      actionRoute = this.actionConfig.createPassword.route;
    } else if (actionType === ActionTokenType.ResetPassword) {
      actionRoute = this.actionConfig.resetPassword.route;
    } else if (actionType === ActionTokenType.ChangeEmail) {
      actionRoute = this.actionConfig.changeEmail.route;
    } else if (actionType === ActionTokenType.AcceptTerms) {
      actionRoute = this.actionConfig.acceptTerms.route;
    } else if (actionType === ActionTokenType.AcceptPrivacyPolicy) {
      actionRoute = this.actionConfig.acceptPrivacyPolicy.route;
    }

    // If no route is configured, return undefined
    if (!actionRoute) {
      return undefined;
    }

    // Build the complete URL with query parameters
    const url = new URL(`${frontendUrl}/${actionRoute}`);
    url.searchParams.set('token', token);
    url.searchParams.set('email', email.toLowerCase());

    return url.toString();
  }

  /**
   * Generate email content from action bit mask
   *
   * @param actions - Bit mask of actions
   * @param token - The token value
   * @param expiresIn - Expiration time in hours
   * @param customLink - Optional custom link to use instead of the token
   * @returns Email subject and body
   */
  private generateEmailContent(
    actions: number,
    token: string,
    expiresIn: number,
    customLink?: string,
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

    // Use custom link if provided, otherwise use the token
    const link: string = customLink ?? token;

    const body: string = `Bonjour,

Vous avez reçu ce message car vous devez effectuer une ou plusieurs actions sur votre compte.

${actionList}

Veuillez utiliser le lien suivant pour effectuer ces actions :
${link}

Ce lien est valide pendant ${expiresIn} heures.

Cordialement,
L'équipe`;

    return { subject, body };
  }

  /**
   * Send an action token email to a user (generic method)
   *
   * @param request - The create action token request
   * @param frontendUrl - Frontend URL to construct the action link (required for security)
   * @param preActions - Optional callback to execute before creating the token (e.g., set fields to false)
   * @throws NotFoundException if the user is not found (when user is provided)
   * @throws BadRequestException if neither email nor user is provided, or if frontend URL is missing
   */
  public async sendActionToken(
    request: CreateActionTokenRequest,
    frontendUrl: string,
    preActions?: (user: UserEntity) => UpdateUserRequest,
  ): Promise<void> {
    // Validate that frontend URL is provided (security requirement)
    if (!frontendUrl) {
      throw new BadRequestException(
        'Frontend URL is required for security reasons',
      );
    }
    let user: UserEntity | undefined = undefined;
    let normalizedEmail: string;

    // Get the user and email
    if (request.user) {
      // Re-fetch the user to guarantee it's a UserEntity (even if redundant)
      user = await this.userService.getById(request.user.id);
      normalizedEmail = user.email.toLowerCase();

      // Execute pre-actions if provided
      if (preActions) {
        const update: UpdateUserRequest = await preActions(user);
        user = await this.userService.update(user.id, update);
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

    // Build custom link if route is configured
    // Use user email if available, otherwise use normalizedEmail
    const emailForLink = user ? user.email : normalizedEmail;
    const customLink: string | undefined = this.buildActionLink(
      request.type,
      frontendUrl,
      token.token,
      emailForLink,
    );

    // Generate email content from actions
    const emailContent = this.generateEmailContent(
      request.type,
      token.token,
      expirationTime,
      customLink,
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
      request,
      requiredActions,
    );

    // Get the user from the token (guaranteed to be defined by the token type)
    const user: UserEntity = token.user!;
    const userUpdateRequest: UpdateUserRequest = {} as UpdateUserRequest;

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
      userUpdateRequest.password = request.password;
    }

    if (
      ActionTokenTypeUtils.hasAction(
        requiredActions,
        ActionTokenType.ValidateEmail,
      )
    ) {
      userUpdateRequest.emailValidated = true;
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
      userUpdateRequest.acceptedTerms = true;
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
      userUpdateRequest.acceptedPrivacyPolicy = true;
    }

    // Save the user
    await this.userService.update(user.id, userUpdateRequest);

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
   * @param frontendUrl - Frontend URL to construct the invitation link (required for security)
   * @returns The created action token
   * @throws BadRequestException if a user with the same email already exists or frontend URL is missing
   */
  public async sendInvitation(
    invite: InviteRequest,
    frontendUrl: string,
  ): Promise<void> {
    // Check if a user with the same email already exists
    const exists: boolean = await this.userService.exists(invite.email);
    if (exists) {
      this.logger.warn(`A user with the same email already exists`);
      throw new BadRequestException(
        'A user with the same email already exists',
      );
    }

    // Use sendActionToken without userId (actionTokenService.create will verify if a user is required)
    await this.sendActionToken(
      {
        email: invite.email,
        type: ActionTokenType.Invite,
        expiresIn: invite.expiresIn,
        roles: invite.roles ?? this.userConfig.user.defaultRoles,
      },
      frontendUrl,
    );
  }

  /**
   * Accept an invitation to join the application.
   * The user is automatically signed in after accepting the invitation.
   *
   * @param request - The accept invitation request containing the users information.
   * @returns The created user and the JWT token
   * @throws ForbiddenException if the action token is not valid
   * @throws BadRequestException if a user with the same email or username already exists
   */
  public async acceptInvitation(
    request: AcceptInvitationRequest,
  ): Promise<AuthResponse> {
    // Validate the action token
    const actionToken: ActionTokenEntity =
      await this.actionTokenService.validate(
        request,
        ActionTokenType.Invite as number,
      );

    // Create the user
    const user: UserEntity = await this.userService.create(request);

    // Revoke the action token
    await this.actionTokenService.revoke(actionToken.token);

    // Authenticate the user
    const jwtToken: JwtToken = await this.jwtService.authenticate(
      user,
      request.password,
    );

    // Log
    this.logger.debug(`User with email ${user.email} accepted invitation`);

    // Done
    return {
      jwt: jwtToken,
      user: user,
    };
  }

  /**
   * Register a new user (sign up).
   * The user has to validate his email and reconnect in order to be signed in.
   *
   * @param request - The sign up request containing the users information.
   * @returns The created user
   * @throws BadRequestException if a user with the same email or username already exists
   */
  public async signUp(request: SignUpRequest): Promise<void> {
    // User must accept the terms and privacy policy
    if (!request.acceptedTerms || !request.acceptedPrivacyPolicy) {
      throw new BadRequestException(
        'User must accept the terms and privacy policy',
      );
    }

    // Create the user
    const user: UserEntity = await this.userService.create(request);

    // Note: sendEmailValidation requires frontendUrl, but signUp doesn't have access to it
    // The application should call sendEmailValidation separately after sign-up if needed
    // For now, we'll skip sending the email validation automatically
    // await this.sendEmailValidation(user.id, frontendUrl);

    // Log
    this.logger.debug(`User with email ${user.email} signed up`);
  }

  /**
   * Sign in a user (sign in)
   *
   * @param request - The sign in request containing the users email and password.
   * @returns The authenticated user
   * @throws NotFoundException if the user is not found
   * @throws BadRequestException if the credentials are invalid
   */
  public async signIn(request: SignInRequest): Promise<AuthResponse> {
    // Search for the user
    const user: UserEntity | null = await this.userService.findByEmail(
      request.email,
    );
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    // Authenticate the user
    const token: JwtToken = await this.jwtService.authenticate(
      user,
      request.password,
    );

    // Log
    this.logger.debug(`User with email ${user.email} signed in`);

    // Done
    return {
      jwt: token,
      user: user,
    };
  }

  /**
   * Send a email validation email to a user
   *
   * @param id - The ID of the user
   * @param frontendUrl - Frontend URL to construct the validation link (required for security)
   * @throws NotFoundException if the user is not found
   * @throws BadRequestException if frontend URL is missing
   */
  public async sendEmailValidation(
    id: string,
    frontendUrl: string,
  ): Promise<void> {
    // Get the user
    const user: UserEntity = await this.userService.getById(id);

    // Create an action token and send an email to the user
    await this.sendActionToken(
      {
        type: ActionTokenType.ValidateEmail,
        user: user,
      },
      frontendUrl,
      (): UpdateUserRequest => {
        return { emailValidated: false } as UpdateUserRequest;
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
    await this.processActionToken(request, ActionTokenType.ValidateEmail);
  }

  /**
   * Send a password creation email to a user
   *
   * @param id - The ID of the user
   * @param frontendUrl - Frontend URL to construct the create password link (required for security)
   * @throws NotFoundException if the user is not found
   * @throws BadRequestException if frontend URL is missing
   */
  public async sendCreatePassword(
    id: string,
    frontendUrl: string,
  ): Promise<void> {
    const user: UserEntity = await this.userService.getById(id);
    await this.sendActionToken(
      {
        type: ActionTokenType.CreatePassword,
        user: user,
      },
      frontendUrl,
    );
  }

  /**
   * Create a user's password
   *
   * @param request - The create password request containing the new password.
   * @returns The updated user
   * @throws ForbiddenException if the action token is not valid
   */
  public async acceptCreatePassword(
    request: CreatePasswordRequest,
  ): Promise<void> {
    await this.processActionToken(request, ActionTokenType.CreatePassword);
  }

  /**
   * Send a password reset email to a user
   *
   * @param email - The email of the user
   * @param frontendUrl - Frontend URL to construct the reset password link (required for security)
   * @throws BadRequestException if frontend URL is missing
   */
  public async sendResetPassword(
    email: string,
    frontendUrl: string,
  ): Promise<void> {
    // Get the user with the given email
    const user: UserEntity | null = await this.userService.findByEmail(email);
    if (!user) {
      this.logger.warn(
        `User with email ${email} not found, cannot send reset password email`,
      );
      // Return silently if the user is not found to not leak information about the existence of the email
      return;
    }

    // Use sendActionToken to send the reset password email
    await this.sendActionToken(
      {
        type: ActionTokenType.ResetPassword,
        user: user,
      },
      frontendUrl,
    );
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
    await this.processActionToken(request, ActionTokenType.ResetPassword);
  }

  /**
   * Adds a terms acceptance action token to a user
   *
   * @param id - The ID of the user
   * @throws NotFoundException if the user is not found
   */
  public async addAcceptTerms(id: string): Promise<void> {
    const user: UserEntity = await this.userService.getById(id);
    await this.actionTokenService.create({
      type: ActionTokenType.AcceptTerms,
      user: user,
    });
  }

  /**
   * Accept the terms of service
   *
   * @param request - The accept terms request containing the new password.
   * @returns The updated user
   * @throws ForbiddenException if the action token is not valid
   */
  public async acceptTerms(request: AcceptTermsRequest): Promise<void> {
    // Validate the action token
    const token: ActionTokenEntity = await this.actionTokenService.validate(
      request,
      ActionTokenType.AcceptTerms,
    );

    // Set the accepted terms to true
    await this.userService.update(token.user!.id, {
      acceptedTerms: true,
    } as UpdateUserRequest);
  }

  /**
   * Add a privacy policy action token to a user
   *
   * @param id - The ID of the user
   * @throws NotFoundException if the user is not found
   */
  public async addAcceptPrivacyPolicy(id: string): Promise<void> {
    const user: UserEntity = await this.userService.getById(id);
    await this.actionTokenService.create({
      type: ActionTokenType.AcceptPrivacyPolicy,
      user: user,
    });
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
    // Validate the action token
    const token: ActionTokenEntity = await this.actionTokenService.validate(
      request,
      ActionTokenType.AcceptPrivacyPolicy,
    );

    // Set the accepted terms to true
    await this.userService.update(token.user!.id, {
      acceptedPrivacyPolicy: true,
    } as UpdateUserRequest);
  }

  /**
   * Sign out a user (sign out)
   *
   * @returns The updated user
   * @throws ForbiddenException if the action token is not valid
   */
  public async signOut(): Promise<void> {
    await this.jwtService.logout();
  }
}
