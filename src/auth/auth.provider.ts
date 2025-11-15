import { Provider } from '@nestjs/common';
import { ActionTokenService, RoleService, UserService } from './services';

/**
 * Provider used to provide the storage service dynamicallyanywhere in the NestJS application
 */
export function provideAuthServices(): Provider[] {
  return [UserService, ActionTokenService, RoleService];
}
