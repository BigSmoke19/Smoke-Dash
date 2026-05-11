// doctor.routes.ts

import { FastifyInstance } from 'fastify'
import { prisma } from '../config/prisma'
import { z } from 'zod'
import {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  updateDoctorAndUser,
} from '../services/doctor.services'
import { sendSuccess, sendError } from '../utils/response'
import { adminOnly,admin_doctor } from '../middleware/rbac'

const createDoctorSchema = z.object({
  userId: z.string().uuid(),
  specialty: z.string().min(1),
  bio: z.string().optional(),
})

const updateDoctorSchema = z.object({
  specialty: z.string().min(1).optional(),
  bio: z.string().optional(),
})

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

const updateDoctorUserSchema = z.object({
  userID: z.string().uuid(),
  specialty: z.string().min(1).optional(),
  bio: z.string().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export default async function doctorRoutes(app: FastifyInstance) {

  // GET all doctors
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) =>  {
    try {
      const { page, limit, search} = request.query as any
      const doctors = await getDoctors({ page: Number(page) || 1, limit: Number(limit) || 20, search })
      return sendSuccess(reply, doctors)
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })

   // GET /api/doctors/me — Logged-in doctor: get own profile
  app.get('/me', { preHandler: [app.authenticate,admin_doctor] }, async (request, reply) => {
    try {
      const user = request.user as any
      const profile = await prisma.doctor.findUnique({
        where: { userId: user.sub },
      });
      if (!profile) return sendError(reply, 'Doctor profile not found', 404)
      return sendSuccess(reply, profile)
    } catch (err: any) {
      return sendError(reply, err.message, 404)
    }
  })

  // GET doctor by id -- Admin only
  app.get('/:id', { preHandler: [app.authenticate, adminOnly] }, async (request, reply) => {
    try {
      const { id } = request.params as any
      const doctor = await getDoctorById(id)
      return sendSuccess(reply, doctor)
    } catch (err: any) {
      return sendError(reply, err.message, 404)
    }
  })

 

  // CREATE doctor (admin)
  app.post('/', { preHandler: [app.authenticate, adminOnly] }, async (request, reply) => {
    try {
      const actor = request.user as any
      const body = createDoctorSchema.parse(request.body)

      const doctor = await createDoctor(body, actor.sub)
      return sendSuccess(reply, doctor, 'Doctor created')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })

  // UPDATE doctor (admin)
  app.patch('/:id', { preHandler: [app.authenticate, adminOnly] }, async (request, reply) => {
    try {
      const { id } = request.params as any
      const actor = request.user as any
      const body = updateDoctorSchema.parse(request.body)

      const updated = await updateDoctor(id, body, actor.sub)
      return sendSuccess(reply, updated, 'Doctor updated')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })

    // UPDATE doctor (admin,doctor)
  app.patch('/full/:id', { preHandler: [app.authenticate, admin_doctor] }, async (request, reply) => {
    try {
      const { id } = request.params as any
      const actor = request.user as any
      const body = updateDoctorUserSchema.parse(request.body)
      const doctorData = {bio: body.bio,specialty: body.specialty}
      const userData = {
        firstName: body.firstName,
        lastName : body.lastName,
        phone: body.phone,
        address: body.address,}

      const result = await updateDoctorAndUser(
        id,                // doctorId
        body.userID,
        doctorData,                
        userData,
        actor.sub
      )

      return sendSuccess(reply, result, 'Doctor & User updated')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })

  

  // DELETE doctor (admin)
  app.delete('/:id', { preHandler: [app.authenticate, adminOnly] }, async (request, reply) => {
    try {
      const { id } = request.params as any
      const actor = request.user as any

      await deleteDoctor(id, actor.sub)
      return sendSuccess(reply, null, 'Doctor deleted')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })
}