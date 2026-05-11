'use client'
 
import { useState, useCallback } from 'react'

 
interface UsePaginationOptions {
  initialPage?: number
  initialLimit?: number
}
 
export function usePagination(options: UsePaginationOptions = {}) {
  const [page, setPage] = useState(options.initialPage ?? 1)
  const [limit, setLimit] = useState(options.initialLimit ?? 20)
 
  const goTo = useCallback((p: number) => setPage(p), [])
  const next = useCallback(() => setPage((p) => p + 1), [])
  const prev = useCallback(() => setPage((p) => Math.max(1, p - 1)), [])
  const reset = useCallback(() => setPage(1), [])
  const changeLimit = useCallback((l: number) => {
    setLimit(l)
    setPage(1)
  }, [])
 
  return { page, limit, goTo, next, prev, reset, changeLimit }
}