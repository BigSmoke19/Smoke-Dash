import type { Role } from '@/types'

// ─── Permission definitions ───────────────────────────────────

export type Permission =
  // Users
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'users:suspend'

  // Doctors
  | 'doctors:read'
  | 'doctors:write'
  | 'doctors:delete'

  // Slots
  | 'slots:read'
  | 'slots:write'
  | 'slots:delete'

  // Bookings
  | 'bookings:read'
  | 'bookings:write'
  | 'bookings:cancel'

  // Audit
  | 'audit:read'

// ─── Role → permissions map ───────────────────────────────────

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    'users:read', 'users:write', 'users:delete', 'users:suspend',
    'doctors:read', 'doctors:write', 'doctors:delete',
    'slots:read', 'slots:write', 'slots:delete',
    'bookings:read', 'bookings:write', 'bookings:cancel',
    'audit:read',
  ],

  DOCTOR: [
    'doctors:read',
    'slots:read',
    'slots:write',
    'slots:delete',
    'bookings:read',
    'bookings:write', // accept/reject
  ],

  CLIENT: [
    'bookings:read',
    'bookings:write',
    'bookings:cancel',
    'doctors:read',
  ],
}
// ─── Helper functions ─────────────────────────────────────────

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p))
}

export function isAdminRole(role: Role): boolean {
  return ['ADMIN'].includes(role)
}

export function isDoctorRole(role: Role): boolean {
  return role === 'DOCTOR'
}

export function getPermissionsForRole(role: Role): Permission[] {
  return rolePermissions[role] ?? []
}