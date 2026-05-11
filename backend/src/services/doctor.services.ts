// doctor.services.ts

import { prisma } from '../config/prisma'
import { paginate, buildPaginatedResult } from '../utils/pagination'
import { writeAuditLog } from '../utils/audit'
import { updateUser } from './user.services'
import { PrismaClient, Prisma } from '@prisma/client'

// ─── Get Doctors ─────────────────────────────────────────────

export async function getDoctors(query: {
  page?: number
  limit?: number
  search?: string
}) {
  const { skip, take } = paginate(query.page, query.limit)

  const where: Prisma.DoctorWhereInput = {}

  if (query.search) {
    where.OR = [
      {
        user: {
          email: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      },
      {
        user: {
          firstName: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      },
      {
        user: {
          lastName: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      },
      {
        specialty: {
          contains: query.search,
          mode: 'insensitive',
        },
      },
    ]
  }

  const [data, total] = await prisma.$transaction([
    prisma.doctor.findMany({
      where,
      skip,
      take,

      include: {
        user: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    }),

    prisma.doctor.count({ where }),
  ])

  return buildPaginatedResult(
    data,
    total,
    query.page ?? 1,
    take
  )
}

// ─── Get Doctor By ID ────────────────────────────────────────

export async function getDoctorById(id: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: { slots: true },
  })

  if (!doctor) throw new Error('Doctor not found')
  return doctor
}

// ─── Create Doctor ───────────────────────────────────────────

export async function createDoctor(data: {
  userId: string
  specialty: string
  bio?: string
}, actorId: string) {

  const doctor = await prisma.doctor.create({ data })

  await writeAuditLog({
    userId: actorId,
    action: 'create',
    entityType: 'doctor',
    entityId: doctor.id,
  })

  return doctor
}

// ─── Update Doctor ───────────────────────────────────────────

type DBClient = Prisma.TransactionClient | PrismaClient

export async function updateDoctor(id: string, data: any, actorId: string,tx : DBClient = prisma) {
  const doctor = await tx.doctor.update({
    where: { id },
    data,
  })

  await writeAuditLog({
    userId: actorId,
    action: 'update',
    entityType: 'doctor',
    entityId: id,
  })

  return doctor
}



export async function updateDoctorAndUser(
  doctorId: string,
  userId: string,
  doctorData: any,
  userData: any,
  actorId: string
) {
  return await prisma.$transaction(async (tx) => {
    const updatedDoctor = await updateDoctor(doctorId, doctorData, actorId,tx)
    const updatedUser = await updateUser(userId, userData, actorId,tx)

    return {
      doctor: updatedDoctor,
      user: updatedUser,
    }
  })
}

// ─── Delete Doctor ───────────────────────────────────────────

export async function deleteDoctor(id: string, actorId: string) {
  await prisma.doctor.delete({ where: { id } })

  await writeAuditLog({
    userId: actorId,
    action: 'delete',
    entityType: 'doctor',
    entityId: id,
  })
}