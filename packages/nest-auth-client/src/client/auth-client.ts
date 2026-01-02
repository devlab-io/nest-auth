import { UserAccount } from '@devlab-io/nest-auth-types';
import { AuthState, AuthStateConfig } from '../state/auth.state';
import {
  AuthService,
  ClaimService,
  EstablishmentService,
  OrganisationService,
  RoleService,
  SessionService,
  UserAccountService,
  UserService,
} from '../services';

/**
 * Initialize the authentication
 */
export class AuthClient {
  /**
   * Initialize the authentication client
   *
   * @param config - Configuration for the auth client
   * @returns The user account if a valid session is found, null otherwise
   */
  public static async initialize(
    config: AuthStateConfig,
  ): Promise<UserAccount | null> {
    return await AuthState.initialize(config);
  }

  /**
   * Get the auth service
   */
  public static get auth(): AuthService {
    return new AuthService();
  }

  /**
   * Get the claim service
   */
  public static get claims(): ClaimService {
    return new ClaimService();
  }

  /**
   * Get the establishment service
   */
  public static get establishments(): EstablishmentService {
    return new EstablishmentService();
  }

  /**
   * Get the organisation service
   */
  public static get organisations(): OrganisationService {
    return new OrganisationService();
  }

  /**
   * Get the role service
   */
  public static get roles(): RoleService {
    return new RoleService();
  }

  /**
   * Get the session service
   */
  public static get sessions(): SessionService {
    return new SessionService();
  }

  /**
   * Get the user account service
   */
  public static get userAccounts(): UserAccountService {
    return new UserAccountService();
  }

  /**
   * Get the user service
   */
  public static get users(): UserService {
    return new UserService();
  }
}
