import { renderHook, waitFor, act } from '@testing-library/react'
import {
  useMyDoctorProfile,
  useDoctors,
  useDoctor,
  useCreateDoctor,
  useUpdateDoctor,
  useDeleteDoctor,
} from '@/hooks/useDoctor'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api'
import { useUiStore } from '@/store/uiStore'
import { queryClient, queryKeys } from '@/lib/queryClient'
import {
  createTestQueryClient,
  createWrapper,
  mockDoctor,
  mockPaginatedDoctors,
} from '../jest.setup'

// ─── Typed mocks ──────────────────────────────────────────────

const mockApiGet = apiGet as jest.MockedFunction<typeof apiGet>
const mockApiPost = apiPost as jest.MockedFunction<typeof apiPost>
const mockApiPatch = apiPatch as jest.MockedFunction<typeof apiPatch>
const mockApiDelete = apiDelete as jest.MockedFunction<typeof apiDelete>
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

// ─── useMyDoctorProfile ───────────────────────────────────────

describe('useMyDoctorProfile', () => {
  it('fetches from /doctors/me', async () => {
    mockApiGet.mockResolvedValueOnce(mockDoctor)
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useMyDoctorProfile(), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockApiGet).toHaveBeenCalledWith('/doctors/me')
    expect(result.current.data).toEqual(mockDoctor)
  })

  it('uses the myDoctorProfile query key', async () => {
    mockApiGet.mockResolvedValueOnce(mockDoctor)
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useMyDoctorProfile(), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = qc.getQueryData(queryKeys.myDoctorProfile)
    expect(cached).toEqual(mockDoctor)
  })

  it('sets error state when request fails', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('Not found'))
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useMyDoctorProfile(), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ─── useDoctors ───────────────────────────────────────────────

describe('useDoctors', () => {
  it('fetches paginated doctors with no params', async () => {
    mockApiGet.mockResolvedValueOnce(mockPaginatedDoctors)
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useDoctors(), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockApiGet).toHaveBeenCalledWith('/doctors', {})
    expect(result.current.data).toEqual(mockPaginatedDoctors)
  })

  it('passes search/pagination params to the API', async () => {
    mockApiGet.mockResolvedValueOnce(mockPaginatedDoctors)
    const qc = createTestQueryClient()
    const params = { page: 2, limit: 10, search: 'cardio' }

    const { result } = renderHook(() => useDoctors(params), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockApiGet).toHaveBeenCalledWith('/doctors', params)
  })

  it('scopes the cache key by params', async () => {
    mockApiGet.mockResolvedValue(mockPaginatedDoctors)
    const qc = createTestQueryClient()
    const params = { search: 'neuro' }

    const { result } = renderHook(() => useDoctors(params), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = qc.getQueryData(queryKeys.doctors(params))
    expect(cached).toEqual(mockPaginatedDoctors)
  })
})

// ─── useDoctor ────────────────────────────────────────────────

describe('useDoctor', () => {
  it('fetches a single doctor by id', async () => {
    mockApiGet.mockResolvedValueOnce(mockDoctor)
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useDoctor('doctor-1'), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockApiGet).toHaveBeenCalledWith('/doctors/doctor-1')
    expect(result.current.data).toEqual(mockDoctor)
  })

  it('is disabled when id is empty', () => {
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useDoctor(''), {
      wrapper: createWrapper(qc),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockApiGet).not.toHaveBeenCalled()
  })

  it('sets error state when request fails', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('Not found'))
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useDoctor('bad-id'), {
      wrapper: createWrapper(qc),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ─── useCreateDoctor ──────────────────────────────────────────

describe('useCreateDoctor', () => {
  const payload = { userId: 'user-2', specialty: 'Neurology', bio: 'Brain specialist' }

  it('posts to /doctors with the payload', async () => {
    mockApiPost.mockResolvedValueOnce({ ...mockDoctor, ...payload })
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useCreateDoctor(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate(payload)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApiPost).toHaveBeenCalledWith('/doctors', payload)
  })

  it('shows success toast and invalidates doctors list', async () => {
    mockApiPost.mockResolvedValueOnce({ ...mockDoctor, ...payload })
    const qc = createTestQueryClient()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateDoctor(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate(payload)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockToastSuccess).toHaveBeenCalledWith('Doctor created')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.doctors() })
  })

  it('shows error toast on failure', async () => {
    mockApiPost.mockRejectedValueOnce({ message: 'User already a doctor' })
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useCreateDoctor(), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate(payload)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledWith('Create failed', 'User already a doctor')
  })
})

// ─── useUpdateDoctor ──────────────────────────────────────────

describe('useUpdateDoctor', () => {
  const updatePayload = { specialty: 'Oncology', bio: 'Cancer research' }
  const updatedDoctor = { ...mockDoctor, ...updatePayload }

  it('patches /doctors/:id with the payload', async () => {
    mockApiPatch.mockResolvedValueOnce(updatedDoctor)
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useUpdateDoctor('doctor-1'), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate(updatePayload)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApiPatch).toHaveBeenCalledWith('/doctors/doctor-1', updatePayload)
  })

  it('sets query data and invalidates doctors list on success', async () => {
    mockApiPatch.mockResolvedValueOnce(updatedDoctor)
    const qc = createTestQueryClient()
    const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData')
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateDoctor('doctor-1'), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate(updatePayload)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockToastSuccess).toHaveBeenCalledWith('Doctor updated')
    expect(setQueryDataSpy).toHaveBeenCalledWith(queryKeys.doctor('doctor-1'), updatedDoctor)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.doctors() })
  })

  it('shows error toast on failure', async () => {
    mockApiPatch.mockRejectedValueOnce({ message: 'Doctor not found' })
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useUpdateDoctor('bad-id'), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate(updatePayload)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledWith('Update failed', 'Doctor not found')
  })
})

// ─── useDeleteDoctor ──────────────────────────────────────────

describe('useDeleteDoctor', () => {
  it('calls DELETE /doctors/:id', async () => {
    mockApiDelete.mockResolvedValueOnce(undefined)
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useDeleteDoctor('doctor-1'), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockApiDelete).toHaveBeenCalledWith('/doctors/doctor-1')
  })

  it('shows success toast and invalidates doctors list', async () => {
    mockApiDelete.mockResolvedValueOnce(undefined)
    const qc = createTestQueryClient()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteDoctor('doctor-1'), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockToastSuccess).toHaveBeenCalledWith('Doctor deleted')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.doctors() })
  })

  it('shows error toast on failure', async () => {
    mockApiDelete.mockRejectedValueOnce({ message: 'Forbidden' })
    const qc = createTestQueryClient()

    const { result } = renderHook(() => useDeleteDoctor('doctor-1'), {
      wrapper: createWrapper(qc),
    })

    await act(async () => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockToastError).toHaveBeenCalledWith('Delete failed', 'Forbidden')
  })
})
