import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '../services/jwt.service';
import { extractTokenFromRequest } from '../utils';

/**
 * JWT Authentication Guard
 * Validates JWT tokens and loads the user account into the request context
 *
 * Uses JwtService.loadUserFromToken() which:
 * - Verifies the token
 * - Checks the session exists and is active
 * - Loads the UserAccount (not just User)
 * - Sets request.userAccount and request.user (for backward compatibility)
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  public constructor(@Inject() private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token: string | null = extractTokenFromRequest(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // ✅ Use JwtService.loadUserFromToken() which:
      // - Verifies the token and validates the session
      // - Loads the UserAccount (payload.sub is userAccount.id)
      // - Sets request.userAccount and request.user in the context
      await this.jwtService.loadUserFromToken(token);

      return true;
    } catch (error) {
      // If it's already an UnauthorizedException, rethrow it
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Otherwise, throw a generic error
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
