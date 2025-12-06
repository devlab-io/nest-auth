import { ClaimAction, ClaimScope } from './claim.types';

/**
 * Scope constraints that define what resources a user can access
 * based on their claim scopes and the account they are connected with.
 */
export interface AuthScope {
  /**
   * The action for which this scope applies
   */
  action: ClaimAction;

  /**
   * The most permissive scope for this action/resource
   */
  scope: ClaimScope;

  /**
   * The resource for which this scope applies
   */
  resource: string;

  /**
   * Organisation ID the user can access (for ORGANISATION scope)
   * Based on the organisation of the connected account
   */
  organisationId?: string;

  /**
   * Establishment ID the user can access (for ESTABLISHMENT scope)
   * Based on the establishment of the connected account
   */
  establishmentId?: string;

  /**
   * User ID the user can access (for OWN scope)
   */
  userId?: string;
}
