// session.services.ts

import { prisma } from '../config/prisma'

// ─── Create Session ──────────────────────────────────────────

export async function createSession(data: {
  userId: string
  refreshToken: string
  ipAddress?: string
  expiresAt: Date
}) {
  return prisma.userSession.create({ data })
}

// ─── Revoke Session ──────────────────────────────────────────

export async function revokeSession(refreshToken: string) {
  return prisma.userSession.update({
    where: { refreshToken },
    data: { isRevoked: true },
  })
}

// ─── Validate Session ────────────────────────────────────────

export async function validateSession(refreshToken: string) {
  const session = await prisma.userSession.findUnique({
    where: { refreshToken },
  })

  if (!session || session.isRevoked) return null
  if (session.expiresAt < new Date()) return null

  return session
}