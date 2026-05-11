'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { apiGet, apiPatch, apiPost, apiDelete } from '@/lib/api'
import { queryClient, queryKeys } from '@/lib/queryClient'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { extractApiError } from '@/lib/utils'
import type {
  User,
  UpdateProfilePayload,
  PaginatedResult,
  LoginHistory,
  SearchParams,
  AuditLog,
  ActiveSession,
} from '@/types'

// ─── Fetch current user (me) ─────────────────────────────────

export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => apiGet<User>('/users/me'),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// ─── Fetch all users (admin) ──────────────────────────────────

export function useUsers(params: SearchParams & { role?: string; status?: string } = {}) {
    return useQuery({
    queryKey: queryKeys.users(params as Record<string, unknown>),
    queryFn: () => apiGet<PaginatedResult<User>>('/users', params as Record<string, unknown>),
  })
}

// ─── Fetch single user (admin) ───────────────────────────────

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => apiGet<User>(`/users/${id}`),
    enabled: !!id,
  })
}

// ─── Update own profile ───────────────────────────────────────

export function useUpdateProfile() {
  const { setUser } = useAuthStore()
  const { toastSuccess, toastError } = useUiStore()

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      apiPatch<User>('/users/me', payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.me, data)
      setUser({ firstName: data.firstName, lastName: data.lastName })
      toastSuccess('Profile updated successfully')
    },
    onError: (error) => {
      toastError('Update failed', extractApiError(error))
    },
  })
}

// ─── Admin: update any user ───────────────────────────────────

export function useUpdateUser(id: string) {
  const { toastSuccess, toastError } = useUiStore()

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      apiPatch<User>(`/users/${id}`, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user(id), data)
      queryClient.invalidateQueries({ queryKey: queryKeys.users() })
      toastSuccess('User updated')
    },
    onError: (error) => {
      toastError('Update failed', extractApiError(error))
    },
  })
}

// ─── Admin: set user status ───────────────────────────────────

export function useSetUserStatus(id: string) {
  const { toastSuccess, toastError } = useUiStore()

  return useMutation({
    mutationFn: (status: 'active' | 'suspended') =>
      apiPatch(`/users/${id}/status`, { status }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users() })
      toastSuccess(`User ${status === 'active' ? 'activated' : 'suspended'}`)
    },
    onError: (error) => {
      toastError('Action failed', extractApiError(error))
    },
  })
}

// ─── Admin: delete user (GDPR) ───────────────────────────────

export function useDeleteUser(id: string) {
  const { toastSuccess, toastError } = useUiStore()

  return useMutation({
    mutationFn: () => apiDelete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() })
      toastSuccess('User deleted')
    },
    onError: (error) => {
      toastError('Delete failed', extractApiError(error))
    },
  })
}

// ─── Admin: reset password ────────────────────────────────────

export function useAdminResetPassword(id: string) {
  const { toastSuccess, toastError } = useUiStore()

  return useMutation({
    mutationFn: (newPassword: string) =>
      apiPost(`/users/${id}/reset-password`, { newPassword }),
    onSuccess: () => {
      toastSuccess('Password reset successfully')
    },
    onError: (error) => {
      toastError('Reset failed', extractApiError(error))
    },
  })
}

// ─── Login history ────────────────────────────────────────────

export function useLoginHistory(id: string, params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.userLoginHistory(id),
    queryFn: () =>
      apiGet<PaginatedResult<LoginHistory>>(`/users/${id}/login-history`, params as Record<string, unknown>),
    enabled: !!id,
  })
}

// ─── Admin: audit logs ────────────────────────────────────────

export function useAuditLogs(params: { page?: number; limit?: number; userId?: string; action?: string; entity?: string;entityType?: string } = {}) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () =>
      apiGet<PaginatedResult<AuditLog>>('/audit-logs', params as Record<string, unknown>),
  })
}

// ─── Admin: active sessions ───────────────────────────────────

export function useActiveSessions(userId: string) {
  return useQuery({
    queryKey: ['users', userId, 'sessions'],
    queryFn: () => apiGet<ActiveSession[]>(`/users/${userId}/sessions`),
    enabled: !!userId,
  })
}

// ─── Admin: revoke session ────────────────────────────────────

export function useRevokeSession(userId: string) {
  const { toastSuccess, toastError } = useUiStore()

  return useMutation({
    mutationFn: (sessionId: string) =>
      apiPost(`/users/${userId}/sessions/${sessionId}/revoke`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', userId, 'sessions'] })
      toastSuccess('Session revoked')
    },
    onError: (error) => {
      toastError('Revoke failed', extractApiError(error))
    },
  })
}

// ─── Admin: approve doctor ────────────────────────────────────

export function useApproveDoctor() {
  const { toastSuccess, toastError } = useUiStore()

  return useMutation({
    mutationFn: (doctorId: string) =>
      apiPost(`/doctors/${doctorId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      toastSuccess('Doctor approved')
    },
    onError: (error) => {
      toastError('Approval failed', extractApiError(error))
    },
  })
}