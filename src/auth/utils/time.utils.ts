/**
 * Parse expiresIn string to milliseconds
 *
 * @param expiresIn - Expiration string (e.g., "1h", "30m", "7d")
 * @returns Expiration time in milliseconds
 */
export function parseExpiresIn(expiresIn: string): number {
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
