import {
  Injectable,
  Inject,
  Logger,
  UnauthorizedException,
  BadRequestException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { UserService } from './user.service';
import { SessionService } from './session.service';
import { JwtConfig, JwtConfigToken } from '../config/jwt.config';
import { JwtToken, JwtPayload, User, Role } from '../types';
import * as bcrypt from 'bcryptjs';
import { extractTokenFromRequest } from '../utils';

/**
 * Service for JWT authentication and authorization
 */
@Injectable({ scope: Scope.REQUEST })
export class JwtService {
  private readonly logger: Logger = new Logger(JwtService.name);
  private readonly COOKIE_NAME = 'access_token';

  public constructor(
    @Inject(REQUEST) private readonly request: Request,
    @Inject(JwtConfigToken) private readonly jwtConfig: JwtConfig,
    @Inject() private readonly userService: UserService,
    @Inject() private readonly sessionService: SessionService,
  ) {}

  /**
   * Check if a user is authenticated in the current request context
   *
   * @returns True if the user is authenticated, false otherwise
   */
  public isUserAuthenticated(): boolean {
    const user: User | null = this.getUserFromContext();
    return user !== null;
  }

  /**
   * Get the authenticated user from the current request context
   *
   * @returns The authenticated user
   * @throws UnauthorizedException if the user is not authenticated
   */
  public getAuthenticatedUser(): User {
    const user: User | null = this.getUserFromContext();
    if (!user) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return user;
  }

  /**
   * Check if the authenticated user has any of the given roles
   *
   * @param roles - Array of role names to check
   * @returns True if the user has at least one of the roles, false otherwise
   * @throws UnauthorizedException if the user is not authenticated
   */
  public userHasAnyRoles(roles: string[]): boolean {
    const user: User = this.getAuthenticatedUser();
    const userRoles: string[] = user.roles.map(
      (role: Role): string => role.name,
    );
    return roles.some((role) => userRoles.includes(role));
  }

  /**
   * Check if the authenticated user has all of the given roles
   *
   * @param roles - Array of role names to check
   * @returns True if the user has all of the roles, false otherwise
   * @throws UnauthorizedException if the user is not authenticated
   */
  public userHasAllRoles(roles: string[]): boolean {
    const user: User = this.getAuthenticatedUser();
    const userRoles: string[] = user.roles.map(
      (role: Role): string => role.name,
    );
    return roles.every((role) => userRoles.includes(role));
  }

  /**
   * Authenticate a user
   *
   * @param user - The user
   * @param password - The user's password
   * @returns The JWT token
   * @throws UnauthorizedException if the credentials are invalid
   * @throws BadRequestException if the user account is disabled
   */
  public async authenticate(user: User, password: string): Promise<JwtToken> {
    // Check if the user is enabled
    if (!user.enabled) {
      this.logger.warn(
        `Authentication failed: user with email ${user.email} is disabled`,
      );
      throw new BadRequestException('User account is disabled');
    }

    // Check if the user has a password
    if (!user.password) {
      this.logger.warn(
        `Authentication failed: user with email ${user.email} has no password`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(
        `Authentication failed: invalid password for user with email ${user.email}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    // Create session in database
    await this.sessionService.create(token.accessToken, user.id);

    // Set the cookie
    this.setCookie(token.accessToken);

    // Store the user in the request context
    this.setUserInContext(user);

    // Log
    this.logger.debug(
      `User with email ${user.email} authenticated successfully`,
    );

    // Done
    return token;
  }

  /**
   * Logout the current user by revoking the session and clearing the cookie
   */
  public async logout(): Promise<void> {
    // Get token from request
    const token = this.extractTokenFromRequest();

    // Delete session from database if token exists
    if (token) {
      try {
        await this.sessionService.deleteByToken(token);
      } catch {
        // Session might not exist, log but don't fail
        this.logger.warn(`Session not found for token during logout`);
      }
    }

    // Clear the cookie
    this.clearCookie();

    // Remove the user from the request context
    this.removeUserFromContext();

    // Log
    this.logger.debug('User logged out successfully');
  }

  /**
   * Generate a JWT token for a user
   *
   * @param user - The user entity
   * @returns The JWT token
   */
  private generateToken(user: User): JwtToken {
    // Create the payload
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles.map((role: Role): string => role.name),
    };

    // Generate the token
    const options: jwt.SignOptions = {
      expiresIn: this.jwtConfig.jwt.expiresIn,
    } as jwt.SignOptions;
    const accessToken: string = jwt.sign(
      payload,
      this.jwtConfig.jwt.secret,
      options,
    );

    // Return the token
    return {
      accessToken,
      expiresIn: this.jwtConfig.jwt.expiresIn,
    };
  }

  /**
   * Verify and decode a JWT token
   *
   * @param token - The JWT token to verify
   * @returns The decoded payload
   * @throws UnauthorizedException if the token is invalid
   */
  public async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return jwt.verify(token, this.jwtConfig.jwt.secret) as JwtPayload;
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Load user from token and set it in the request context
   * This method is typically called by a guard
   *
   * @param token - The JWT token
   * @throws UnauthorizedException if the token is invalid or the user is not found
   */
  public async loadUserFromToken(token: string): Promise<void> {
    // Parse token
    const payload: JwtPayload = await this.verifyToken(token);

    // Verify session exists in database
    const session = await this.sessionService.findByToken(token);
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    // Check if session is still active
    if (!this.sessionService.isActive(session)) {
      throw new UnauthorizedException('Session has expired');
    }

    // Get the user
    const user: User = await this.userService.getById(payload.sub);

    // Check if the user is enabled
    if (!user.enabled) {
      throw new UnauthorizedException('User account is disabled');
    }

    // Set the user in the request context
    this.setUserInContext(user);
  }

  /**
   * Get the user from the request context
   *
   * @returns The user entity or null if not set
   */
  private getUserFromContext(): User | null {
    return (this.request as any).user || null;
  }

  /**
   * Set the user in the request context
   *
   * @param user - The user entity
   */
  private setUserInContext(user: User): void {
    (this.request as any).user = user;
  }

  /**
   * Remove the user from the request context
   */
  private removeUserFromContext(): void {
    delete (this.request as any).user;
  }

  /**
   * Set the authentication cookie
   *
   * @param token - The JWT token
   */
  private setCookie(token: string): void {
    const response: Response = this.request.res as Response;
    if (response) {
      // Parse expiresIn to get expiration time in milliseconds
      const expiresInMs = this.parseExpiresIn(this.jwtConfig.jwt.expiresIn);
      const expires = new Date(Date.now() + expiresInMs);

      response.cookie(this.COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires,
        path: '/',
      });
    }
  }

  /**
   * Clear the authentication cookie
   */
  private clearCookie(): void {
    const response = this.request.res as Response;
    if (response) {
      response.clearCookie(this.COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
    }
  }

  /**
   * Parse expiresIn string to milliseconds
   *
   * @param expiresIn - Expiration string (e.g., "1h", "30m", "7d")
   * @returns Expiration time in milliseconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match: RegExpMatchArray | null = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Default to 1 hour if parsing fails
      return 60 * 60 * 1000;
    }

    const value: number = parseInt(match[1], 10);
    const unit: string = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000;
    }
  }

  /**
   * Extract token from request (from Authorization header or cookie)
   *
   * @returns The token or null if not found
   */
  public extractTokenFromRequest(): string | null {
    return extractTokenFromRequest(this.request, this.COOKIE_NAME);
  }
}
