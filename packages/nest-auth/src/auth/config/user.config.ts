import { Provider } from '@nestjs/common';
import { z } from 'zod';
import { DeepPartial } from 'typeorm';

export interface UserConfig {
  user: {
    canSignUp: boolean;
    defaultRoles: string[];
  };
}

export const UserConfigToken: symbol = Symbol('UserConfig');

const userConfigSchema = z.object({
  AUTH_USER_CAN_SIGN_UP: z.boolean().default(true),
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
});

function parseUserConfig(env: NodeJS.ProcessEnv): UserConfig {
  const config = userConfigSchema.parse(env);
  return {
    user: {
      canSignUp: config.AUTH_USER_CAN_SIGN_UP,
      defaultRoles: config.AUTH_USER_DEFAULT_ROLES,
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
        },
      };
    },
  };
}
