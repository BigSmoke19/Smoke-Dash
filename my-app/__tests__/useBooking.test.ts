import { renderHook, waitFor, act } from '@testing-library/react'
import { useMyBookings, useCreateBooking, useCancelBooking, useConfirmBooking } from '@/hooks/useBooking'
import { apiGet, apiPost } from '@/lib/api'
import { useUiStore } from '@/store/uiStore'
import { queryClient, queryKeys } from '@/lib/queryClient'
import { createTestQueryClient, createWrapper, mockBooking } from '../jest.setup'

// ─── Typed mocks ──────────────────────────────────────────────

const mockApiGet = apiGet as jest.MockedFunction<typeof apiGet>
const mockApiPost = apiPost as jest.MockedFunction<typeof apiPost>
const mockToastSuccess = jest.fn()
const mockToastError = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  queryClient.clear()
  ;(useUiStore as unknown as jest.Mock).mockReturnValue({
    toastSuccess: mockToastSuccess,
    toastError: mockToastError,
  })
})

// ─── useMyBookings ────────────────────────────────────────────

describe('useMyBookings', () => {
  it('fetches bookings from /bookings/me', async () => {
    mockApiGet.mockResolvedValueOnce([mockBooking])
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useMyBookings(), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockApiGet).toHaveBeenCalledWith('/bookings/me')
    expect(result.current.data).toEqual([mockBooking])
  })

  it('uses the correct query key', async () => {
    mockApiGet.mockResolvedValueOnce([mockBooking])
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useMyBookings(), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockApiGet).toHaveBeenCalledTimes(1)
    const cached = qc.getQueryData(queryKeys.myBookings)
    expect(cached).toEqual([mockBooking])
  })

  it('surfaces error state when the request fails', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('Network error'))
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useMyBookings(), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})

// ─── useCreateBooking ─────────────────────────────────────────

describe('useCreateBooking', () => {
  it('posts to /bookings with the slotId', async () => {
    mockApiPost.mockResolvedValueOnce(mockBooking)
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useCreateBooking(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate('slot-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApiPost).toHaveBeenCalledWith('/bookings', { slotId: 'slot-1' })
  })

  it('shows success toast and invalidates myBookings + timeSlots on success', async () => {
    mockApiPost.mockResolvedValueOnce(mockBooking)
    const qc = createTestQueryClient()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateBooking(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate('slot-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockToastSuccess).toHaveBeenCalledWith('Booking created')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.myBookings })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.timeSlots() })
  })

  it('shows error toast on failure', async () => {
    mockApiPost.mockRejectedValueOnce({ message: 'Slot already booked' })
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useCreateBooking(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate('slot-taken')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledWith('Booking failed', 'Slot already booked')
  })
})

// ─── useCancelBooking ─────────────────────────────────────────

describe('useCancelBooking', () => {
  it('posts to /bookings/:id/cancel', async () => {
    const cancelled = { ...mockBooking, status: 'CANCELLED' as const }
    mockApiPost.mockResolvedValueOnce(cancelled)
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useCancelBooking(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate('booking-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApiPost).toHaveBeenCalledWith('/bookings/booking-1/cancel')
  })

  it('shows success toast and invalidates cache on success', async () => {
    mockApiPost.mockResolvedValueOnce({ ...mockBooking, status: 'CANCELLED' })
    const qc = createTestQueryClient()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCancelBooking(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate('booking-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockToastSuccess).toHaveBeenCalledWith('Booking cancelled')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.myBookings })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.timeSlots() })
  })

  it('shows error toast on failure', async () => {
    mockApiPost.mockRejectedValueOnce({ message: 'Booking not found' })
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useCancelBooking(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate('bad-id')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledWith('Cancellation failed', 'Booking not found')
  })
})

// ─── useConfirmBooking ────────────────────────────────────────

describe('useConfirmBooking', () => {
  it('posts to /bookings/:id/confirm', async () => {
    const confirmed = { ...mockBooking, status: 'CONFIRMED' as const }
    mockApiPost.mockResolvedValueOnce(confirmed)
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useConfirmBooking(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate('booking-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApiPost).toHaveBeenCalledWith('/bookings/booking-1/confirm')
  })

  it('shows success toast and invalidates cache on success', async () => {
    mockApiPost.mockResolvedValueOnce({ ...mockBooking, status: 'CONFIRMED' })
    const qc = createTestQueryClient()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useConfirmBooking(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate('booking-1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockToastSuccess).toHaveBeenCalledWith('Booking confirmed')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.myBookings })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.timeSlots() })
  })

  it('shows error toast on failure', async () => {
    mockApiPost.mockRejectedValueOnce({ message: 'Unauthorized' })
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useConfirmBooking(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate('booking-1')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledWith('Confirmation failed', 'Unauthorized')
  })
})
