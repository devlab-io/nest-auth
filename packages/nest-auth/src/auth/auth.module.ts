import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  provideAuthConfig,
  provideJwtConfig,
  provideAdminConfig,
  provideUserConfig,
  provideGoogleAuthConfig,
  provideActionConfig,
  AuthConfig,
} from './config';
import { JwtAuthGuard, FrontendUrlGuard } from './guards';
import {
  ActionService,
  AuthService,
  JwtService,
  RoleService,
  SessionService,
  DefaultUserService,
  UserServiceToken,
  NotificationService,
  DefaultOrganisationService,
  OrganisationServiceToken,
  DefaultEstablishmentService,
  EstablishmentServiceToken,
  UserAccountService,
  CredentialService,
} from './services';
import {
  AuthController,
  UserController,
  SessionController,
  OrganisationController,
  EstablishmentController,
  UserAccountController,
  RoleController,
} from './controllers';
import {
  UserEntity,
  RoleEntity,
  ActionEntity,
  SessionEntity,
  OrganisationEntity,
  EstablishmentEntity,
  CredentialEntity,
  UserAccountEntity,
} from './entities';
import { provideTenantsConfig } from './config/tenants.config';

/**
 * Authentication module
 */
@Global()
@Module({})
export class AuthModule {
  /**
   * Create a dynamic authentication module
   *
   * @param config - Authentication module configuration
   * @returns Dynamic authentication module
   */
  static forRoot(config?: AuthConfig): DynamicModule {
    const actionConfigProvider: Provider = provideActionConfig();
    const jwtConfigProvider: Provider = provideJwtConfig();
    const adminConfigProvider: Provider = provideAdminConfig();
    const userConfigProvider: Provider = provideUserConfig();
    const googleAuthConfigProvider: Provider = provideGoogleAuthConfig();
    const authConfigProvider: Provider = provideAuthConfig(config);
    const tenantsConfigProvider: Provider = provideTenantsConfig();

    // Create providers for services with tokens
    const extendedUserServiceProvider: Provider = {
      provide: UserServiceToken,
      useClass: config?.auth.services.UserService || DefaultUserService,
    };

    const extendedOrganisationServiceProvider: Provider = {
      provide: OrganisationServiceToken,
      useClass:
        config?.auth.services.OrganisationService || DefaultOrganisationService,
    };

    const extendedEstablishmentServiceProvider: Provider = {
      provide: EstablishmentServiceToken,
      useClass:
        config?.auth.services.EstablishmentService ||
        DefaultEstablishmentService,
    };

    // Also provide the concrete classes for backward compatibility
    const defaultUserServiceProvider: Provider = {
      provide: UserServiceToken,
      useClass: DefaultUserService,
    };

    const defaultOrganisationServiceProvider: Provider = {
      provide: OrganisationServiceToken,
      useClass: DefaultOrganisationService,
    };

    const defaultEstablishmentServiceProvider: Provider = {
      provide: EstablishmentServiceToken,
      useClass: DefaultEstablishmentService,
    };

    return {
      module: AuthModule,
      imports: [
        TypeOrmModule.forFeature([
          config?.auth.entities.UserEntity || UserEntity,
          config?.auth.entities.OrganisationEntity || OrganisationEntity,
          config?.auth.entities.EstablishmentEntity || EstablishmentEntity,
          RoleEntity,
          ActionEntity,
          SessionEntity,
          CredentialEntity,
          UserAccountEntity,
        ]),
      ],
      controllers: [
        AuthController,
        UserController,
        SessionController,
        OrganisationController,
        EstablishmentController,
        UserAccountController,
        RoleController,
      ],
      providers: [
        actionConfigProvider,
        jwtConfigProvider,
        adminConfigProvider,
        userConfigProvider,
        googleAuthConfigProvider,
        authConfigProvider,
        tenantsConfigProvider,
        AuthService,
        extendedUserServiceProvider,
        defaultUserServiceProvider,
        extendedOrganisationServiceProvider,
        defaultOrganisationServiceProvider,
        extendedEstablishmentServiceProvider,
        defaultEstablishmentServiceProvider,
        ActionService,
        RoleService,
        JwtService,
        SessionService,
        NotificationService,
        UserAccountService,
        CredentialService,
        JwtAuthGuard,
        FrontendUrlGuard,
      ],
      exports: [
        actionConfigProvider,
        authConfigProvider,
        jwtConfigProvider,
        adminConfigProvider,
        userConfigProvider,
        googleAuthConfigProvider,
        tenantsConfigProvider,
        AuthService,
        extendedUserServiceProvider,
        defaultUserServiceProvider,
        extendedOrganisationServiceProvider,
        defaultOrganisationServiceProvider,
        extendedEstablishmentServiceProvider,
        defaultEstablishmentServiceProvider,
        ActionService,
        RoleService,
        JwtService,
        SessionService,
        NotificationService,
        UserAccountService,
        CredentialService,
        JwtAuthGuard,
        FrontendUrlGuard,
      ],
    };
  }
}
