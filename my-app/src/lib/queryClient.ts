import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,       // 2 minutes
      gcTime: 1000 * 60 * 10,          // 10 minutes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      retry: (failureCount, error: any) => {
        // Don't retry on 401, 403, 404
        const status = error?.response?.status
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

// ─── Query Key Factory ────────────────────────────────────────
// Centralised keys prevent typo bugs and make invalidation easy

export const queryKeys = {
  // Auth
  me: ['me'] as const,

  // Users
  users: (params?: Record<string, unknown>) => ['users', params] as const,
  user: (id: string) => ['users', id] as const,
  userLoginHistory: (id: string) => ['users', id, 'login-history'] as const,

  // Doctors
  myDoctorProfile: ['doctors', 'me'] as const,
  doctors: (params?: Record<string, unknown>) => ['doctors', params] as const,
  doctor: (id: string) => ['doctors', id] as const,

  // Time Slots
  timeSlots: (doctorId?: string) =>
    doctorId ? ['timeslots', 'doctor', doctorId] as const : ['timeslots'] as const,

  // Bookings
  myBookings: ['bookings', 'me'] as const,

  // Analytics
  dashboardStats: ['dashboard-stats'] as const,
  auditLogs: (params?: Record<string, unknown>) => ['audit-logs', params] as const,
}
