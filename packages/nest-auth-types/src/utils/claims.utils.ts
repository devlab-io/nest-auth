import { Claim, ClaimAction, ClaimLike, ClaimScope } from '../types';

/**
 * Hidden implementation of the Claim interface.
 */
class ClaimImpl implements Claim {
  public readonly action: ClaimAction;
  public readonly scope: ClaimScope;
  public readonly resource: string;

  public constructor(action: ClaimAction, scope: ClaimScope, resource: string) {
    this.action = action;
    this.scope = scope;
    this.resource = resource;
  }

  public toString(): string {
    return `${this.action}:${this.scope}:${this.resource}`;
  }
}

/**
 * Instantiate a new Claim object with the given action, scope, and resource.
 *
 * @param action Instantiate a new Claim object with the given action, scope, and resource.
 * @param scope Instantiate a new Claim object with the given action, scope, and resource.
 * @param resource Instantiate a new Claim object with the given action, scope, and resource.
 * @returns A new Claim object with the given action, scope, and resource.
 * @example
 * ```typescript
 * const claim = claim(ClaimAction.READ, ClaimScope.ANY, 'users');
 * // Returns: { action: ClaimAction.READ, scope: ClaimScope.ANY, resource: 'users' }
 * ```
 */
export function claim(
  action: ClaimAction,
  scope: ClaimScope,
  resource: string,
): Claim {
  return new ClaimImpl(action, scope, resource);
}

/**
 * Utility class for working with claims.
 *
 * @example
 * ```typescript
 * const claim = ClaimsUtils.parse('read:any:users');
 * // Returns: { action: ClaimAction.READ, scope: ClaimScope.ANY, resource: 'users' }
 * const serialized = ClaimsUtils.serialize(claim);
 * // Returns: "read:any:users"
 * ```
 */
export class ClaimsUtils {
  private constructor() {
    // do not instantiate
  }

  /**
   * Parse a claim string into a Claim object.
   *
   * The claim string must be in the format: "action:scope:resource"
   * where:
   * - action must be one of: 'admin', 'create', 'read', 'update', 'enable', 'disable', 'execute', 'delete'
   * - scope must be one of: 'admin', 'any', 'organisation', 'establishment', 'own'
   * - resource is any string identifier for the resource
   *
   * @param claim - The claim string to parse (e.g., "read:any:users")
   * @returns A Claim object with the parsed action, scope, and resource
   * @throws {Error} If the claim format is invalid (missing parts)
   * @throws {Error} If the action is not a valid ClaimAction
   * @throws {Error} If the scope is not a valid ClaimScope
   *
   * @example
   * ```typescript
   * const claim = parse('read:any:users');
   * // Returns: { action: ClaimAction.READ, scope: ClaimScope.ANY, resource: 'users' }
   * ```
   */
  public static parse(claim: ClaimLike): Claim {
    if (typeof claim === 'string') {
      const [action, scope, resource] = claim.split(':');
      if (!action || !scope || !resource) {
        throw new Error('Invalid claim format');
      }
      if (!Object.values(ClaimAction).includes(action as ClaimAction)) {
        throw new Error('Invalid action');
      }
      if (!Object.values(ClaimScope).includes(scope as ClaimScope)) {
        throw new Error('Invalid scope');
      }
      return new ClaimImpl(
        action as ClaimAction,
        scope as ClaimScope,
        resource,
      );
    }
    if (Array.isArray(claim)) {
      const [action, scope, resource] = claim;
      if (!Object.values(ClaimAction).includes(action as ClaimAction)) {
        throw new Error('Invalid action');
      }
      if (!Object.values(ClaimScope).includes(scope as ClaimScope)) {
        throw new Error('Invalid scope');
      }
      return new ClaimImpl(
        action as ClaimAction,
        scope as ClaimScope,
        resource,
      );
    }
    return new ClaimImpl(claim.action, claim.scope, claim.resource);
  }

  /**
   * Serialize a Claim object to a string.
   *
   * @param claim - The Claim object to serialize
   * @returns The serialized claim string
   * @throws {Error} If the claim is not a valid Claim object
   * @example
   * ```typescript
   * const claim = claim(ClaimAction.READ, ClaimScope.ANY, 'users');
   * const serialized = serialize(claim);
   * // Returns: "read:any:users"
   * ```
   */
  public static serialize(claim: ClaimLike): string {
    return ClaimsUtils.parse(claim).toString();
  }
}
