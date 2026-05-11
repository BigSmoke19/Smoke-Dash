import { z } from 'zod'

// ─── Auth ─────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  address: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const twoFACodeSchema = z.object({
  token: z.string().length(6, '6-digit code required'),
})

// ─── Profile ──────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
})


// ─── Doctor ────────────────────────────────────────────────────

export const updateDocotorSchema = z.object({

  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().max(1000, 'Bio too long').optional(),
  specialty: z.string().min(1, 'Specialty is required').max(200, 'Specialty too long'),

})

// ─── Contact form ─────────────────────────────────────────────

export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message too short'),
})

// ─── Admin ────────────────────────────────────────────────────

export const adminResetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const createDoctorSchema = z.object({
  userId:    z.string().min(1, 'User is required'),
  specialty: z.string().min(1, 'Specialty is required').max(200, 'Too long'),
  bio:       z.string().max(1000, 'Bio too long').optional(),
})

export const auditLogFilterSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
})



// ─── Types inferred from schemas ──────────────────────────────

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
export type ContactFormData = z.infer<typeof contactFormSchema>

export type AdminResetPasswordFormData = z.infer<typeof adminResetPasswordSchema>
export type CreateDoctorFormData       = z.infer<typeof createDoctorSchema>
export type AuditLogFilterFormData     = z.infer<typeof auditLogFilterSchema>

