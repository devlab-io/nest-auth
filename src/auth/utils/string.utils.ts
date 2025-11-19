/**
 * Normalize a string by removing accents and keeping only lowercase letters a-z and digits 0-9
 *
 * @param str - The string to normalize
 * @returns The normalized string
 */
export function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .replace(/[^a-z0-9]/g, ''); // Keep only a-z and 0-9
}

/**
 * Capitalize the first letter of each word in a string
 *
 * @param str - The string to capitalize
 * @returns The string with first letter of each word capitalized
 */
export function capitalize(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + (word.length > 1 ? word.slice(1) : ''),
    )
    .join(' ');
}

/**
 * Clean a route by removing leading and trailing slashes
 * This ensures consistent route formatting (e.g., 'auth/reset-password' instead of '/auth/reset-password/')
 * Can also be used for URLs to remove trailing slashes (e.g., 'https://example.com' instead of 'https://example.com/')
 *
 * @param url - The route or URL to clean
 * @returns The cleaned route/URL without leading/trailing slashes
 */
export function route(url: string | undefined): string {
  if (!url) {
    return '';
  }
  // Remove leading slash if present
  url = url.startsWith('/') ? url.slice(1) : url;
  // Remove trailing slash if present
  url = url.endsWith('/') ? url.slice(0, -1) : url;
  // Done
  return url;
}
