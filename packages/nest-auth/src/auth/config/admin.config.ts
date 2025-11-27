import { config } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';
import { Provider } from '@nestjs/common';
import { DeepPartial } from 'typeorm';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

export interface AdminConfig {
  admin: {
    email: string;
    password: string;
  };
}

export const AdminConfigToken: symbol = Symbol('AdminConfig');

const adminConfigSchema = z.object({
  AUTH_ADMIN_EMAIL: z.string().default('admin@devlab.io'),
  AUTH_ADMIN_PASSWORD: z.string().default('ChangeMe1234*'),
});

function parseAdminConfig(env: NodeJS.ProcessEnv): AdminConfig {
  const config = adminConfigSchema.parse(env);
  return {
    admin: {
      email: config.AUTH_ADMIN_EMAIL,
      password: config.AUTH_ADMIN_PASSWORD,
    },
  };
}

export function provideAdminConfig(
  config?: DeepPartial<{ admin: AdminConfig['admin'] }>,
): Provider {
  return {
    provide: AdminConfigToken,
    useFactory: (): AdminConfig => {
      // Priority: config passed > environment variable > default zod
      const envConfig = parseAdminConfig(process.env);
      return {
        admin: {
          email: config?.admin?.email ?? envConfig.admin.email,
          password: config?.admin?.password ?? envConfig.admin.password,
        },
      };
    },
  };
}
