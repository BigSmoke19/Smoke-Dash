// booking.services.ts

import { prisma } from '../config/prisma'
import { writeAuditLog } from '../utils/audit'
import { BookingStatus } from '@prisma/client'

// ─── Create Booking ──────────────────────────────────────────

export async function createBooking(userId: string, slotId: string) {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.timeSlot.findUnique({
      where: { id: slotId },
    })

    if (!slot) throw new Error('Slot not found')
    if (slot.isBooked) throw new Error('Slot already booked')

    const booking = await tx.booking.create({
      data: {
        userId,
        slotId,
      },
    })

    await tx.timeSlot.update({
      where: { id: slotId },
      data: { isBooked: true },
    })

    return booking
  })
}

// ─── Update Booking Status ──────────────────────────────────────────

export async function updateBooking(bookingId: string, actorId: string,status: BookingStatus) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) throw new Error('Booking not found')

    await tx.booking.update({
      where: { id: bookingId },
      data: { status: status },
    })

    await writeAuditLog({
      userId: actorId,
      action: 'update',
      entityType: 'booking',
      entityId: bookingId,
      note: `Booking ${status}`,
    })

    return booking
  })
}

// -- Delete User Booking
export async function deleteBooking(bookingId: string, actorId: string) {
  // 1. Get booking first (you need slotId)
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  })

  if (!booking) {
    throw new Error("Booking not found")
  }

  // 2. Delete booking
  const deleted = await prisma.booking.delete({
    where: { id: bookingId },
  })

  // 3. Free the slot
  await prisma.timeSlot.update({
    where: { id: booking.slotId },
    data: {
      isBooked: false,
    },
  })

  // 4. Audit log
  await writeAuditLog({
    userId: actorId,
    action: "delete",
    entityType: "booking",
    entityId: bookingId,
    note: "Booking Deleted and slot freed",
  })

  return deleted
}

// ─── Get User Bookings ───────────────────────────────────────

export async function getUserBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId },

    include: {
      slot: {
        include: {
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  address: true,
                  phone: true
                },
              },
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: 'desc',
    },
  })
}

type GetDoctorBookingsParams = {
  page?: number
  limit?: number
  status?: string
}

export async function getDoctorBookings(
  doctorId: string,
  params: GetDoctorBookingsParams = {}
) {
  const { page = 1, limit = 10, status } = params

  const where: any = {
    slot: {
      doctorId,
    },
  }

  if (status) {
    where.status = status
  }

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        user: true,
        slot: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.booking.count({ where }),
  ])

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}