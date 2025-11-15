import { DynamicModule, Global, Module } from '@nestjs/common';
import { provideAuthConfig, AuthConfig } from './config';
import { provideAuthServices } from './auth.provider';

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
    return {
      module: AuthModule,
      controllers: [],
      providers: [provideAuthConfig(config), ...provideAuthServices()],
      exports: [provideAuthConfig(config), ...provideAuthServices()],
    };
  }
}
