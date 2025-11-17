import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { provideAuthConfig, AuthConfig } from './config';
import { JwtAuthGuard } from './guards';
import {
  ActionTokenService,
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
    const configProvider: Provider = provideAuthConfig(config);
    return {
      module: AuthModule,
      controllers: [AuthController, UserController, SessionController],
      providers: [
        configProvider,
        UserService,
        ActionTokenService,
        RoleService,
        JwtService,
        SessionService,
        JwtAuthGuard,
      ],
      exports: [
        configProvider,
        UserService,
        ActionTokenService,
        RoleService,
        JwtService,
        SessionService,
        JwtAuthGuard,
      ],
    };
  }
}
