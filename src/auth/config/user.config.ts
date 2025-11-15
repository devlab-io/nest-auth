import { Provider } from '@nestjs/common';
import { z } from 'zod';

export interface UserConfig {
  user: {
    canSignUp: boolean;
    defaultRoles: string[];
  };
}

export const UserConfigToken: symbol = Symbol('UserConfig');

const userConfigSchema = z.object({
  USER_CAN_SIGN_UP: z.boolean().default(true),
  USER_DEFAULT_ROLES: z.array(z.string()).default([]),
});

function parseUserConfig(env: NodeJS.ProcessEnv): UserConfig {
  const config = userConfigSchema.parse(env);
  return {
    user: {
      canSignUp: config.USER_CAN_SIGN_UP,
      defaultRoles: config.USER_DEFAULT_ROLES,
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
