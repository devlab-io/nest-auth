import { normalize, capitalize, ActionTokenTypeUtils } from './index';
import { ActionTokenType } from '../types';

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

  describe('ActionTokenTypeUtils', () => {
    describe('hasAction', () => {
      it('should return true if action is in mask', () => {
        const mask = ActionTokenType.Invite | ActionTokenType.ValidateEmail;
        expect(
          ActionTokenTypeUtils.hasAction(mask, ActionTokenType.Invite),
        ).toBe(true);
        expect(
          ActionTokenTypeUtils.hasAction(mask, ActionTokenType.ValidateEmail),
        ).toBe(true);
      });

      it('should return false if action is not in mask', () => {
        const mask = ActionTokenType.Invite;
        expect(
          ActionTokenTypeUtils.hasAction(mask, ActionTokenType.ValidateEmail),
        ).toBe(false);
      });

      it('should return false for empty mask', () => {
        expect(ActionTokenTypeUtils.hasAction(0, ActionTokenType.Invite)).toBe(
          false,
        );
      });
    });

    describe('addAction', () => {
      it('should add an action to the mask', () => {
        let mask = ActionTokenType.Invite;
        mask = ActionTokenTypeUtils.addAction(
          mask,
          ActionTokenType.ValidateEmail,
        );
        expect(
          ActionTokenTypeUtils.hasAction(mask, ActionTokenType.Invite),
        ).toBe(true);
        expect(
          ActionTokenTypeUtils.hasAction(mask, ActionTokenType.ValidateEmail),
        ).toBe(true);
      });

      it('should not duplicate actions', () => {
        let mask = ActionTokenType.Invite;
        mask = ActionTokenTypeUtils.addAction(mask, ActionTokenType.Invite);
        expect(mask).toBe(ActionTokenType.Invite);
      });
    });

    describe('removeAction', () => {
      it('should remove an action from the mask', () => {
        let mask = ActionTokenType.Invite | ActionTokenType.ValidateEmail;
        mask = ActionTokenTypeUtils.removeAction(mask, ActionTokenType.Invite);
        expect(
          ActionTokenTypeUtils.hasAction(mask, ActionTokenType.Invite),
        ).toBe(false);
        expect(
          ActionTokenTypeUtils.hasAction(mask, ActionTokenType.ValidateEmail),
        ).toBe(true);
      });

      it('should not affect mask if action is not present', () => {
        const mask = ActionTokenType.Invite;
        const result = ActionTokenTypeUtils.removeAction(
          mask,
          ActionTokenType.ValidateEmail,
        );
        expect(result).toBe(mask);
      });
    });

    describe('getActionsList', () => {
      it('should return array of actions in mask', () => {
        const mask = ActionTokenType.Invite | ActionTokenType.ValidateEmail;
        const actions = ActionTokenTypeUtils.getActionsList(
          mask,
          ActionTokenType as unknown as Record<string, number>,
        );
        expect(actions).toContain(ActionTokenType.Invite);
        expect(actions).toContain(ActionTokenType.ValidateEmail);
        expect(actions.length).toBe(2);
      });

      it('should return empty array for empty mask', () => {
        const actions = ActionTokenTypeUtils.getActionsList(
          0,
          ActionTokenType as unknown as Record<string, number>,
        );
        expect(actions).toEqual([]);
      });
    });

    describe('hasAllActions', () => {
      it('should return true if mask contains all required actions', () => {
        const mask =
          ActionTokenType.Invite |
          ActionTokenType.ValidateEmail |
          ActionTokenType.AcceptTerms;
        const required = ActionTokenType.Invite | ActionTokenType.ValidateEmail;
        expect(ActionTokenTypeUtils.hasAllActions(mask, required)).toBe(true);
      });

      it('should return false if mask is missing any required action', () => {
        const mask = ActionTokenType.Invite;
        const required = ActionTokenType.Invite | ActionTokenType.ValidateEmail;
        expect(ActionTokenTypeUtils.hasAllActions(mask, required)).toBe(false);
      });

      it('should return true for empty required actions', () => {
        const mask = ActionTokenType.Invite;
        expect(ActionTokenTypeUtils.hasAllActions(mask, 0)).toBe(true);
      });
    });

    describe('hasAnyAction', () => {
      it('should return true if mask contains at least one action', () => {
        const mask = ActionTokenType.Invite | ActionTokenType.ValidateEmail;
        const actions = ActionTokenType.Invite | ActionTokenType.AcceptTerms;
        expect(ActionTokenTypeUtils.hasAnyAction(mask, actions)).toBe(true);
      });

      it('should return false if mask contains none of the actions', () => {
        const mask = ActionTokenType.Invite;
        const actions =
          ActionTokenType.ValidateEmail | ActionTokenType.AcceptTerms;
        expect(ActionTokenTypeUtils.hasAnyAction(mask, actions)).toBe(false);
      });

      it('should return false for empty mask', () => {
        const actions = ActionTokenType.Invite;
        expect(ActionTokenTypeUtils.hasAnyAction(0, actions)).toBe(false);
      });
    });
  });
});
