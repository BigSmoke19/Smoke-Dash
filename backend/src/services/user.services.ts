import { prisma } from '../config/prisma'
import { writeAuditLog } from '../utils/audit'
import { paginate, buildPaginatedResult } from '../utils/pagination'
import { Role } from '@prisma/client'
import { PrismaClient, Prisma } from '@prisma/client'

// ─── Get Users (Admin) ────────────────────────────────────────

export async function getUsers(query: {
  page?: number
  limit?: number
  search?: string
  role?: string
}) {
  const { skip, take } = paginate(query.page, query.limit)

  const where: any = {}

  if (query.search) {
    where.OR = [
      { email: { contains: query.search, mode: 'insensitive' } },
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  if (query.role && Object.values(Role).includes(query.role as Role)) {
    where.role = query.role
  }

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ])

  return buildPaginatedResult(data, total, query.page ?? 1, take)
}

// ─── Get Single User ──────────────────────────────────────────

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      address: true,
      createdAt: true,
    },
  })

  if (!user) throw new Error('User not found')
  return user
}

// ─── Update User Profile ──────────────────────────────────────

type DBClient = Prisma.TransactionClient | PrismaClient

export async function updateUser(
  id: string,
  data: {
    firstName?: string
    lastName?: string
    phone?: string
    address?: string
  },
  actorId?: string,tx: DBClient = prisma
) {
  const old = await prisma.user.findUnique({ where: { id } })
  if (!old) throw new Error('User not found')

  const updated = await tx.user.update({
    where: { id },
    data,
  })

  if (actorId) {
    await writeAuditLog({
      userId: actorId,
      action: 'update',
      entityType: 'user',
      entityId: id,
      oldValue: old,
      newValue: updated,
    })
  }

  return updated
}

// ─── Delete User (Hard Delete) ────────────────────────────────

export async function deleteUser(id: string, actorId: string) {
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) throw new Error('User not found')

  await prisma.user.delete({ where: { id } });

  await writeAuditLog({
    userId: actorId,
    action: 'delete',
    entityType: 'user',
    entityId: id,
    oldValue: existing,
  })
}

// ─── Login History ────────────────────────────────────────────

export async function getUserLoginHistory(
  userId: string,
  page = 1,
  limit = 20
) {
  const { skip, take } = paginate(page, limit)

  const [data, total] = await prisma.$transaction([
    prisma.loginHistory.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.loginHistory.count({ where: { userId } }),
  ])

  return buildPaginatedResult(data, total, page, take)
}

// ─── Reset Password by Admin ──────────────────────────────────

export async function adminResetUserPassword(
  userId: string,
  newPassword: string,
  actorId: string
) {
  const argon2 = await import('argon2')

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const passwordHash = await argon2.hash(newPassword)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    }),
    prisma.userSession.updateMany({
      where: { userId },
      data: { isRevoked: true },
    }),
  ])

  await writeAuditLog({
    userId: actorId,
    action: 'update',
    entityType: 'user',
    entityId: userId,
    note: 'Admin password reset',
  })
}