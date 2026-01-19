import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ClientConfig } from '../config/client.config';

/**
 * Decorator to extract the ClientConfig from the request.
 * The client is loaded by ClientGuard or AuthGuard and stored in request.client.
 *
 * @example
 * ```typescript
 * // Public route with ClientGuard
 * @UseGuards(ClientGuard)
 * @Post('send-reset-password')
 * async sendResetPassword(
 *   @Client() client: ClientConfig,
 *   @Query('email') email: string,
 * ) {
 *   return await this.authService.sendResetPassword(email, client);
 * }
 *
 * // Authenticated route - AuthGuard includes client validation
 * @UseGuards(AuthGuard)
 * @Post('change-password')
 * async changePassword(
 *   @Client() client: ClientConfig,
 *   @Body() body: ChangePasswordDto,
 * ) {
 *   return await this.authService.changePassword(body, client);
 * }
 * ```
 */
export const Client = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ClientConfig => {
    const request = ctx.switchToHttp().getRequest();
    const client: ClientConfig | undefined = request.client;

    if (!client) {
      throw new ForbiddenException(
        'Client not found in request. Ensure ClientGuard or AuthGuard is applied to this route.',
      );
    }

    return client;
  },
);
