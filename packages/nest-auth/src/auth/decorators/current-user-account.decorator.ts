import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserAccountEntity } from '../entities';

/**
 * Decorator to extract the current authenticated user account from the request
 * Use this decorator in controller methods to get the authenticated user account
 *
 * @example
 * ```typescript
 * @Get('account')
 * @UseGuards(JwtAuthGuard)
 * async getAccount(@CurrentUserAccount() userAccount: UserAccountEntity) {
 *   return userAccount;
 * }
 * ```
 */
export const CurrentUserAccount = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserAccountEntity => {
    const request = ctx.switchToHttp().getRequest();
    return request.userAccount;
  },
);
