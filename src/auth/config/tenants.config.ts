import { config } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';
import { Provider } from '@nestjs/common';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

export interface TenantsConfig {
  tenants: {
    organisations: string[];
    establishments: string[];
  };
}

export const TenantsConfigToken: symbol = Symbol('TenantsConfig');

const tenantsConfigSchema = z.object({
  AUTH_TENANTS_ORGANISATIONS: z
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
  AUTH_TENANTS_ESTABLISHMENTS: z
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

function parseTenantsConfig(env: NodeJS.ProcessEnv): TenantsConfig {
  const config = tenantsConfigSchema.parse(env);
  return {
    tenants: {
      organisations: config.AUTH_TENANTS_ORGANISATIONS,
      establishments: config.AUTH_TENANTS_ESTABLISHMENTS,
    },
  };
}

export function provideTenantsConfig(): Provider {
  return {
    provide: TenantsConfigToken,
    useFactory: (): TenantsConfig => {
      return parseTenantsConfig(process.env);
    },
  };
}
