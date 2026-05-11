'use client'

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { queryKeys } from '@/lib/queryClient'
import type {
  DashboardStats,
  MonthlyDataPoint,
} from '@/types'

// ─── Admin dashboard stats ────────────────────────────────────

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: () => apiGet<DashboardStats>('/analytics/dashboard'),
    staleTime: 1000 * 60, // 1 minute
  })
}

// ─── Monthly enrollments chart ────────────────────────────────

export function useMonthlyEnrollments(months = 12) {
  return useQuery({
    queryKey: queryKeys.monthlyEnrollments(months),
    queryFn: () =>
      apiGet<MonthlyDataPoint[]>('/analytics/enrollments', { months }),
  })
}

