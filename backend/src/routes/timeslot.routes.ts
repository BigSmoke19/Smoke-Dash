// timeslot.routes.ts

import { FastifyInstance,FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  createTimeSlot,
  getDoctorSlots,
  deleteTimeSlot,
} from '../services/timeslot.services'
import { sendSuccess, sendError } from '../utils/response'
import { adminOnly,admin_doctor } from '../middleware/rbac'

import { prisma } from '../config/prisma'

const createSlotSchema = z.object({
  doctorId: z.string().uuid(),
  startsAt: z.string(),
  endsAt: z.string(),
})

export default async function timeSlotRoutes(app: FastifyInstance) {

  // GET slots for doctor
  app.get('/doctor/:doctorId', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { doctorId } = request.params as any
      const user = request.user as any
      if (user.role === 'DOCTOR') {
        const profile = await prisma.doctor.findUnique({
          where: { userId: user.sub },
        })

        if (!profile || doctorId !== profile.id) {
          return sendError(reply, 'unauthorized', 403)
        }
      }
      const slots = await getDoctorSlots(doctorId)
      return sendSuccess(reply, slots)
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })

  // CREATE slot (admin,doctor)
  app.post('/', { preHandler: [app.authenticate, admin_doctor] }, async (request, reply) => {
    try {
      const body = createSlotSchema.parse(request.body)
      const actor = request.user as any

      if (actor.role === 'DOCTOR') {
        const profile = await prisma.doctor.findUnique({
          where: { userId: actor.sub },
        })

        if (!profile || body.doctorId !== profile.id) {
          return sendError(reply, 'unauthorized', 403)
        }
      }
      

      const slot = await createTimeSlot({
        ...body,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
      }, actor.sub)

      return sendSuccess(reply, slot, 'Time slot created')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })

  // DELETE slot (admin,doctor)
  app.delete(
  '/:id',
  { preHandler: [app.authenticate, admin_doctor] },
  async (request, reply) => {
    try {
      const { id } = request.params as any
      const actor = request.user as any

      const slot = await prisma.timeSlot.findUnique({
        where: { id },
        include: { doctor: true },
      })

      if (!slot) {
        return sendError(reply, 'Slot not found', 404)
      }

      if (actor.role === 'DOCTOR') {
        const profile = await prisma.doctor.findUnique({
          where: { userId: actor.sub },
        })

        if (!profile || slot.doctorId !== profile.id) {
          return sendError(reply, 'unauthorized', 403)
        }
      }

      await deleteTimeSlot(id, actor.sub)

      return sendSuccess(reply, null, 'Time slot deleted')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  }
)
}