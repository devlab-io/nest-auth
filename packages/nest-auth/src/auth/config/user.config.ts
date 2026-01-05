import { Provider } from '@nestjs/common';
import { z } from 'zod';
import { DeepPartial } from 'typeorm';

export interface UserConfig {
  user: {
    canSignUp: boolean;
    defaultRoles: string[];
    signUpRoles: string[];
  };
}

export const UserConfigToken: symbol = Symbol('UserConfig');

/**
 * Zod schema for boolean environment variables
 * Accepts:
 * - For true: "true" (case insensitive), 1, or "yes" (case insensitive)
 * - For false: "false" (case insensitive), "no" (case insensitive), or 0
 * - If undefined, uses the default value
 */
function booleanEnv(defaultValue: boolean = false) {
  return z.preprocess((val) => {
    // If undefined, return undefined (default will be applied)
    if (val === undefined || val === null || val === '') {
      return undefined;
    }
    // If already a boolean, return as is
    if (typeof val === 'boolean') {
      return val;
    }
    // If number, convert
    if (typeof val === 'number') {
      return val === 1 ? true : val === 0 ? false : defaultValue;
    }
    // If string, parse it
    if (typeof val === 'string') {
      const lower = val.toLowerCase().trim();
      if (lower === 'true' || lower === 'yes' || lower === '1') {
        return true;
      }
      if (lower === 'false' || lower === 'no' || lower === '0') {
        return false;
      }
      return defaultValue;
    }
    return defaultValue;
  }, z.boolean().default(defaultValue));
}

const userConfigSchema = z.object({
  AUTH_USER_CAN_SIGN_UP: booleanEnv(true),
  AUTH_USER_DEFAULT_ROLES: z
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
  AUTH_USER_SIGN_UP_ROLES: z
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
});

function parseUserConfig(env: NodeJS.ProcessEnv): UserConfig {
  const config = userConfigSchema.parse(env);
  return {
    user: {
      canSignUp: config.AUTH_USER_CAN_SIGN_UP,
      defaultRoles: config.AUTH_USER_DEFAULT_ROLES,
      signUpRoles: config.AUTH_USER_SIGN_UP_ROLES,
    },
  };
}

export function provideUserConfig(
  config?: DeepPartial<{ user: UserConfig['user'] }>,
): Provider {
  return {
    provide: UserConfigToken,
    useFactory: (): UserConfig => {
      // Priority: config passed > environment variable > default zod
      const envConfig = parseUserConfig(process.env);
      return {
        user: {
          canSignUp: config?.user?.canSignUp ?? envConfig.user.canSignUp,
          defaultRoles:
            config?.user?.defaultRoles ?? envConfig.user.defaultRoles,
          signUpRoles: config?.user?.signUpRoles ?? envConfig.user.signUpRoles,
        },
      };
    },
  };
}
