import { ClientConfig } from '../config/client.config';

/**
 * Extracts the origin from request headers.
 * Tries Origin header first, then Referer.
 *
 * @param request - The HTTP request object
 * @returns The origin URL or undefined if not found/invalid
 *
 * @example
 * ```typescript
 * const origin = extractOriginFromRequest(request);
 * // Returns "https://example.com" from Origin or Referer header
 * ```
 */
export function extractOriginFromRequest(request: any): string | undefined {
  const origin = request.headers?.['origin'];
  if (origin) {
    try {
      return new URL(origin).origin;
    } catch {
      return undefined;
    }
  }

  const referer = request.headers?.['referer'];
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

/**
 * Finds a client by matching its URI with the request origin.
 *
 * @param clients - Map of client configurations
 * @param origin - The origin URL to match
 * @returns The matching ClientConfig or undefined
 *
 * @example
 * ```typescript
 * const client = findClientByOrigin(clientsConfig.clients, 'https://example.com');
 * ```
 */
export function findClientByOrigin(
  clients: Map<string, ClientConfig>,
  origin: string,
): ClientConfig | undefined {
  for (const client of clients.values()) {
    if (client.uri === origin) {
      return client;
    }
  }
  return undefined;
}

/**
 * Extract client URIs from environment variables (AUTH_CLIENT_N_URI)
 * Returns an array of valid HTTP/HTTPS origins for CORS configuration
 *
 * @param fallback - Optional fallback origins if no clients are configured
 * @returns Array of HTTP/HTTPS origins
 *
 * @example
 * ```typescript
 * import { getClientOrigins } from '@devlab-io/nest-auth';
 *
 * app.enableCors({
 *   origin: getClientOrigins(),
 *   credentials: true,
 *   allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Id'],
 * });
 * ```
 */
export function getClientOrigins(
  fallback: string[] = ['http://localhost:3000'],
): string[] {
  const origins: string[] = [];
  let index = 0;

  while (process.env[`AUTH_CLIENT_${index}_URI`]) {
    const uri = process.env[`AUTH_CLIENT_${index}_URI`];
    // Only include HTTP/HTTPS URIs (exclude deeplinks and 'none')
    if (
      uri &&
      uri !== 'none' &&
      (uri.startsWith('http://') || uri.startsWith('https://'))
    ) {
      origins.push(uri.replace(/\/$/, '')); // Remove trailing slash
    }
    index++;
  }

  // Fallback if no clients configured
  if (origins.length === 0) {
    return fallback;
  }

  return origins;
}
