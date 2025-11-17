/**
 * Extract JWT token from request (from Authorization header or cookie)
 *
 * @param request - The HTTP request
 * @param cookieName - The name of the cookie containing the token (default: 'access_token')
 * @returns The token or null if not found
 */
export function extractTokenFromRequest(
  request: any,
  cookieName: string = 'access_token',
): string | null {
  // Try to get token from Authorization header
  const authHeader: string | undefined = request.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try to get token from cookie
  const cookieToken: string | undefined = request.cookies?.[cookieName];
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}
