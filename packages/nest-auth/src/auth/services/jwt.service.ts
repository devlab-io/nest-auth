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
import { UserAccountService } from './user-account.service';
import { CredentialService } from './credential.service';
import { SessionService } from './session.service';
import { JwtConfig, JwtConfigToken } from '../config/jwt.config';
import { JwtToken, JwtPayload, UserAccount } from '@devlab-io/nest-auth-types';
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
    @Inject() private readonly userAccountService: UserAccountService,
    @Inject() private readonly credentialService: CredentialService,
    @Inject() private readonly sessionService: SessionService,
  ) {}

  /**
   * Check if a user account is authenticated in the current request context
   *
   * @returns True if the user account is authenticated, false otherwise
   */
  public isUserAuthenticated(): boolean {
    const userAccount: UserAccount | null = this.getUserAccountFromContext();
    return userAccount !== null;
  }

  /**
   * Get the authenticated user account from the current request context
   *
   * @returns The authenticated user account
   * @throws UnauthorizedException if the user account is not authenticated
   */
  public getAuthenticatedUserAccount(): UserAccount {
    const userAccount: UserAccount | null = this.getUserAccountFromContext();
    if (!userAccount) {
      throw new UnauthorizedException('User account is not authenticated');
    }
    return userAccount;
  }

  /**
   * Get the authenticated user from the current request context (backward compatibility)
   *
   * @returns The authenticated user
   * @throws UnauthorizedException if the user account is not authenticated
   */
  public getAuthenticatedUser() {
    const userAccount: UserAccount = this.getAuthenticatedUserAccount();
    return userAccount.user;
  }

  /**
   * Check if the authenticated user account has any of the given roles
   *
   * @param roles - Array of role names to check
   * @returns True if the user account has at least one of the roles, false otherwise
   * @throws UnauthorizedException if the user account is not authenticated
   */
  public userHasAnyRoles(roles: string[]): boolean {
    const userAccount: UserAccount = this.getAuthenticatedUserAccount();
    const userRoles: string[] = userAccount.roles.map(
      (role): string => role.name,
    );
    return roles.some((role: string): boolean => userRoles.includes(role));
  }

  /**
   * Check if the authenticated user account has all of the given roles
   *
   * @param roles - Array of role names to check
   * @returns True if the user account has all of the roles, false otherwise
   * @throws UnauthorizedException if the user account is not authenticated
   */
  public userHasAllRoles(roles: string[]): boolean {
    const userAccount: UserAccount = this.getAuthenticatedUserAccount();
    const userRoles: string[] = userAccount.roles.map(
      (role): string => role.name,
    );
    return roles.every((role: string): boolean => userRoles.includes(role));
  }

  /**
   * Authenticate a user account with password
   *
   * @param userAccount - The user account
   * @param password - The user's password
   * @returns The JWT token
   * @throws UnauthorizedException if the credentials are invalid
   * @throws BadRequestException if the user account is disabled
   */
  public async authenticate(
    userAccount: UserAccount,
    password: string,
  ): Promise<JwtToken> {
    // Check if the user is enabled
    if (!userAccount.user.enabled) {
      this.logger.warn(
        `Authentication failed: user with email ${userAccount.user.email} is disabled`,
      );
      throw new BadRequestException('User account is disabled');
    }

    // Verify the password using CredentialService
    const isPasswordValid = await this.credentialService.verifyPassword(
      userAccount.user.id,
      password,
    );
    if (!isPasswordValid) {
      this.logger.warn(
        `Authentication failed: invalid password for user with email ${userAccount.user.email}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(userAccount);

    // Create session in database
    await this.sessionService.create(token.accessToken, userAccount.id);

    // Set the cookie
    this.setCookie(token.accessToken);

    // Store the user account in the request context
    this.setUserAccountInContext(userAccount);

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
  }

  /**
   * Generate a JWT token for a user account
   *
   * @param userAccount - The user account entity
   * @returns The JWT token
   */
  private generateToken(userAccount: UserAccount): JwtToken {
    // Create the payload
    const payload: JwtPayload = {
      sub: userAccount.id, // userAccount id as subject
      userId: userAccount.user.id,
      email: userAccount.user.email,
      username: userAccount.user.username,
      roles: userAccount.roles.map((role): string => role.name),
      organisationId: userAccount.organisation.id,
      establishmentId: userAccount.establishment.id,
    };

    // Generate the token
    // jwt.sign() accepts expiresIn in seconds, so convert from milliseconds
    const options: jwt.SignOptions = {
      expiresIn: Math.floor(this.jwtConfig.jwt.expiresIn / 1000),
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
   * Load user account from token and set it in the request context
   * This method is typically called by a guard
   *
   * @param token - The JWT token
   * @throws UnauthorizedException if the token is invalid or the user account is not found
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

    // Get the user account (payload.sub is the userAccount id)
    const userAccount: UserAccount = await this.userAccountService.getById(
      payload.sub,
    );

    // Check if the user is enabled
    if (!userAccount.user.enabled) {
      throw new UnauthorizedException('User account is disabled');
    }

    // Set the user account in the request context
    this.setUserAccountInContext(userAccount);
  }

  /**
   * Get the user account from the request context
   *
   * @returns The user account entity or null if not set
   */
  private getUserAccountFromContext(): UserAccount | null {
    return (this.request as any).userAccount || null;
  }

  /**
   * Set the user account in the request context
   * Also sets user for backward compatibility
   *
   * @param userAccount - The user account entity
   */
  private setUserAccountInContext(userAccount: UserAccount): void {
    (this.request as any).userAccount = userAccount;
    // Also set user for backward compatibility
    (this.request as any).user = userAccount.user;
  }

  /**
   * Remove the user account from the request context
   */
  private removeUserFromContext(): void {
    delete (this.request as any).userAccount;
    delete (this.request as any).user;
  }

  /**
   * Set the authentication cookie
   * The cookie will persist even after the browser is closed
   *
   * @param token - The JWT token
   */
  private setCookie(token: string): void {
    const response: Response = this.request.res as Response;
    if (response) {
      // Use expiresIn (already parsed in config, in milliseconds)
      const expires: Date = new Date(Date.now() + this.jwtConfig.jwt.expiresIn);

      response.cookie(this.COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Changed from 'strict' to 'lax' for better persistence
        expires,
        maxAge: this.jwtConfig.jwt.expiresIn, // Explicit maxAge in milliseconds for persistence
        path: '/',
      });
    }
  }

  /**
   * Clear the authentication cookie
   */
  private clearCookie(): void {
    const response: Response = this.request.res as Response;
    if (response) {
      response.clearCookie(this.COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Changed from 'strict' to 'lax' for consistency
        path: '/',
      });
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
