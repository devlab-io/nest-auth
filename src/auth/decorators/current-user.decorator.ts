import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '../entities';

/**
 * Decorator to extract the current authenticated user from the request
 * Use this decorator in controller methods to get the authenticated user
 *
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@CurrentUser() user: UserEntity) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserEntity => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
