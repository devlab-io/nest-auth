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
  ActionTokenService,
  AuthService,
  JwtService,
  RoleService,
  SessionService,
  UserService,
} from './services';
import {
  AuthController,
  UserController,
  SessionController,
} from './controllers';
import {
  UserEntity,
  RoleEntity,
  ActionTokenEntity,
  SessionEntity,
} from './entities';

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

    return {
      module: AuthModule,
      imports: [
        TypeOrmModule.forFeature([
          UserEntity,
          RoleEntity,
          ActionTokenEntity,
          SessionEntity,
        ]),
      ],
      controllers: [AuthController, UserController, SessionController],
      providers: [
        actionConfigProvider,
        jwtConfigProvider,
        adminConfigProvider,
        userConfigProvider,
        googleAuthConfigProvider,
        authConfigProvider,
        AuthService,
        UserService,
        ActionTokenService,
        RoleService,
        JwtService,
        SessionService,
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
        AuthService,
        UserService,
        ActionTokenService,
        RoleService,
        JwtService,
        SessionService,
        JwtAuthGuard,
        FrontendUrlGuard,
      ],
    };
  }
}
