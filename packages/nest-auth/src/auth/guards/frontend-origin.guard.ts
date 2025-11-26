import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Frontend Origin Guard
 * Validates that requests have an Origin or Referer header
 * The application using this library should implement its own CORS/whitelist logic
 * This guard only ensures that a frontend origin is present (security requirement)
 */
@Injectable()
export class FrontendUrlGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers || {};

    // Try to get the Origin header first (most reliable)
    const origin = headers.origin;
    if (origin) {
      return true;
    }

    // Fallback to Referer header
    const referer = headers.referer;
    if (referer) {
      try {
        // Validate that the Referer is a valid URL
        new URL(referer);
        return true;
      } catch {
        // If URL parsing fails, throw error
        throw new ForbiddenException(
          'Invalid Referer header: unable to extract frontend URL',
        );
      }
    }

    // If neither header is available, reject the request
    throw new ForbiddenException(
      'Missing Origin or Referer header. Request must come from a frontend.',
    );
  }
}
