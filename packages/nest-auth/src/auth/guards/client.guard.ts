import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { ClientsConfig, ClientsConfigToken } from '../config/client.config';
import {
  extractOriginFromRequest,
  findClientByOrigin,
} from '../utils/client.utils';

/**
 * Client Guard
 * Validates client identification and loads the ClientConfig.
 *
 * Client identification priority:
 * 1. X-Client-Id header → match by ID
 * 2. Origin/Referer header → match by URI
 *
 * Use this guard for public routes that need client identification.
 * For authenticated routes, use AuthGuard which includes this logic.
 */
@Injectable()
export class ClientGuard implements CanActivate {
  constructor(
    @Inject(ClientsConfigToken)
    private readonly clientsConfig: ClientsConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Try explicit X-Client-Id header
    const clientId: string | undefined = request.headers?.['x-client-id'];

    if (clientId) {
      const client = this.clientsConfig.clients.get(clientId);
      if (!client) {
        throw new ForbiddenException(
          `Unknown client: ${clientId}. This client is not configured.`,
        );
      }
      request.client = client;
      return true;
    }

    // 2. Try matching origin with client URI
    const origin = extractOriginFromRequest(request);
    if (origin) {
      const client = findClientByOrigin(this.clientsConfig.clients, origin);
      if (client) {
        request.client = client;
        return true;
      }
    }

    // No client identification possible
    throw new ForbiddenException(
      'Unable to identify client. Provide X-Client-Id header or ensure Origin matches a configured client URI.',
    );
  }
}
