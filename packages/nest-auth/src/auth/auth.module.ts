import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  provideAuthConfig,
  provideJwtConfig,
  provideAdminConfig,
  provideUserConfig,
  provideGoogleAuthConfig,
  provideActionConfig,
  provideExtendedConfig,
  AuthConfig,
  ExtendedConfigToken,
  ExtentedConfig,
} from './config';
import { JwtAuthGuard, FrontendUrlGuard } from './guards';
import {
  ActionService,
  AuthService,
  JwtService,
  RoleService,
  SessionService,
  UserService,
  UserServiceToken,
  NotificationService,
  OrganisationService,
  OrganisationServiceToken,
  EstablishmentService,
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
import { DeepPartial } from 'typeorm';

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
  static forRoot(config?: DeepPartial<AuthConfig>): DynamicModule {
    const actionConfigProvider: Provider = provideActionConfig(config?.auth);
    const jwtConfigProvider: Provider = provideJwtConfig(config?.auth);
    const adminConfigProvider: Provider = provideAdminConfig(config?.auth);
    const userConfigProvider: Provider = provideUserConfig(config?.auth);
    const googleAuthConfigProvider: Provider = provideGoogleAuthConfig(
      config?.auth,
    );
    const tenantsConfigProvider: Provider = provideTenantsConfig(config?.auth);
    const extendedConfigProvider: Provider = provideExtendedConfig(
      config?.auth,
    );
    const authConfigProvider: Provider = provideAuthConfig();

    // Determine which entity classes to use (same logic as in TypeOrmModule.forFeature)
    const UserEntityClass: typeof UserEntity =
      (config?.auth?.entities?.UserEntity as typeof UserEntity) || UserEntity;
    const OrganisationEntityClass: typeof OrganisationEntity =
      (config?.auth?.entities
        ?.OrganisationEntity as typeof OrganisationEntity) ||
      OrganisationEntity;
    const EstablishmentEntityClass: typeof EstablishmentEntity =
      (config?.auth?.entities
        ?.EstablishmentEntity as typeof EstablishmentEntity) ||
      EstablishmentEntity;

    // Create providers for extendable services
    // We use ModuleRef.resolve() directly to create instances
    // This allows NestJS to automatically inject all dependencies, including custom ones
    // Note: Extended service classes should be registered as providers in the user's module
    // for their custom dependencies to be injected
    const userServiceProvider: Provider<UserService> = {
      provide: UserServiceToken,
      inject: [ModuleRef, ExtendedConfigToken],
      useFactory: async (
        moduleRef: ModuleRef,
        extendedConfig: ExtentedConfig,
      ): Promise<UserService> => {
        return moduleRef.resolve(extendedConfig.services.UserService);
      },
    };

    const organisationServiceProvider: Provider<OrganisationService> = {
      provide: OrganisationServiceToken,
      inject: [ModuleRef, ExtendedConfigToken],
      useFactory: async (
        moduleRef: ModuleRef,
        extendedConfig: ExtentedConfig,
      ): Promise<OrganisationService> => {
        return moduleRef.resolve(extendedConfig.services.OrganisationService);
      },
    };

    const establishmentServiceProvider: Provider<EstablishmentService> = {
      provide: EstablishmentServiceToken,
      inject: [ModuleRef, ExtendedConfigToken],
      useFactory: async (
        moduleRef: ModuleRef,
        extendedConfig: ExtentedConfig,
      ): Promise<EstablishmentService> => {
        return moduleRef.resolve(extendedConfig.services.EstablishmentService);
      },
    };

    return {
      module: AuthModule,
      imports: [
        TypeOrmModule.forFeature([
          UserEntityClass,
          OrganisationEntityClass,
          EstablishmentEntityClass,
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
        tenantsConfigProvider,
        extendedConfigProvider,
        authConfigProvider,
        AuthService,
        userServiceProvider,
        organisationServiceProvider,
        establishmentServiceProvider,
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
        extendedConfigProvider,
        AuthService,
        userServiceProvider,
        organisationServiceProvider,
        establishmentServiceProvider,
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
