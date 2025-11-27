import { config } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';
import { Provider } from '@nestjs/common';
import { DeepPartial } from 'typeorm';
import { parseExpiresIn } from '../utils';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

export interface JwtConfig {
  jwt: {
    secret: string;
    expiresIn: number;
  };
}

export const JwtConfigToken: symbol = Symbol('JwtConfig');

const jwtConfigSchema = z.object({
  AUTH_JWT_SECRET: z.string().default('abcdefghijklmnopqrstuvwxyz0123456789'),
  AUTH_JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'Must be a valid duration (e.g., 1s, 1m, 1h, 1d)')
    .default('1h') // 1 hour
    .transform((val): number => parseExpiresIn(val)),
});

function parseJwtConfig(env: NodeJS.ProcessEnv): JwtConfig {
  const config = jwtConfigSchema.parse(env);
  return {
    jwt: {
      secret: config.AUTH_JWT_SECRET,
      expiresIn: config.AUTH_JWT_EXPIRES_IN,
    },
  };
}

export function provideJwtConfig(
  config?: DeepPartial<{ jwt: JwtConfig['jwt'] }>,
): Provider {
  return {
    provide: JwtConfigToken,
    useFactory: (): JwtConfig => {
      // Priority: config passed > environment variable > default zod
      const envConfig = parseJwtConfig(process.env);
      return {
        jwt: {
          secret: config?.jwt?.secret ?? envConfig.jwt.secret,
          expiresIn: config?.jwt?.expiresIn ?? envConfig.jwt.expiresIn,
        },
      };
    },
  };
}
