'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api'
import { queryClient, queryKeys } from '@/lib/queryClient'
import { useUiStore } from '@/store/uiStore'
import { extractApiError } from '@/lib/utils'
import type {
  Doctor,
  CreateDoctorPayload,
  UpdateDoctorPayload,
  PaginatedResult,
  SearchParams,
} from '@/types'

// ─── Fetch own doctor profile ─────────────────────────────────

export function useMyDoctorProfile() {
  return useQuery({
    queryKey: queryKeys.myDoctorProfile,
    queryFn: () => apiGet<Doctor>('/doctors/me'),
  })
}

// ─── fetch all doctors ─────────────────────────────────

export function useDoctors(params: SearchParams = {}) {
  return useQuery({
    queryKey: queryKeys.doctors(params as Record<string, unknown>),
    queryFn: () =>
      apiGet<PaginatedResult<Doctor>>('/doctors', params as Record<string, unknown>),
  })
}

// ─── Admin: fetch single doctor ───────────────────────────────

export function useDoctor(id: string) {
  return useQuery({
    queryKey: queryKeys.doctor(id),
    queryFn: () => apiGet<Doctor>(`/doctors/${id}`),
    enabled: !!id,
  })
}

// ─── Admin: create doctor ─────────────────────────────────────

export function useCreateDoctor() {
  const { toastSuccess, toastError } = useUiStore()

  return useMutation({
    mutationFn: (payload: CreateDoctorPayload) =>
      apiPost<Doctor>('/doctors', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors() })
      toastSuccess('Doctor created')
    },
    onError: (error) => {
      toastError('Create failed', extractApiError(error))
    },
  })
}

// ─── Admin: update doctor ─────────────────────────────────────

export function useUpdateDoctor(id: string) {
  const { toastSuccess, toastError } = useUiStore()

  return useMutation({
    mutationFn: (payload: UpdateDoctorPayload) =>
      apiPatch<Doctor>(`/doctors/full/${id}`, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.doctor(id), data)
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors() })
      toastSuccess('Doctor updated')
    },
    onError: (error) => {
      toastError('Update failed', extractApiError(error))
    },
  })
}

// ─── Admin: delete doctor ─────────────────────────────────────

export function useDeleteDoctor(id: string) {
  const { toastSuccess, toastError } = useUiStore()

  return useMutation({
    mutationFn: () => apiDelete(`/doctors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors() })
      toastSuccess('Doctor deleted')
    },
    onError: (error) => {
      toastError('Delete failed', extractApiError(error))
    },
  })
}
