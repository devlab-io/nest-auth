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
