/**
 * Normalize a string by removing accents and keeping only lowercase letters a-z and digits 0-9
 *
 * @param str - The string to normalize
 * @returns The normalized string
 */
export function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .replace(/[^a-z0-9]/g, ''); // Keep only a-z and 0-9
}

/**
 * Capitalize the first letter of each word in a string
 *
 * @param str - The string to capitalize
 * @returns The string with first letter of each word capitalized
 */
export function capitalize(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + (word.length > 1 ? word.slice(1) : ''),
    )
    .join(' ');
}

/**
 * Extract JWT token from request (from Authorization header or cookie)
 *
 * @param request - The HTTP request
 * @param cookieName - The name of the cookie containing the token (default: 'access_token')
 * @returns The token or null if not found
 */
export function extractTokenFromRequest(
  request: any,
  cookieName: string = 'access_token',
): string | null {
  // Try to get token from Authorization header
  const authHeader: string | undefined = request.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try to get token from cookie
  const cookieToken: string | undefined = request.cookies?.[cookieName];
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

/**
 * Action Token Type Bit Mask Utilities
 */
export class ActionTokenTypeUtils {
  /**
   * Check if a bit mask contains a specific action
   *
   * @param mask - The bit mask to check
   * @param action - The action to check for
   * @returns True if the mask contains the action
   */
  static hasAction(mask: number, action: number): boolean {
    return (mask & action) === action;
  }

  /**
   * Add an action to a bit mask
   *
   * @param mask - The bit mask to modify
   * @param action - The action to add
   * @returns The new bit mask with the action added
   */
  static addAction(mask: number, action: number): number {
    return mask | action;
  }

  /**
   * Remove an action from a bit mask
   *
   * @param mask - The bit mask to modify
   * @param action - The action to remove
   * @returns The new bit mask with the action removed
   */
  static removeAction(mask: number, action: number): number {
    return mask & ~action;
  }

  /**
   * Get all actions from a bit mask as an array
   *
   * @param mask - The bit mask to parse
   * @param allActions - Object containing all possible actions (enum)
   * @returns Array of action values present in the mask
   */
  static getActionsList(
    mask: number,
    allActions: Record<string, number>,
  ): number[] {
    const actions: number[] = [];
    Object.values(allActions).forEach((action) => {
      if (typeof action === 'number' && this.hasAction(mask, action)) {
        actions.push(action);
      }
    });
    return actions;
  }

  /**
   * Check if a bit mask contains all required actions
   *
   * @param mask - The bit mask to check
   * @param requiredActions - The required actions (bit mask)
   * @returns True if the mask contains all required actions
   */
  static hasAllActions(mask: number, requiredActions: number): boolean {
    return (mask & requiredActions) === requiredActions;
  }

  /**
   * Check if a bit mask contains at least one of the required actions
   *
   * @param mask - The bit mask to check
   * @param actions - The actions to check (bit mask)
   * @returns True if the mask contains at least one of the actions
   */
  static hasAnyAction(mask: number, actions: number): boolean {
    return (mask & actions) !== 0;
  }
}
