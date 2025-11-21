import { config } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';
import { Provider } from '@nestjs/common';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

export interface GoogleAuthConfig {
  google: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
}

export const GoogleAuthConfigToken: symbol = Symbol('GoogleAuthConfig');

const googleAuthConfigSchema = z.object({
  AUTH_GOOGLE_CLIENT_ID: z.string().default(''),
  AUTH_GOOGLE_CLIENT_SECRET: z.string().default(''),
  AUTH_GOOGLE_CALLBACK_URL: z.string().default(''),
});

function parseGoogleAuthConfig(env: NodeJS.ProcessEnv): GoogleAuthConfig {
  const config = googleAuthConfigSchema.parse(env);
  const hasRequiredConfig: boolean =
    !!config.AUTH_GOOGLE_CLIENT_ID &&
    !!config.AUTH_GOOGLE_CLIENT_SECRET &&
    !!config.AUTH_GOOGLE_CALLBACK_URL;

  return {
    google: {
      enabled: hasRequiredConfig,
      clientId: config.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: config.AUTH_GOOGLE_CLIENT_SECRET,
      callbackUrl: config.AUTH_GOOGLE_CALLBACK_URL,
    },
  };
}

export function provideGoogleAuthConfig(): Provider {
  return {
    provide: GoogleAuthConfigToken,
    useFactory: (): GoogleAuthConfig => {
      return parseGoogleAuthConfig(process.env);
    },
  };
}
