import { Provider } from '@nestjs/common';
import { AdminConfig, AdminConfigToken } from './admin.config';
import { JwtConfig, JwtConfigToken } from './jwt.config';
import { GoogleAuthConfig, GoogleAuthConfigToken } from './google-auth.config';
import { UserConfig, UserConfigToken } from './user.config';
import { ActionConfig, ActionConfigToken } from './action.config';
import { TenantsConfig, TenantsConfigToken } from './tenants.config';
import { ExtentedConfig, ExtendedConfigToken } from './extended.config';

export interface AuthConfig {
  auth: JwtConfig &
    AdminConfig &
    UserConfig &
    GoogleAuthConfig &
    ActionConfig &
    TenantsConfig &
    ExtentedConfig;
}

export const AuthConfigToken: symbol = Symbol('AuthConfig');

export function provideAuthConfig(): Provider {
  return {
    provide: AuthConfigToken,
    inject: [
      JwtConfigToken,
      AdminConfigToken,
      UserConfigToken,
      GoogleAuthConfigToken,
      ActionConfigToken,
      TenantsConfigToken,
      ExtendedConfigToken,
    ],
    useFactory: (
      jwtConfig: JwtConfig,
      adminConfig: AdminConfig,
      userConfig: UserConfig,
      googleAuthConfig: GoogleAuthConfig,
      actionConfig: ActionConfig,
      tenantsConfig: TenantsConfig,
      extendedConfig: ExtentedConfig,
    ): AuthConfig => {
      return {
        auth: {
          ...jwtConfig,
          ...adminConfig,
          ...userConfig,
          ...googleAuthConfig,
          ...actionConfig,
          ...tenantsConfig,
          ...extendedConfig,
        },
      };
    },
  };
}
