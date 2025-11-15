import { config } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';
import { Provider } from '@nestjs/common';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

export interface JwtConfig {
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

export const JwtConfigToken: symbol = Symbol('JwtConfig');

const jwtConfigSchema = z.object({
  JWT_SECRET: z.string().default('abcdefghijklmnopqrstuvwxyz0123456789'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'Must be a valid duration (e.g., 1s, 1m, 1h, 1d)')
    .default('1h'), // 1 hour
});

function parseJwtConfig(env: NodeJS.ProcessEnv): JwtConfig {
  const config = jwtConfigSchema.parse(env);
  return {
    jwt: {
      secret: config.JWT_SECRET,
      expiresIn: config.JWT_EXPIRES_IN,
    },
  };
}

export function provideJwtConfig(): Provider {
  return {
    provide: JwtConfigToken,
    useFactory: (): JwtConfig => {
      return parseJwtConfig(process.env);
    },
  };
}
