/**
 * Page of items.
 */
export interface Page<T> {
  /**
   * Page contents
   */
  contents: T[];

  /**
   * Page number
   */
  page: number;

  /**
   * Number of pages
   */
  pages: number;

  /**
   * Page size.
   */
  size: number;

  /**
   * Total number of items
   */
  total: number;
}
