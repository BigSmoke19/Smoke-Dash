// ─── API Response Wrapper ─────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
  details?: unknown
}

// ─── Pagination ───────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  limit?: number
}

// ─── Sort & Filter ────────────────────────────────────────────

export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ─── Shared query params ──────────────────────────────────────

export interface SearchParams extends PaginationParams {
  search?: string
}