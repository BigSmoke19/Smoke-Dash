import argon2 from 'argon2'
import { prisma } from '../config/prisma'
import { redis, REDIS_KEYS } from '../config/redis'
import { hashToken, generateSecureToken } from '../utils/encryption'
import { writeAuditLog } from '../utils/audit'
import { sendEmail } from './email.service'
import { env } from '../config/env'

// ─── Register ─────────────────────────────────────────────────

export async function registerUser(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  address?: string
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new Error('Email already registered')

  const passwordHash = await argon2.hash(data.password)

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address,
      role: 'CLIENT',
    },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      role: true, createdAt: true,
    },
  })

  // Send verification email
  const token = generateSecureToken()
  await redis.setex(REDIS_KEYS.otpCode(user.id), 3600, token)
  await sendEmail({
    to: user.email,
    subject: 'Verify your SmokeDash account',
    text: `Click to verify: ${env.FRONTEND_URL}/verify-email?token=${token}&userId=${user.id}`,
  })

  await writeAuditLog({ userId: user.id, action: 'create', entityType: 'user', entityId: user.id })

  return user
}

// ─── Login ────────────────────────────────────────────────────

export async function loginUser(
  email: string,
  password: string,
  ipAddress?: string,
) {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    await recordLoginHistory(null, ipAddress, false, 'User not found')
    throw new Error('Invalid credentials')
  }

  const valid = await argon2.verify(user.passwordHash, password)
  if (!valid) {
    await recordLoginHistory(user.id, ipAddress, false, 'Wrong password')
    throw new Error('Invalid credentials')
  }

  await recordLoginHistory(user.id, ipAddress, true)
  await writeAuditLog({
    userId: user.id, action: 'login', entityType: 'user',
    entityId: user.id, ipAddress,
  })

  return {
    user: {
      id: user.id, email: user.email, firstName: user.firstName,
      lastName: user.lastName, role: user.role, 
    },
  }
}

// ─── Verify Email ─────────────────────────────────────────────

export async function verifyEmail(userId: string, token: string) {
  const stored = await redis.get(REDIS_KEYS.otpCode(userId))
  if (!stored || stored !== token) throw new Error('Invalid or expired token')

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true, status: 'active' },
  })
  await redis.del(REDIS_KEYS.otpCode(userId))
}

// ─── Password Reset ───────────────────────────────────────────

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return // Silent — don't reveal if email exists

  const token = generateSecureToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  })

  await sendEmail({
    to: user.email,
    subject: 'Reset your SmokeDash password',
    text: `Reset link: ${env.FRONTEND_URL}/reset-password?token=${token}`,
  })
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashToken(token)
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })

  if (!record || record.used || record.expiresAt < new Date()) {
    throw new Error('Invalid or expired reset token')
  }

  const passwordHash = await argon2.hash(newPassword)

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { tokenHash }, data: { used: true } }),
    // Revoke all existing sessions
    prisma.userSession.updateMany({
      where: { userId: record.userId },
      data: { isRevoked: true },
    }),
  ])
}

// ─── Session Management ───────────────────────────────────────

export async function createSession(
  userId: string,
  refreshToken: string,
  ipAddress?: string,
) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days
  await prisma.userSession.create({
    data: { userId, refreshToken, ipAddress, expiresAt },
  })
}

export async function revokeSession(refreshToken: string) {
  await prisma.userSession.updateMany({
    where: { refreshToken },
    data: { isRevoked: true },
  })
}

export async function revokeAllSessions(userId: string) {
  await prisma.userSession.updateMany({
    where: { userId },
    data: { isRevoked: true },
  })
}

export async function getValidSession(refreshToken: string) {
  return prisma.userSession.findFirst({
    where: { refreshToken, isRevoked: false, expiresAt: { gt: new Date() } },
    include: { user: { select: { id: true, email: true, role: true,} } },
  })
}

// ─── Internal helpers ─────────────────────────────────────────

async function recordLoginHistory(
  userId: string | null,
  ipAddress?: string,
  success?: boolean,
  failureReason?: string
) {
  if (!userId) return
  await prisma.loginHistory.create({
    data: { userId, ipAddress, success: success ?? false, failureReason },
  })
}
