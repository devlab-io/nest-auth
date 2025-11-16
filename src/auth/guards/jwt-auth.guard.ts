import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtConfig, JwtConfigToken } from '../config/jwt.config';
import { UserService } from '../services/user.service';
import { SessionService } from '../services/session.service';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import { UserEntity } from '../entities';
import { extractTokenFromRequest } from '../utils';

/**
 * JWT Authentication Guard
 * Validates JWT tokens and loads the user into the request context
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  public constructor(
    @Inject(JwtConfigToken) private readonly jwtConfig: JwtConfig,
    @Inject() private readonly userService: UserService,
    @Inject() private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token: string | null = extractTokenFromRequest(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify and decode the token
      const payload: JwtPayload = jwt.verify(
        token,
        this.jwtConfig.jwt.secret,
      ) as JwtPayload;

      // Verify session exists in database
      const session = await this.sessionService.findByToken(token);
      if (!session) {
        throw new UnauthorizedException('Session not found');
      }

      // Check if session is still active
      if (!this.sessionService.isActive(session)) {
        throw new UnauthorizedException('Session has expired');
      }

      // Load the user from the database
      const user: UserEntity = await this.userService.getById(payload.sub);

      if (!user.enabled) {
        throw new UnauthorizedException('User account is disabled');
      }

      // Set the user in the request context
      request.user = user;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
