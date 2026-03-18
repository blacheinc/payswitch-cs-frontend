// ==================== SHARED API TYPES ====================
// Reusable types for paginated responses and query params.

/**
 * Generic paginated response matching the API's flat shape:
 * { items, total, page, per_page, total_pages }
 *
 * snake_case → camelCase mapping is done in the service layer.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/**
 * Common pagination query parameters shared across list endpoints.
 */
export interface PaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  risk?: string;
}
