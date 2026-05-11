import { renderHook, waitFor, act } from '@testing-library/react'
import {
  useDoctorTimeSlots,
  useCreateTimeSlot,
  useDeleteTimeSlot,
} from '@/hooks/useTimeSlot'
import { apiGet, apiPost, apiDelete } from '@/lib/api'
import { useUiStore } from '@/store/uiStore'
import { queryClient, queryKeys } from '@/lib/queryClient'
import { createTestQueryClient, createWrapper, mockTimeSlot } from '../jest.setup'

// ─── Typed mocks ──────────────────────────────────────────────

const mockApiGet = apiGet as jest.MockedFunction<typeof apiGet>
const mockApiPost = apiPost as jest.MockedFunction<typeof apiPost>
const mockApiDelete = apiDelete as jest.MockedFunction<typeof apiDelete>
const mockToastSuccess = jest.fn()
const mockToastError = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  queryClient.clear()
  ;(useUiStore as unknown as  jest.Mock).mockReturnValue({
    toastSuccess: mockToastSuccess,
    toastError: mockToastError,
  })
})

// ─── useDoctorTimeSlots ───────────────────────────────────────

describe('useDoctorTimeSlots', () => {
  it('fetches slots for the given doctorId', async () => {
    mockApiGet.mockResolvedValueOnce([mockTimeSlot])
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useDoctorTimeSlots('doctor-1'), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockApiGet).toHaveBeenCalledWith('/timeslots/doctor/doctor-1')
    expect(result.current.data).toEqual([mockTimeSlot])
  })

  it('uses a scoped cache key including the doctorId', async () => {
    mockApiGet.mockResolvedValueOnce([mockTimeSlot])
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useDoctorTimeSlots('doctor-1'), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = qc.getQueryData(queryKeys.timeSlots('doctor-1'))
    expect(cached).toEqual([mockTimeSlot])
  })

  it('is disabled when doctorId is empty', () => {
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useDoctorTimeSlots(''), {
      wrapper: createWrapper(qc),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockApiGet).not.toHaveBeenCalled()
  })

  it('does not share cache between different doctorIds', async () => {
    mockApiGet
      .mockResolvedValueOnce([mockTimeSlot])
      .mockResolvedValueOnce([{ ...mockTimeSlot, id: 'slot-2', doctorId: 'doctor-2' }])

    const qc = createTestQueryClient()

    const { result: r1 } = renderHook(() => useDoctorTimeSlots('doctor-1'), {
      wrapper: createWrapper(qc),
    })
    const { result: r2 } = renderHook(() => useDoctorTimeSlots('doctor-2'), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => expect(r1.current.isSuccess).toBe(true))
    await waitFor(() => expect(r2.current.isSuccess).toBe(true))

    expect(r1.current.data?.[0].doctorId).toBe('doctor-1')
    expect(r2.current.data?.[0].doctorId).toBe('doctor-2')
  })

  it('sets error state when the request fails', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('Forbidden'))
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useDoctorTimeSlots('doctor-1'), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ─── useCreateTimeSlot ────────────────────────────────────────

describe('useCreateTimeSlot', () => {
  const payload = {
    doctorId: 'doctor-1',
    startsAt: '2024-06-01T09:00:00.000Z',
    endsAt: '2024-06-01T09:30:00.000Z',
  }

  it('posts to /timeslots with the payload', async () => {
    mockApiPost.mockResolvedValueOnce(mockTimeSlot)
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useCreateTimeSlot(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate(payload)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApiPost).toHaveBeenCalledWith('/timeslots', payload)
  })

  it('shows success toast and invalidates the correct doctor slot list', async () => {
    mockApiPost.mockResolvedValueOnce(mockTimeSlot) // doctorId = 'doctor-1'
    const qc = createTestQueryClient()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateTimeSlot(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate(payload)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockToastSuccess).toHaveBeenCalledWith('Time slot created')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.timeSlots('doctor-1'),
    })
  })

  it('only invalidates slots for the doctor on the returned slot, not all doctors', async () => {
    const otherDoctorSlot = { ...mockTimeSlot, doctorId: 'doctor-99' }
    mockApiPost.mockResolvedValueOnce(otherDoctorSlot)
    const qc = createTestQueryClient()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateTimeSlot(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate({ ...payload, doctorId: 'doctor-99' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.timeSlots('doctor-99'),
    })
    expect(invalidateSpy).not.toHaveBeenCalledWith({
      queryKey: queryKeys.timeSlots('doctor-1'),
    })
  })

  it('shows error toast on failure', async () => {
    mockApiPost.mockRejectedValueOnce({ message: 'Overlapping slot' })
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useCreateTimeSlot(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate(payload)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledWith('Create failed', 'Overlapping slot')
  })
})

// ─── useDeleteTimeSlot ────────────────────────────────────────

describe('useDeleteTimeSlot', () => {
  it('calls DELETE /timeslots/:id', async () => {
    mockApiDelete.mockResolvedValueOnce(undefined)
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useDeleteTimeSlot(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate({ id: 'slot-1', doctorId: 'doctor-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApiDelete).toHaveBeenCalledWith('/timeslots/slot-1')
  })

  it('shows success toast and invalidates the correct doctor slot list', async () => {
    mockApiDelete.mockResolvedValueOnce(undefined)
    const qc = createTestQueryClient()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteTimeSlot(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate({ id: 'slot-1', doctorId: 'doctor-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockToastSuccess).toHaveBeenCalledWith('Time slot deleted')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.timeSlots('doctor-1'),
    })
  })

  it('scopes invalidation to the provided doctorId', async () => {
    mockApiDelete.mockResolvedValueOnce(undefined)
    const qc = createTestQueryClient()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteTimeSlot(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate({ id: 'slot-5', doctorId: 'doctor-42' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.timeSlots('doctor-42'),
    })
    expect(invalidateSpy).not.toHaveBeenCalledWith({
      queryKey: queryKeys.timeSlots('doctor-1'),
    })
  })

  it('shows error toast on failure', async () => {
    mockApiDelete.mockRejectedValueOnce({ message: 'Slot already booked' })
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useDeleteTimeSlot(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate({ id: 'slot-1', doctorId: 'doctor-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledWith('Delete failed', 'Slot already booked')
  })
})
