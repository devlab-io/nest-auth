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
  UserService,
  NotificationService,
  OrganisationService,
  EstablishmentService,
  UserAccountService,
  CredentialService,
} from './services';
import {
  AuthController,
  UserController,
  SessionController,
  OrganisationController,
  EstablishmentController,
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

    return {
      module: AuthModule,
      imports: [
        TypeOrmModule.forFeature([
          UserEntity,
          RoleEntity,
          ActionEntity,
          SessionEntity,
          OrganisationEntity,
          EstablishmentEntity,
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
        UserService,
        ActionService,
        RoleService,
        JwtService,
        SessionService,
        NotificationService,
        OrganisationService,
        EstablishmentService,
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
        UserService,
        ActionService,
        RoleService,
        JwtService,
        SessionService,
        NotificationService,
        OrganisationService,
        EstablishmentService,
        UserAccountService,
        CredentialService,
        JwtAuthGuard,
        FrontendUrlGuard,
      ],
    };
  }
}
