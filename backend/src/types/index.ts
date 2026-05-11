// types
export interface User{
  id: string                   
  firstName: string           
  lastName: string             
  email: string               
  phone?: string                
  address?: string                   
  role: string                                         
  createdAt: string            
}



// ─── Enums (mirror Prisma enums) ─────────────────────────────
export type Role = 
  'ADMIN'|
  'CLIENT'|
  'DOCTOR'

export type BookingStatus =
  'PENDING'|
  'CONFIRMED'|
  'CANCELLED'|
  'COMPLETED'|
  'NO_SHOW'

// ─── JWT Payload ─────────────────────────────────────────────

export interface JwtPayload {
  sub: string       // user id
  email: string
  role: Role
  iat?: number
  exp?: number
}

// ─── Fastify Request User ─────────────────────────────────────

export interface RequestUser {
  id: string
  email: string
  role: Role
}

// ─── Pagination ───────────────────────────────────────────────

export interface PaginationQuery {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ─── API Response ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

// --- Audit -----

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'submit'
  | 'broadcast'
