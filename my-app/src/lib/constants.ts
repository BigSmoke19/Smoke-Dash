import type { Role } from '@/types'

// ─── App ──────────────────────────────────────────────────────

export const APP_NAME = 'Smoke Dash'
export const APP_DESCRIPTION = ''
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

// ─── Pagination ───────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]


export const USER_ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  DOCTOR:'DOCTOR',
  CLIENT:'CLIENT'
}

export const ADMIN_ROLES: Role[] = [
  'ADMIN'
]

// ─── Routes ───────────────────────────────────────────────────

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',

  // User
  dashboard: '/user',
  profileSecurity: '/user/profile/security',
  userProfile : '/user/profile',
  userBookings: '/user/bookings',

  // DOCTOR
  doctorDashboard: '/doctor',
  doctorBookings: '/doctor/bookings',

  // Admin
  adminDashboard: '/admin',
  adminUsers: '/admin/users',
  adminDoctors: '/admin/doctors',
  adminBookings: '/admin/bookings',
  adminAuditLogs: '/admin/auditLogs',
  adminSlots:  '/admin/timeslots',


} as const