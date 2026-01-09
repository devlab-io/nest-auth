import { Injectable, ForbiddenException, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import {
  AuthScope,
  ClaimAction,
  ClaimScope,
  UserAccount,
} from '@devlab-io/nest-auth-types';

/**
 * Service for managing claim scopes and constraints
 * Determines the most permissive scope for a given action/resource
 * and provides constraints to apply to queries based on the connected account.
 *
 * Uses AsyncLocalStorage for request-scoped storage and also stores in request object as fallback.
 */
@Injectable({ scope: Scope.REQUEST })
export class ScopeService {
  private static readonly storage = new AsyncLocalStorage<AuthScope>();

  public constructor(@Inject(REQUEST) private readonly request: Request) {}

  /**
   * Run a callback within a scope context
   */
  public runWithScope<T>(scope: AuthScope, callback: () => T): T {
    return ScopeService.storage.run(scope, callback);
  }

  /**
   * Get the most permissive scope from user's claims for a given action and resource
   *
   * @param userAccount - The user account with roles and claims
   * @param action - The action to check
   * @param resource - The resource to check
   * @returns The most permissive scope or null if no matching claim
   */
  public getMostPermissiveScope(
    userAccount: UserAccount,
    action: ClaimAction,
    resource: string,
  ): ClaimScope | null {
    const scopes: Set<ClaimScope> = new Set<ClaimScope>();

    // Collect all scopes from user's roles that match the action and resource
    for (const role of userAccount.roles) {
      for (const claim of role.claims) {
        if (claim.action === action && claim.resource === resource) {
          scopes.add(claim.scope);
        }
      }
    }

    if (scopes.size === 0) {
      // This should not happen if the guard has properly verified the user has the required claims
      // If it does, it indicates a data inconsistency or logic error
      throw new ForbiddenException(
        `No matching scope found for action ${action} on resource ${resource}. User may not have the required claims.`,
      );
    }

    // Return the most permissive scope
    // Priority: ANY > ORGANISATION > ESTABLISHMENT > OWN
    if (scopes.has(ClaimScope.ANY)) {
      return ClaimScope.ANY;
    }
    if (scopes.has(ClaimScope.ORGANISATION)) {
      return ClaimScope.ORGANISATION;
    }
    if (scopes.has(ClaimScope.ESTABLISHMENT)) {
      return ClaimScope.ESTABLISHMENT;
    }
    if (scopes.has(ClaimScope.OWN)) {
      return ClaimScope.OWN;
    }

    // Fallback: if we have matching scopes but none are valid, this is an error
    // This should not happen in normal circumstances, but if it does, deny access
    throw new ForbiddenException(
      `Invalid scope found for action ${action} on resource ${resource}`,
    );
  }

  /**
   * Get scope constraints for a given scope based on the connected account.
   * The scope is determined by the organisation/establishment of the connected account only.
   *
   * @param userAccount - The connected user account
   * @param action - The action
   * @param resource - The resource
   * @param scope - The scope to get constraints for
   * @returns The scope constraints
   */
  public getAuthScope(
    userAccount: UserAccount,
    action: ClaimAction,
    resource: string,
    scope: ClaimScope,
  ): AuthScope {
    const baseScope: AuthScope = {
      action,
      scope,
      resource,
    };

    if (scope === ClaimScope.ANY) {
      return baseScope;
    }

    if (scope === ClaimScope.OWN) {
      return { ...baseScope, userId: userAccount.user.id };
    }

    if (scope === ClaimScope.ORGANISATION) {
      // Use the organisation of the connected account
      return {
        ...baseScope,
        organisationId: userAccount.organisation?.id,
      };
    }

    if (scope === ClaimScope.ESTABLISHMENT) {
      // Use the establishment of the connected account
      return {
        ...baseScope,
        establishmentId: userAccount.establishment?.id,
      };
    }

    return baseScope;
  }

  /**
   * Calculate and store scope constraints for the current request
   * This method determines the most permissive scope and stores the constraints
   * in AsyncLocalStorage for use by services.
   *
   * @param userAccount - The connected user account
   * @param action - The action
   * @param resource - The resource
   * @returns The calculated auth scope or null
   */
  public calculateAndStoreScope(
    userAccount: UserAccount,
    action: ClaimAction,
    resource: string,
  ): AuthScope | null {
    const mostPermissiveScope: ClaimScope | null = this.getMostPermissiveScope(
      userAccount,
      action,
      resource,
    );

    if (!mostPermissiveScope) {
      return null;
    }

    const authScope: AuthScope = this.getAuthScope(
      userAccount,
      action,
      resource,
      mostPermissiveScope,
    );

    // Store in AsyncLocalStorage
    ScopeService.storage.enterWith(authScope);

    return authScope;
  }

  /**
   * Get scope constraints from current context
   * Tries AsyncLocalStorage first, then falls back to request object
   *
   * @returns The scope constraints or null
   */
  public getScopeFromRequest(): AuthScope | null {
    // Try AsyncLocalStorage first
    const scopeFromStorage = ScopeService.storage.getStore();
    if (scopeFromStorage) {
      return scopeFromStorage;
    }

    // Fallback to request object (stored by AuthGuard)
    const scopeFromRequest = (this.request as any).authScope;
    if (scopeFromRequest) {
      return scopeFromRequest;
    }

    return null;
  }
}
