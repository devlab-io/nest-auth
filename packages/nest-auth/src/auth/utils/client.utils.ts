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
