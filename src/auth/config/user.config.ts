import { Provider } from '@nestjs/common';
import { z } from 'zod';

export interface UserConfig {
  user: {
    canSignUp: boolean;
    defaultRoles: string[];
    actions: {
      invite: number; // hours
      validateEmail: number; // hours
      acceptTerms: number; // hours
      acceptPrivacyPolicy: number; // hours
      createPassword: number; // hours
      resetPassword: number; // hours
      changeEmail: number; // hours
    };
  };
}

export const UserConfigToken: symbol = Symbol('UserConfig');

const userConfigSchema = z.object({
  USER_CAN_SIGN_UP: z.boolean().default(true),
  USER_DEFAULT_ROLES: z
    .union([
      z.string().transform((val) => {
        // Split by comma and trim each role, filter out empty strings
        if (!val || val.trim() === '') {
          return [];
        }
        return val
          .split(',')
          .map((role) => role.trim())
          .filter((role) => role.length > 0);
      }),
      z.array(z.string()),
    ])
    .default([]),
  USER_ACTION_INVITE: z.coerce.number().default(24),
  USER_ACTION_VALIDATE_EMAIL: z.coerce.number().default(24),
  USER_ACTION_ACCEPT_TERMS: z.coerce.number().default(24),
  USER_ACTION_ACCEPT_PRIVACY_POLICY: z.coerce.number().default(24),
  USER_ACTION_CREATE_PASSWORD: z.coerce.number().default(24),
  USER_ACTION_RESET_PASSWORD: z.coerce.number().default(24),
  USER_ACTION_CHANGE_EMAIL: z.coerce.number().default(24),
});

function parseUserConfig(env: NodeJS.ProcessEnv): UserConfig {
  const config = userConfigSchema.parse(env);
  return {
    user: {
      canSignUp: config.USER_CAN_SIGN_UP,
      defaultRoles: config.USER_DEFAULT_ROLES,
      actions: {
        invite: config.USER_ACTION_INVITE,
        validateEmail: config.USER_ACTION_VALIDATE_EMAIL,
        acceptTerms: config.USER_ACTION_ACCEPT_TERMS,
        acceptPrivacyPolicy: config.USER_ACTION_ACCEPT_PRIVACY_POLICY,
        createPassword: config.USER_ACTION_CREATE_PASSWORD,
        resetPassword: config.USER_ACTION_RESET_PASSWORD,
        changeEmail: config.USER_ACTION_CHANGE_EMAIL,
      },
    },
  };
}

export function provideUserConfig(): Provider {
  return {
    provide: UserConfigToken,
    useFactory: (): UserConfig => {
      return parseUserConfig(process.env);
    },
  };
}
