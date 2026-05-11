'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { apiGet, apiPost, apiDelete } from '@/lib/api'
import { queryClient, queryKeys } from '@/lib/queryClient'
import { useUiStore } from '@/store/uiStore'
import { extractApiError } from '@/lib/utils'
import type { TimeSlot, CreateTimeSlotPayload } from '@/types'

// ─── Fetch slots for a doctor ─────────────────────────────────

export function useDoctorTimeSlots(doctorId: string) {
  return useQuery({
    queryKey: queryKeys.timeSlots(doctorId),
    queryFn: () => apiGet<TimeSlot[]>(`/slots/doctor/${doctorId}`),
    enabled: !!doctorId,
  })
}

// ─── Admin: create time slot ──────────────────────────────────

export function useCreateTimeSlot() {
  const { toastSuccess, toastError } = useUiStore()

  return useMutation({
    mutationFn: (payload: CreateTimeSlotPayload) =>
      apiPost<TimeSlot>('/slots', payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timeSlots(data.doctorId) })
      toastSuccess('Time slot created')
    },
    onError: (error) => {
      toastError('Create failed', extractApiError(error))
    },
  })
}

// ─── Admin: delete time slot ──────────────────────────────────

export function useDeleteTimeSlot() {
  const { toastSuccess, toastError } = useUiStore()

  return useMutation({
    mutationFn: ({ id, doctorId }: { id: string; doctorId: string }) =>
      apiDelete(`/slots/${id}`).then(() => ({ doctorId })),
    onSuccess: ({ doctorId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timeSlots(doctorId) })
      toastSuccess('Time slot deleted')
    },
    onError: (error) => {
      toastError('Delete failed', extractApiError(error))
    },
  })
}
