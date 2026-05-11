import { prisma } from '../config/prisma'
import {
  Prisma,
  AuditAction,
} from '@prisma/client'

interface GetAuditLogsParams {
  page?: number
  limit?: number

  entityType?: string
  entityId?: string
  action?: string
  userId?: string
}

export async function getAuditLogs({
  page = 1,
  limit = 20,

  entityType,
  entityId,
  action,
  userId,
}: GetAuditLogsParams) {
  const skip = (page - 1) * limit

  const where: Prisma.AuditLogWhereInput = {}

  // STRING FIELD
  if (entityType?.trim()) {
    where.entityType = {
      contains: entityType.trim(),
      mode: 'insensitive',
    }
  }

  // UUID FIELD
  if (entityId?.trim()) {
    where.entityId = entityId.trim()
  }

  // UUID FIELD
  if (userId?.trim()) {
    where.userId = userId.trim()
  }

  // ENUM FIELD
  if (
    action &&
    Object.values(AuditAction).includes(
      action.toLowerCase() as AuditAction
    )
  ) {
    where.action =
      action.toLowerCase() as AuditAction
  }

  const [data, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    }),

    prisma.auditLog.count({
      where,
    }),
  ])

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}