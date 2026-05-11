import { PaginatedResult } from '../types'

export function paginate(page = 1, limit = 20) {
  const safePage = Math.max(1, page)
  const safeLimit = Math.min(100, Math.max(1, limit))
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  }
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}
