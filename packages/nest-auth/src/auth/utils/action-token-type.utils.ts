/**
 * Action Token Type Bit Mask Utilities
 */
export class ActionTypeUtils {
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
