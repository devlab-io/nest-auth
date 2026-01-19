import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '../services/jwt.service';
import { ScopeService } from '../services/scope.service';
import { extractTokenFromRequest } from '../utils';
import {
  ADMIN,
  Claim,
  UserAccount,
  ClaimsUtils,
} from '@devlab-io/nest-auth-types';
import { Reflector } from '@nestjs/core';
import { CLAIMS_KEY } from '../decorators/claims';
import {
  ClientConfig,
  ClientsConfig,
  ClientsConfigToken,
} from '../config/client.config';
import {
  extractOriginFromRequest,
  findClientByOrigin,
} from '../utils/client.utils';

/**
 * JWT Authentication Guard
 * Validates JWT tokens and loads the user account into the request context.
 * Also validates the client and loads the ClientConfig.
 *
 * Client identification priority:
 * 1. X-Client-Id header → match by ID
 * 2. Origin/Referer header → match by URI
 *
 * Uses JwtService.loadUserFromToken() which:
 * - Verifies the token
 * - Checks the session exists and is active
 * - Loads the UserAccount (not just User)
 * - Sets request.userAccount and request.user (for backward compatibility)
 */
@Injectable()
export class AuthGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly scopeService: ScopeService,
    @Inject(ClientsConfigToken)
    private readonly clientsConfig: ClientsConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // === Client validation ===
    let client: ClientConfig | undefined;

    // 1. Try explicit X-Client-Id header
    const clientId: string | undefined = request.headers?.['x-client-id'];
    if (clientId) {
      client = this.clientsConfig.clients.get(clientId);
      if (!client) {
        throw new ForbiddenException(
          `Unknown client: ${clientId}. This client is not configured.`,
        );
      }
    }

    // 2. Try matching origin with client URI
    if (!client) {
      const origin = extractOriginFromRequest(request);
      if (origin) {
        client = findClientByOrigin(this.clientsConfig.clients, origin);
      }
    }

    // No client identification possible
    if (!client) {
      throw new ForbiddenException(
        'Unable to identify client. Provide X-Client-Id header or ensure Origin matches a configured client URI.',
      );
    }

    // Store the client config in the request for the @Client() decorator
    request.client = client;

    // === JWT token validation ===
    const token: string | null = extractTokenFromRequest(request);

    // Verify that an authentication token is provided.
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // Load the user account from the token.
    let userAccount: UserAccount | null = null;
    try {
      // ✅ Use JwtService.loadUserFromToken() which:
      // - Verifies the token and validates the session
      // - Loads the UserAccount (payload.sub is userAccount.id)
      // - Sets request.userAccount and request.user in the context
      userAccount = await this.jwtService.loadUserFromToken(token);
    } catch (error) {
      // If it's already an UnauthorizedException, rethrow it
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Otherwise, throw a generic error
      throw new UnauthorizedException('Invalid or expired token');
    }

    // See if claims are required for the current endpoint.
    const requiredClaims: Claim[] | undefined =
      this.reflector.getAllAndOverride<Claim[]>(CLAIMS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    // If no claims are required, allow access.
    if (!requiredClaims) {
      return true;
    }

    // If claims are required, go through each role of the user and accumulate the claims
    // Convert claims to strings for comparison (format: "action:scope:resource")
    const userClaims: Set<string> = new Set();
    for (const role of userAccount.roles) {
      for (const claim of role.claims) {
        userClaims.add(ClaimsUtils.serialize(claim));
      }
    }

    // Check if the user is an admin
    if (userClaims.has(ClaimsUtils.serialize(ADMIN))) {
      return true;
    }

    // Check if the user has at least one of the required claims.
    // Convert required claims to strings for comparison
    const hasRequiredClaim: boolean = requiredClaims.some((claim) => {
      return userClaims.has(ClaimsUtils.serialize(claim));
    });

    if (!hasRequiredClaim) {
      return false;
    }

    // All required claims have the same action and resource (verified by @Claims decorator)
    // Calculate and store scope constraints for this action/resource
    const authScope = this.scopeService.calculateAndStoreScope(
      userAccount,
      requiredClaims[0].action,
      requiredClaims[0].resource,
    );

    // Also store in request object as fallback (AsyncLocalStorage may not work in all contexts)
    if (authScope) {
      (request as any).authScope = authScope;
    }

    return true;
  }
}
