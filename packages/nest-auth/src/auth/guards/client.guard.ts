import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import {
  ClientConfig,
  ClientsConfig,
  ClientsConfigToken,
} from '../config/client.config';

/**
 * Client Guard
 * Validates that requests have a valid X-Client-Id header and loads the ClientConfig.
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

    // Look for the client id
    const clientId: string | undefined = request.headers?.['x-client-id']; // this is case insensitive;
    if (!clientId) {
      throw new ForbiddenException(
        'Missing X-Client-Id header. Request must include a valid client identifier.',
      );
    }

    // Look for the client config
    const client: ClientConfig | undefined =
      this.clientsConfig.clients.get(clientId);
    if (!client) {
      throw new ForbiddenException(
        `Unknown client: ${clientId}. This client is not configured.`,
      );
    }

    // Store the client config in the request for the @Client() decorator
    request.client = client;

    // Done
    return true;
  }
}
