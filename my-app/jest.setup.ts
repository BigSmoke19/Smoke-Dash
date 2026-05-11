import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { ReactNode } from 'react'

// ─── Mock modules ─────────────────────────────────────────────

jest.mock('@/lib/api', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
  apiDelete: jest.fn(),
}))

jest.mock('@/store/uiStore', () => ({
  useUiStore: jest.fn(() => ({
    toastSuccess: jest.fn(),
    toastError: jest.fn(),
  })),
}))

jest.mock('@/lib/queryClient', () => {
  const { QueryClient } = require('@tanstack/react-query')
  const { queryKeys } = jest.requireActual('@/lib/queryClient')
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return { queryClient: qc, queryKeys }
})

// ─── Test QueryClient factory ─────────────────────────────────
// Each test should create a fresh one to avoid state bleed

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

export function createWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children)
  }
}

// ─── Shared mock data ─────────────────────────────────────────

export const mockDoctor = {
  id: 'doctor-1',
  userId: 'user-1',
  specialty: 'Cardiology',
  bio: 'Expert cardiologist',
  createdAt: '2024-01-01T00:00:00.000Z',
  user: {
    email: 'dr.smith@clinic.com',
    firstName: 'John',
    lastName: 'Smith',
    phone: '+1234567890',
  },
}

export const mockTimeSlot = {
  id: 'slot-1',
  doctorId: 'doctor-1',
  startsAt: '2024-06-01T09:00:00.000Z',
  endsAt: '2024-06-01T09:30:00.000Z',
  isBooked: false,
  createdAt: '2024-01-01T00:00:00.000Z',
}

export const mockBooking = {
  id: 'booking-1',
  userId: 'user-1',
  slotId: 'slot-1',
  status: 'PENDING' as const,
  createdAt: '2024-01-01T00:00:00.000Z',
  slot: mockTimeSlot,
}

export const mockPaginatedDoctors = {
  data: [mockDoctor],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
}
