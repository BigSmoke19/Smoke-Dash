import { prisma } from '../config/prisma'
import { AuditAction } from '../types'

interface AuditParams {
  userId?: string
  action: AuditAction
  entityType: string
  entityId?: string
  oldValue?: object
  newValue?: object
  ipAddress?: string
  note?: string
}

export async function writeAuditLog(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValue: params.oldValue ?? undefined,
        newValue: params.newValue ?? undefined,
        ipAddress: params.ipAddress,
        note: params.note,
      },
    })
  } catch (err) {
    // Audit log failure must never crash the main flow
    console.error('Audit log write failed:', err)
  }
}
