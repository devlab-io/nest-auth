import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthScope } from '@devlab-io/nest-auth-types';

/**
 * Decorator to extract the current scope constraints from the request
 * Use this decorator in controller methods to get the constraints for the current route
 *
 * @example
 * ```typescript
 * @Get('users')
 * @UseGuards(AuthGuard)
 * @Claims(READ_ANY_USERS, READ_ORG_USERS)
 * async getUsers(@CurrentAuthScope() authScope: AuthScope) {
 *   // authScope will contain action, scope, resource, and constraints (organisationIds, establishmentIds, or userId)
 * }
 * ```
 */
export const CurrentAuthScope = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthScope | null => {
    const request = ctx.switchToHttp().getRequest();
    return (request as any).authScope ?? null;
  },
);
