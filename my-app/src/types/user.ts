// ─── Enums (mirror Prisma enums) ─────────────────────────────
export type Role =
  'ADMIN' |
  'CLIENT' |
  'DOCTOR'

export type BookingStatus =
  'PENDING' |
  'CONFIRMED' |
  'CANCELLED' |
  'COMPLETED' |
  'NO_SHOW'

// ─── Audit Log ────────────────────────────────────────────────

export interface AuditLog {
  id: string
  userId?: string
  action: string
  entity: string
  entityType: string
  entityId?: string
  newValue : any
  oldValue : any
  note: string
  ipAddress?: string
  createdAt: string
}

// ─── Active Session ───────────────────────────────────────────

export interface ActiveSession {
  id: string
  userId: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  expiresAt: string
  lastUsedAt?: string
}

// ─── Core User ────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  phone?: string
  firstName: string
  lastName: string
  address?: string
  dateOfBirth?: string
  role: Role
  emailVerified: boolean
  phoneVerified: boolean
  createdAt: string
  doctor?: {
    id: string
    specialty: string
    bio?: string
  }
}

// ─── Doctor ───────────────────────────────────────────────────

export interface Doctor {
  id: string
  userId: string
  specialty: string
  bio?: string
  createdAt: string
  user?: {
    email: string
    firstName: string
    lastName: string
    phone?: string
    address?: string
  }
}


// ─── TimeSlot ─────────────────────────────────────────────────

export interface TimeSlot {
  id: string
  doctorId: string
  doctor?: Doctor
  startsAt: string
  endsAt: string
  isBooked: boolean
  createdAt: string
}

// ─── Booking ──────────────────────────────────────────────────

export interface Booking {
  id: string
  userId: string
  slotId: string
  status: BookingStatus
  createdAt: string
  slot?: TimeSlot
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>
}

// ─── Login History ────────────────────────────────────────────

export interface LoginHistory {
  id: string
  userId: string
  ipAddress?: string
  userAgent?: string
  success: boolean
  failureReason?: string
  createdAt: string
}

// ─── Auth Payloads ────────────────────────────────────────────

export interface RegisterPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  address?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: Role
  }
}

export interface UpdateProfilePayload {
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
}

// ─── Doctor Payloads ─────────────────────────────────────────

export interface CreateDoctorPayload {
  userId: string
  specialty: string
  bio?: string
}

export interface UpdateDoctorPayload {
  userID: string,
  firstName?: string,
  lastName?: string,
  phone?: string,
  address?: string,
  specialty?: string
  bio?: string
}

// ─── TimeSlot Payloads ────────────────────────────────────────

export interface CreateTimeSlotPayload {
  doctorId: string
  startsAt: string
  endsAt: string
}

// ─── Bookings Payloads ────────────────────────────────────────

export interface updateBookingStatusPayload {
  id: string
  status: BookingStatus
}

export interface deleteBookingPayload {
  id: string
}