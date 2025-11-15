import { Provider } from '@nestjs/common';
import { AdminConfig, AdminConfigToken } from './admin.config';
import { JwtConfig, JwtConfigToken } from './jwt.config';
import { GoogleAuthConfig, GoogleAuthConfigToken } from './google-auth.config';
import { UserConfig, UserConfigToken } from './user.config';

export interface AuthConfig {
  auth: JwtConfig & AdminConfig & UserConfig & GoogleAuthConfig;
}

export const AuthConfigToken: symbol = Symbol('AuthConfig');

export function provideAuthConfig(config?: AuthConfig): Provider {
  return {
    provide: AuthConfigToken,
    inject: [
      JwtConfigToken,
      AdminConfigToken,
      UserConfigToken,
      GoogleAuthConfigToken,
    ],
    useFactory: (
      jwtConfig: JwtConfig,
      adminConfig: AdminConfig,
      userConfig: UserConfig,
      googleAuthConfig: GoogleAuthConfig,
    ): AuthConfig => {
      return {
        auth: {
          ...jwtConfig,
          ...adminConfig,
          ...userConfig,
          ...googleAuthConfig,
        },
        ...config,
      };
    },
  };
}
