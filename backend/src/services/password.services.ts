// password.services.ts

import { prisma } from '../config/prisma'
import { randomBytes } from 'crypto'

// ─── Create Reset Token ──────────────────────────────────────

export async function createPasswordResetToken(userId: string) {
  const token = randomBytes(32).toString('hex')

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    },
  })

  return token
}

// ─── Use Reset Token ─────────────────────────────────────────

export async function usePasswordResetToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: token },
  })

  if (!record || record.used || record.expiresAt < new Date()) {
    throw new Error('Invalid or expired token')
  }

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { used: true },
  })

  return record.userId
}