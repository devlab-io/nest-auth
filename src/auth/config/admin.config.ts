import { config } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';
import { Provider } from '@nestjs/common';

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
  ADMIN_EMAIL: z.string().default('admin@devlab.io'),
  ADMIN_PASSWORD: z.string().default('ChangeMe1234*'),
});

function parseAdminConfig(env: NodeJS.ProcessEnv): AdminConfig {
  const config = adminConfigSchema.parse(env);
  return {
    admin: {
      email: config.ADMIN_EMAIL,
      password: config.ADMIN_PASSWORD,
    },
  };
}

export function provideAdminConfig(): Provider {
  return {
    provide: AdminConfigToken,
    useFactory: (): AdminConfig => {
      return parseAdminConfig(process.env);
    },
  };
}
