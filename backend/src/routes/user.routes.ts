import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  getUsers, getUserById, updateUser,deleteUser,
  getUserLoginHistory, adminResetUserPassword,
} from '../services/user.services'
import { sendSuccess, sendError } from '../utils/response'
import { adminOnly} from '../middleware/rbac'

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})


const resetPasswordSchema = z.object({
  newPassword: z.string().min(8),
})

export default async function userRoutes(app: FastifyInstance) {
  // GET /api/users — Admin: list all users
  app.get('/', { preHandler: [app.authenticate, adminOnly] }, async (request, reply) => {
    try {
      const { page, limit, search, role, status } = request.query as any
      const result = await getUsers({ page: Number(page) || 1, limit: Number(limit) || 20, search, role })
      return sendSuccess(reply, result)
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })

  // GET /api/users/me — Logged-in user: get own profile
  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const user = request.user as any
      const profile = await getUserById(user.sub)
      return sendSuccess(reply, profile)
    } catch (err: any) {
      return sendError(reply, err.message, 404)
    }
  })

  // PATCH /api/users/me — Logged-in user: update own profile
  app.patch('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const user = request.user as any
      const body = updateUserSchema.parse(request.body)
      const updated = await updateUser(user.sub, body, user.sub)
      return sendSuccess(reply, updated, 'Profile updated')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })

  // GET /api/users/:id — Admin: get any user
  app.get('/:id', { preHandler: [app.authenticate, adminOnly] }, async (request, reply) => {
    try {
      const { id } = request.params as any
      const user = await getUserById(id)
      return sendSuccess(reply, user)
    } catch (err: any) {
      return sendError(reply, err.message, 404)
    }
  })

  // PATCH /api/users/:id — Admin: update any user
  app.patch('/:id', { preHandler: [app.authenticate, adminOnly] }, async (request, reply) => {
    try {
      const { id } = request.params as any
      const actor = request.user as any
      const body = updateUserSchema.parse(request.body)
      const updated = await updateUser(id, body, actor.sub)
      return sendSuccess(reply, updated, 'User updated')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })

    // DELETE /api/users/me — Self delete 
  app.delete('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const user = request.user as any
      await deleteUser(user.sub, user.sub)
      return sendSuccess(reply, null, 'Your account has been deleted')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })


  // DELETE /api/users/:id — admin: deleteUser
  app.delete('/:id', { preHandler: [app.authenticate, adminOnly] }, async (request, reply) => {
    try {
      const { id } = request.params as any
      const actor = request.user as any
      await deleteUser(id, actor.sub)
      return sendSuccess(reply, null, 'User deleted (GDPR)')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })



  // GET /api/users/:id/login-history — Admin: view login history
  app.get('/:id/login-history', { preHandler: [app.authenticate, adminOnly] }, async (request, reply) => {
    try {
      const { id } = request.params as any
      const { page, limit } = request.query as any
      const history = await getUserLoginHistory(id, Number(page) || 1, Number(limit) || 20)
      return sendSuccess(reply, history)
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })

  // POST /api/users/:id/reset-password — Admin: force reset password
  app.post('/:id/reset-password', { preHandler: [app.authenticate, adminOnly] }, async (request, reply) => {
    try {
      const { id } = request.params as any
      const actor = request.user as any
      const { newPassword } = resetPasswordSchema.parse(request.body)
      await adminResetUserPassword(id, newPassword, actor.sub)
      return sendSuccess(reply, null, 'Password reset successfully')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })
}
