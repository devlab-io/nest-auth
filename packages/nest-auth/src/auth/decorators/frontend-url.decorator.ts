import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { route } from '../utils';

/**
 * Decorator to extract the frontend URL from the request
 * Uses the Origin header if available, otherwise falls back to Referer header
 * Throws BadRequestException if neither header is available (security requirement)
 *
 * @example
 * ```typescript
 * @Post('send-reset-password')
 * async sendResetPassword(
 *   @Query('email') email: string,
 *   @FrontendUrl() frontendUrl: string,
 * ) {
 *   return await this.authService.sendResetPassword(email, frontendUrl);
 * }
 * ```
 */
export const FrontendUrl = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    // Try to get the Origin header first (most reliable)
    const origin = request.headers?.origin;
    if (origin) {
      return route(origin);
    }

    // Fallback to Referer header
    const referer = request.headers?.referer;
    if (referer) {
      try {
        const url = new URL(referer);
        const frontendUrl = `${url.protocol}//${url.host}`;
        return route(frontendUrl);
      } catch {
        // If URL parsing fails, throw an error for security
        throw new BadRequestException(
          'Invalid Referer header: unable to extract frontend URL',
        );
      }
    }

    // If neither header is available, throw an error for security reasons
    throw new BadRequestException(
      'Frontend URL is required. Missing Origin or Referer header.',
    );
  },
);
