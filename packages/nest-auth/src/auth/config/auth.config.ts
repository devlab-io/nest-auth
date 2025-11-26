import { Provider } from '@nestjs/common';
import { AdminConfig, AdminConfigToken } from './admin.config';
import { JwtConfig, JwtConfigToken } from './jwt.config';
import { GoogleAuthConfig, GoogleAuthConfigToken } from './google-auth.config';
import { UserConfig, UserConfigToken } from './user.config';
import { ActionConfig, ActionConfigToken } from './action.config';
import { TenantsConfig, TenantsConfigToken } from './tenants.config';

export interface AuthConfig {
  auth: JwtConfig &
    AdminConfig &
    UserConfig &
    GoogleAuthConfig &
    ActionConfig &
    TenantsConfig;
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
      ActionConfigToken,
      TenantsConfigToken,
    ],
    useFactory: (
      jwtConfig: JwtConfig,
      adminConfig: AdminConfig,
      userConfig: UserConfig,
      googleAuthConfig: GoogleAuthConfig,
      actionConfig: ActionConfig,
      tenantsConfig: TenantsConfig,
    ): AuthConfig => {
      return {
        auth: {
          ...jwtConfig,
          ...adminConfig,
          ...userConfig,
          ...googleAuthConfig,
          ...actionConfig,
          ...tenantsConfig,
        },
        ...config,
      };
    },
  };
}
