'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { apiGet, apiPatch, apiPost } from '@/lib/api'
import { queryClient, queryKeys } from '@/lib/queryClient'
import { useUiStore } from '@/store/uiStore'
import { extractApiError } from '@/lib/utils'
import type { Booking, BookingStatus, PaginatedResult, SearchParams,deleteBookingPayload, updateBookingStatusPayload } from '@/types'

// ─── Fetch my bookings ────────────────────────────────────────

export function useMyBookings() {
  return useQuery({
    queryKey: queryKeys.myBookings,
    queryFn: () => apiGet<Booking[]>('/bookings/me'),
  })
}

// ─── Create booking ───────────────────────────────────────────

export function useCreateBooking() {
  const { toastSuccess, toastError } = useUiStore()

  return useMutation({
    mutationFn: (slotId: string) =>
      apiPost<Booking>('/bookings', { slotId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myBookings })
      queryClient.invalidateQueries({ queryKey: queryKeys.timeSlots() })
      toastSuccess('Booking created')
    },
    onError: (error) => {
      toastError('Booking failed', extractApiError(error))
    },
  })
}


// ─── Doctor: fetch my bookings ────────────────────────────────

export function useDoctorBookings(params: SearchParams & { status?: string } = {}) {
  return useQuery({
    queryKey: ['bookings', 'doctor', params.page, params.limit, params.status],
    queryFn: () => apiGet<PaginatedResult<Booking>>('/bookings/doctor', params as Record<string, unknown>),
  }) 
}

// ─── (Admin,Doctor): update booking Status ───────────────────────────────────

export function useUpdateBookingStatus() {
  const { toastSuccess, toastError } = useUiStore()

  return useMutation({
    mutationFn: (payload : updateBookingStatusPayload) =>
      apiPatch<Booking>(`/bookings/update/`,payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'doctor'] })
      toastSuccess('Booking Updated')
    },
    onError: (error) => {
      toastError('Failed to update', extractApiError(error))
    },
  })
}

// ─── (Admin,Doctor): delet booking ───────────────────────────────────

export function useDeleteBooking() {
  const { toastSuccess, toastError } = useUiStore()

  return useMutation({
    mutationFn: (payload : deleteBookingPayload) =>
      apiPatch<Booking>(`/bookings/delete/`,payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'doctor'] })
      toastSuccess('Booking Deleted')
    },
    onError: (error) => {
      toastError('Failed to delete', extractApiError(error))
    },
  })
}


// ─── Admin: all bookings ──────────────────────────────────────

export function useAllBookings(params: SearchParams & { status?: string } = {}) {
  return useQuery({
    queryKey: ['bookings', 'admin', params],
    queryFn: () => apiGet<PaginatedResult<Booking>>('/bookings', params as Record<string, unknown>),
  })
}
