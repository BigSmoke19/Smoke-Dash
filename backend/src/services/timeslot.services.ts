// timeslot.services.ts

import { prisma } from '../config/prisma'
import { writeAuditLog } from '../utils/audit'

// ─── Create Slot ─────────────────────────────────────────────

export async function createTimeSlot(data: {
  doctorId: string
  startsAt: Date
  endsAt: Date
}, actorId: string) {

  const slot = await prisma.timeSlot.create({ data })

  await writeAuditLog({
    userId: actorId,
    action: 'create',
    entityType: 'timeslot',
    entityId: slot.id,
  })

  return slot
}

// ─── Get Doctor Slots ────────────────────────────────────────

export async function getDoctorSlots(doctorId: string) {
  return prisma.timeSlot.findMany({
    where: { doctorId },
    orderBy: { startsAt: 'asc' },
  })
}

// ─── Delete Slot ─────────────────────────────────────────────

export async function deleteTimeSlot(id: string, actorId: string) {
  await prisma.timeSlot.delete({ where: { id } })

  await writeAuditLog({
    userId: actorId,
    action: 'delete',
    entityType: 'timeslot',
    entityId: id,
  })
}