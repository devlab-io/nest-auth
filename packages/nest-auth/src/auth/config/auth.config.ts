import { Provider } from '@nestjs/common';
import { AdminConfig, AdminConfigToken } from './admin.config';
import { JwtConfig, JwtConfigToken } from './jwt.config';
import { GoogleAuthConfig, GoogleAuthConfigToken } from './google-auth.config';
import { UserConfig, UserConfigToken } from './user.config';
import { ActionConfig, ActionConfigToken } from './action.config';
import { TenantsConfig, TenantsConfigToken } from './tenants.config';
import { ExtentedConfig } from './extended.config';
import {
  EstablishmentEntity,
  OrganisationEntity,
  UserEntity,
} from '../entities';
import {
  DefaultEstablishmentService,
  DefaultOrganisationService,
  DefaultUserService,
} from '../services';

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
          entities: {
            // by default entities are not extented
            UserEntity: UserEntity,
            OrganisationEntity: OrganisationEntity,
            EstablishmentEntity: EstablishmentEntity,
          },
          services: {
            // by default services are not extented
            UserService: DefaultUserService,
            OrganisationService: DefaultOrganisationService,
            EstablishmentService: DefaultEstablishmentService,
          },
        },
        ...config,
      };
    },
  };
}
