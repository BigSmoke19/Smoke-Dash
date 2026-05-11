// booking.routes.ts

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  createBooking,
  updateBooking,
  getUserBookings,
  getDoctorBookings,
  deleteBooking,
} from '../services/booking.services'
import { sendSuccess, sendError } from '../utils/response'
import { admin_doctor, adminOnly } from '../middleware/rbac'
import { prisma } from '../config/prisma'
import { BookingStatus } from '@/types'

const createBookingSchema = z.object({
  slotId: z.string().uuid(),
})

const updateBookingStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.string().min(1)
})

const deleteBookingSchema = z.object({
  id: z.string().uuid(),
})

export default async function bookingRoutes(app: FastifyInstance) {

  // GET my bookings
  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const user = request.user as any
      const bookings = await getUserBookings(user.sub)
      return sendSuccess(reply, bookings)
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })

  // GET Doctor bookings
  app.get(
  '/doctor',
  { preHandler: [app.authenticate, admin_doctor] },
  async (request, reply) => {
    try {
      const user = request.user as any

      const profile = await prisma.doctor.findUnique({
        where: { userId: user.sub },
      })

      if (!profile) {
        return sendError(reply, 'Doctor Profile not found!')
      }

      const { page = 1, limit = 10, status } = request.query as any

      const result = await getDoctorBookings(profile.id, {
        page: Number(page),
        limit: Number(limit),
        status,
      })

      return sendSuccess(reply, result)
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  }
)

  // CREATE booking
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const user = request.user as any
      const { slotId } = createBookingSchema.parse(request.body)

      const booking = await createBooking(user.sub, slotId)
      return sendSuccess(reply, booking, 'Booking created')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })

  // update booking status
  app.patch('/update/', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const {id,status} = updateBookingStatusSchema.parse(request.body)
      const user = request.user as any

      const booking = await updateBooking(id, user.sub,status as BookingStatus)
      return sendSuccess(reply, booking, 'Booking Updated')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })

  // delete booking status
  app.patch('/delete/', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const {id} = deleteBookingSchema.parse(request.body)
      const user = request.user as any

      const booking = await deleteBooking(id, user.sub)
      return sendSuccess(reply, booking, 'Booking Deleted')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })
}

