import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ActionEntity, UserEntity } from '../entities';
import {
  AcceptInvitationRequest,
  AcceptPrivacyPolicyRequest,
  AcceptTermsRequest,
  ActionType,
  AnyActionRequest,
  AuthResponse,
  CreateActionRequest,
  ChangePasswordRequest,
  InviteRequest,
  JwtToken,
  ResetPasswordRequest,
  SignInRequest,
  SignUpRequest,
  UpdateUserRequest,
  ValidateEmailRequest,
  Organisation,
  Establishment,
  UserAccount,
} from '@devlab-io/nest-auth-types';
import { UserConfig, UserConfigToken } from '../config/user.config';
import { ActionConfig, ActionConfigToken } from '../config/action.config';
import { ActionService } from './action.service';
import { UserAccountService } from './user-account.service';
import { ActionTypeUtils } from '../utils';
import { JwtService } from './jwt.service';
import { NotificationService } from './notification.service';
import { UserAccountDto } from '../dtos';
import { UserService, UserServiceToken } from './user.service';
import {
  OrganisationService,
  OrganisationServiceToken,
} from './organisation.service';
import {
  EstablishmentService,
  EstablishmentServiceToken,
} from './establishment.service';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  public constructor(
    @Inject(UserConfigToken) private readonly userConfig: UserConfig,
    @Inject(ActionConfigToken) private readonly actionConfig: ActionConfig,
    private readonly actionService: ActionService,
    @Inject(UserServiceToken) private readonly userService: UserService,
    private readonly userAccountService: UserAccountService,
    @Inject(OrganisationServiceToken)
    private readonly organisationService: OrganisationService,
    @Inject(EstablishmentServiceToken)
    private readonly establishmentService: EstablishmentService,
    private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
  ) {}

  public async getAccount(): Promise<UserAccountDto | null> {
    return await this.jwtService.getAuthenticatedUserAccount();
  }

  /**
   * Get the maximum expiration time for a set of actions
   *
   * @param actions - Bit mask of actions
   * @returns The maximum expiration time in hours
   */
  private getMaxExpirationTime(actions: number): number {
    let maxExpiration: number = 0;

    if (ActionTypeUtils.hasAction(actions, ActionType.Invite)) {
      maxExpiration = Math.max(
        maxExpiration,
        this.actionConfig.invite.validity,
      );
    }
    if (ActionTypeUtils.hasAction(actions, ActionType.ValidateEmail)) {
      maxExpiration = Math.max(
        maxExpiration,
        this.actionConfig.validateEmail.validity,
      );
    }
    if (ActionTypeUtils.hasAction(actions, ActionType.AcceptTerms)) {
      maxExpiration = Math.max(
        maxExpiration,
        this.actionConfig.acceptTerms.validity,
      );
    }
    if (ActionTypeUtils.hasAction(actions, ActionType.AcceptPrivacyPolicy)) {
      maxExpiration = Math.max(
        maxExpiration,
        this.actionConfig.acceptPrivacyPolicy.validity,
      );
    }
    if (ActionTypeUtils.hasAction(actions, ActionType.ChangePassword)) {
      maxExpiration = Math.max(
        maxExpiration,
        this.actionConfig.changePassword.validity,
      );
    }
    if (ActionTypeUtils.hasAction(actions, ActionType.ResetPassword)) {
      maxExpiration = Math.max(
        maxExpiration,
        this.actionConfig.resetPassword.validity,
      );
    }
    if (ActionTypeUtils.hasAction(actions, ActionType.ChangeEmail)) {
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
   * Send an action token email to a user (generic method)
   *
   * @param request - The create action token request
   * @param frontendUrl - Frontend URL to construct the action link (required for security)
   * @param preActions - Optional callback to execute before creating the token (e.g., set fields to false)
   * @throws NotFoundException if the user is not found (when user is provided)
   * @throws BadRequestException if neither email nor user is provided, or if frontend URL is missing
   */
  public async sendActionToken(
    request: CreateActionRequest,
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

    // Create the action token (ActionService.create will verify if a user is required)
    const token: ActionEntity = await this.actionService.create({
      type: request.type,
      email: normalizedEmail,
      user: user,
      roles: request.roles,
      expiresIn: expirationTime,
      organisationId: request.organisationId,
      establishmentId: request.establishmentId,
    });

    // Send the email using NotificationService
    await this.notificationService.sendActionTokenEmail(
      normalizedEmail,
      token,
      frontendUrl,
      expirationTime,
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
    const token: ActionEntity = await this.actionService.validate(
      request,
      requiredActions,
    );

    // Get the user from the token (guaranteed to be defined by the token type)
    const user: UserEntity = token.user!;
    const userUpdateRequest: UpdateUserRequest = {} as UpdateUserRequest;

    // Process each action in the bit mask
    if (
      ActionTypeUtils.hasAnyAction(
        requiredActions,
        ActionType.ChangePassword | ActionType.ResetPassword,
      )
    ) {
      if (!('newPassword' in request) || !request.newPassword) {
        throw new BadRequestException(
          'New password is required for this action',
        );
      }
      // Use CredentialService to set password credential
      await this.userService.addPasswordCredential(
        user.id,
        request.newPassword,
      );
    }

    if (ActionTypeUtils.hasAction(requiredActions, ActionType.ValidateEmail)) {
      userUpdateRequest.emailValidated = true;
    }

    if (ActionTypeUtils.hasAction(requiredActions, ActionType.AcceptTerms)) {
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
      ActionTypeUtils.hasAction(requiredActions, ActionType.AcceptPrivacyPolicy)
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

    // Save the user (only if there are updates other than password)
    if (Object.keys(userUpdateRequest).length > 0) {
      await this.userService.update(user.id, userUpdateRequest);
    }

    // Revoke the action token
    await this.actionService.revoke(request.token);

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

    // Check organisation is provided (either in invite or in config)
    const organisationName =
      invite.organisation ?? this.actionConfig.invite.organisation;
    let organisation: Organisation | null = null;
    let organisationId: string | undefined;

    if (organisationName) {
      // findByName applies scope filters automatically - will return null if out of scope
      organisation =
        await this.organisationService.findByName(organisationName);
      if (!organisation) {
        throw new BadRequestException(
          `Organisation ${organisationName} not found`,
        );
      }
      organisationId = organisation.id;
    }

    // Check establishment is provided (either in invite or in config)
    const establishmentName =
      invite.establishment ?? this.actionConfig.invite.establishment;
    let establishment: Establishment | null = null;
    let establishmentId: string | undefined;

    if (establishmentName) {
      if (!organisation) {
        throw new BadRequestException(
          'Establishment cannot be specified without an organisation',
        );
      }

      // findByNameAndOrganisation applies scope filters automatically - will return null if out of scope
      establishment = await this.establishmentService.findByNameAndOrganisation(
        establishmentName,
        organisation.id,
      );
      if (!establishment) {
        const message: string = `Establishment ${establishmentName} not found for organisation ${organisation.name}`;
        this.logger.warn(message);
        throw new BadRequestException(message);
      }
      establishmentId = establishment.id;
    }

    // Use sendActionToken with organisationId and establishmentId (optional)
    await this.sendActionToken(
      {
        email: invite.email,
        type: ActionType.Invite,
        expiresIn: invite.expiresIn,
        roles: invite.roles ?? this.userConfig.user.defaultRoles,
        organisationId,
        establishmentId,
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
    const actionToken: ActionEntity = await this.actionService.validate(
      request,
      ActionType.Invite as number,
    );

    // Extract password from credentials if provided
    const passwordCredential = request.credentials?.find(
      (c) => c.type === 'password' && c.password,
    );
    const password = passwordCredential?.password;

    // Create the user (with credentials if provided)
    const createUserRequest: SignUpRequest = {
      ...request,
      credentials: request.credentials,
    };
    const user: UserEntity = await this.userService.create(createUserRequest);

    // Create UserAccount for the user using organisation and establishment from action token (if provided)
    const userAccount = await this.userAccountService.create({
      userId: user.id,
      organisationId: actionToken.organisationId,
      establishmentId: actionToken.establishmentId,
      roles: actionToken.roles?.map((role) => role.name) ?? [],
    });

    // Revoke the action token
    await this.actionService.revoke(actionToken.token);

    // Authenticate using UserAccount (password is required for invitation acceptance)
    if (!password) {
      throw new BadRequestException(
        'Password is required to accept invitation',
      );
    }

    const jwtToken: JwtToken = await this.jwtService.authenticate(
      userAccount,
      password,
    );

    // Log
    this.logger.debug(`User with email ${user.email} accepted invitation`);

    // Done
    return {
      jwt: jwtToken,
      userAccount: userAccount,
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

    // Find user accounts for this user
    const accounts = await this.userAccountService.search(
      { userId: user.id },
      1,
      1,
    );

    if (accounts.contents.length === 0) {
      throw new BadRequestException(
        'No user account found for this user. Please contact an administrator.',
      );
    }

    // Use the first user account (in a real scenario, you might want to choose based on context)
    const userAccount: UserAccount = accounts.contents[0];

    // Authenticate using UserAccount
    const token: JwtToken = await this.jwtService.authenticate(
      userAccount,
      request.password,
    );

    // Log
    this.logger.debug(`User with email ${user.email} signed in`);

    // Done
    return {
      jwt: token,
      userAccount: userAccount,
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
        type: ActionType.ValidateEmail,
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
    await this.processActionToken(request, ActionType.ValidateEmail);
  }

  /**
   * Send a password change email to a user
   *
   * @param id - The ID of the user
   * @param frontendUrl - Frontend URL to construct the change password link (required for security)
   * @throws NotFoundException if the user is not found
   * @throws BadRequestException if frontend URL is missing
   */
  public async sendChangePassword(
    id: string,
    frontendUrl: string,
  ): Promise<void> {
    const user: UserEntity = await this.userService.getById(id);
    await this.sendActionToken(
      {
        type: ActionType.ChangePassword,
        user: user,
      },
      frontendUrl,
    );
  }

  /**
   * Change a user's password
   *
   * @param request - The create password request containing the new password.
   * @returns The updated user
   * @throws ForbiddenException if the action token is not valid
   */
  public async acceptChangePassword(
    request: ChangePasswordRequest,
  ): Promise<void> {
    await this.processActionToken(request, ActionType.ChangePassword);
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
        type: ActionType.ResetPassword,
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
    await this.processActionToken(request, ActionType.ResetPassword);
  }

  /**
   * Adds a terms acceptance action token to a user
   *
   * @param id - The ID of the user
   * @throws NotFoundException if the user is not found
   */
  public async addAcceptTerms(id: string): Promise<void> {
    const user: UserEntity = await this.userService.getById(id);
    await this.actionService.create({
      type: ActionType.AcceptTerms,
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
    const token: ActionEntity = await this.actionService.validate(
      request,
      ActionType.AcceptTerms,
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
    await this.actionService.create({
      type: ActionType.AcceptPrivacyPolicy,
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
    const token: ActionEntity = await this.actionService.validate(
      request,
      ActionType.AcceptPrivacyPolicy,
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
