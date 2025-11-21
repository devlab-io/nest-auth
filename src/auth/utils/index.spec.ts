import { normalize, capitalize, ActionTypeUtils } from './index';
import { ActionType } from '../types';

describe('Utils', () => {
  describe('normalize', () => {
    it('should convert to lowercase', () => {
      expect(normalize('HELLO')).toBe('hello');
    });

    it('should remove accents', () => {
      expect(normalize('éàèùç')).toBe('eaeuc');
      expect(normalize('ÉÀÈÙÇ')).toBe('eaeuc');
    });

    it('should remove special characters', () => {
      expect(normalize('hello-world!')).toBe('helloworld');
      expect(normalize('user@example.com')).toBe('userexamplecom');
    });

    it('should keep only letters and digits', () => {
      expect(normalize('user123')).toBe('user123');
      expect(normalize('user-123_test')).toBe('user123test');
    });

    it('should handle empty string', () => {
      expect(normalize('')).toBe('');
    });

    it('should handle complex strings', () => {
      expect(normalize('Jean-Pierre')).toBe('jeanpierre');
      expect(normalize('José María')).toBe('josemaria');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter of each word', () => {
      expect(capitalize('hello world')).toBe('Hello World');
    });

    it('should handle single word', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle already capitalized words', () => {
      expect(capitalize('HELLO WORLD')).toBe('Hello World');
    });

    it('should handle mixed case', () => {
      expect(capitalize('hELLo WoRLd')).toBe('Hello World');
    });

    it('should handle multiple spaces', () => {
      expect(capitalize('hello   world')).toBe('Hello   World');
    });

    it('should handle single character', () => {
      expect(capitalize('a')).toBe('A');
    });
  });

  describe('ActionTypeUtils', () => {
    describe('hasAction', () => {
      it('should return true if action is in mask', () => {
        const mask = ActionType.Invite | ActionType.ValidateEmail;
        expect(ActionTypeUtils.hasAction(mask, ActionType.Invite)).toBe(true);
        expect(ActionTypeUtils.hasAction(mask, ActionType.ValidateEmail)).toBe(
          true,
        );
      });

      it('should return false if action is not in mask', () => {
        const mask = ActionType.Invite;
        expect(ActionTypeUtils.hasAction(mask, ActionType.ValidateEmail)).toBe(
          false,
        );
      });

      it('should return false for empty mask', () => {
        expect(ActionTypeUtils.hasAction(0, ActionType.Invite)).toBe(false);
      });
    });

    describe('addAction', () => {
      it('should add an action to the mask', () => {
        let mask = ActionType.Invite;
        mask = ActionTypeUtils.addAction(mask, ActionType.ValidateEmail);
        expect(ActionTypeUtils.hasAction(mask, ActionType.Invite)).toBe(true);
        expect(ActionTypeUtils.hasAction(mask, ActionType.ValidateEmail)).toBe(
          true,
        );
      });

      it('should not duplicate actions', () => {
        let mask = ActionType.Invite;
        mask = ActionTypeUtils.addAction(mask, ActionType.Invite);
        expect(mask).toBe(ActionType.Invite);
      });
    });

    describe('removeAction', () => {
      it('should remove an action from the mask', () => {
        let mask = ActionType.Invite | ActionType.ValidateEmail;
        mask = ActionTypeUtils.removeAction(mask, ActionType.Invite);
        expect(ActionTypeUtils.hasAction(mask, ActionType.Invite)).toBe(false);
        expect(ActionTypeUtils.hasAction(mask, ActionType.ValidateEmail)).toBe(
          true,
        );
      });

      it('should not affect mask if action is not present', () => {
        const mask = ActionType.Invite;
        const result = ActionTypeUtils.removeAction(
          mask,
          ActionType.ValidateEmail,
        );
        expect(result).toBe(mask);
      });
    });

    describe('getActionsList', () => {
      it('should return array of actions in mask', () => {
        const mask = ActionType.Invite | ActionType.ValidateEmail;
        const actions = ActionTypeUtils.getActionsList(
          mask,
          ActionType as unknown as Record<string, number>,
        );
        expect(actions).toContain(ActionType.Invite);
        expect(actions).toContain(ActionType.ValidateEmail);
        expect(actions.length).toBe(2);
      });

      it('should return empty array for empty mask', () => {
        const actions = ActionTypeUtils.getActionsList(
          0,
          ActionType as unknown as Record<string, number>,
        );
        expect(actions).toEqual([]);
      });
    });

    describe('hasAllActions', () => {
      it('should return true if mask contains all required actions', () => {
        const mask =
          ActionType.Invite | ActionType.ValidateEmail | ActionType.AcceptTerms;
        const required = ActionType.Invite | ActionType.ValidateEmail;
        expect(ActionTypeUtils.hasAllActions(mask, required)).toBe(true);
      });

      it('should return false if mask is missing any required action', () => {
        const mask = ActionType.Invite;
        const required = ActionType.Invite | ActionType.ValidateEmail;
        expect(ActionTypeUtils.hasAllActions(mask, required)).toBe(false);
      });

      it('should return true for empty required actions', () => {
        const mask = ActionType.Invite;
        expect(ActionTypeUtils.hasAllActions(mask, 0)).toBe(true);
      });
    });

    describe('hasAnyAction', () => {
      it('should return true if mask contains at least one action', () => {
        const mask = ActionType.Invite | ActionType.ValidateEmail;
        const actions = ActionType.Invite | ActionType.AcceptTerms;
        expect(ActionTypeUtils.hasAnyAction(mask, actions)).toBe(true);
      });

      it('should return false if mask contains none of the actions', () => {
        const mask = ActionType.Invite;
        const actions = ActionType.ValidateEmail | ActionType.AcceptTerms;
        expect(ActionTypeUtils.hasAnyAction(mask, actions)).toBe(false);
      });

      it('should return false for empty mask', () => {
        const actions = ActionType.Invite;
        expect(ActionTypeUtils.hasAnyAction(0, actions)).toBe(false);
      });
    });
  });
});
