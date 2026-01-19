import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import {
  provideAuthConfig,
  provideJwtConfig,
  provideAdminConfig,
  provideUserConfig,
  provideGoogleAuthConfig,
  provideClientsConfig,
  provideExtendedConfig,
  AuthConfig,
  UserConfigToken,
  UserConfig,
} from './config';
import { AuthGuard, ClientGuard } from './guards';
import {
  ActionService,
  AuthService,
  JwtService,
  RoleService,
  SessionService,
  DefaultUserService,
  UserService,
  UserServiceToken,
  NotificationService,
  DefaultOrganisationService,
  OrganisationService,
  OrganisationServiceToken,
  DefaultEstablishmentService,
  EstablishmentService,
  EstablishmentServiceToken,
  UserAccountService,
  CredentialService,
  ClaimService,
  ScopeService,
} from './services';
import {
  AuthController,
  UserController,
  SessionController,
  OrganisationController,
  EstablishmentController,
  UserAccountController,
  RoleController,
  ClaimController,
} from './controllers';
import {
  UserEntity,
  RoleEntity,
  ClaimEntity,
  ActionEntity,
  SessionEntity,
  OrganisationEntity,
  EstablishmentEntity,
  CredentialEntity,
  UserAccountEntity,
} from './entities';
import { provideTenantsConfig } from './config/tenants.config';
import { DataSource, DeepPartial, Repository } from 'typeorm';

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
    const clientsConfigProvider: Provider = provideClientsConfig(config?.auth);
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

    // Default providers that can be overriden
    const userServiceProvider: Provider<UserService> = {
      provide: UserServiceToken,
      inject: [
        UserConfigToken,
        DataSource,
        getRepositoryToken(UserEntityClass),
        CredentialService,
        ActionService,
        ScopeService,
      ],
      useFactory: (
        userConfig: UserConfig,
        dataSource: DataSource,
        userRepository: Repository<UserEntity>,
        credentialService: CredentialService,
        actionService: ActionService,
        scopeService: ScopeService,
      ): UserService => {
        return new DefaultUserService(
          userConfig,
          dataSource,
          userRepository,
          credentialService,
          actionService,
          scopeService,
        );
      },
    };

    const organisationServiceProvider: Provider<OrganisationService> = {
      provide: OrganisationServiceToken,
      inject: [
        DataSource,
        getRepositoryToken(OrganisationEntityClass),
        ScopeService,
      ],
      useFactory: (
        dataSource: DataSource,
        organisationRepository: Repository<OrganisationEntity>,
        scopeService: ScopeService,
      ): OrganisationService => {
        return new DefaultOrganisationService(
          dataSource,
          organisationRepository,
          scopeService,
        );
      },
    };

    const establishmentServiceProvider: Provider<EstablishmentService> = {
      provide: EstablishmentServiceToken,
      inject: [
        DataSource,
        getRepositoryToken(EstablishmentEntityClass),
        OrganisationServiceToken,
        ScopeService,
      ],
      useFactory: (
        dataSource: DataSource,
        establishmentRepository: Repository<EstablishmentEntity>,
        organisationService: OrganisationService,
        scopeService: ScopeService,
      ): EstablishmentService => {
        return new DefaultEstablishmentService(
          dataSource,
          establishmentRepository,
          organisationService,
          scopeService,
        );
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
          ClaimEntity,
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
        ClaimController,
      ],
      providers: [
        clientsConfigProvider,
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
        ClaimService,
        JwtService,
        SessionService,
        NotificationService,
        UserAccountService,
        CredentialService,
        ScopeService,
        AuthGuard,
        ClientGuard,
        {
          provide: APP_INTERCEPTOR,
          inject: [Reflector],
          useFactory: (reflector: Reflector) => {
            return new ClassSerializerInterceptor(reflector);
          },
        },
      ],
      exports: [
        clientsConfigProvider,
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
        ClaimService,
        JwtService,
        SessionService,
        NotificationService,
        UserAccountService,
        CredentialService,
        ScopeService,
        AuthGuard,
        ClientGuard,
      ],
    };
  }
}
