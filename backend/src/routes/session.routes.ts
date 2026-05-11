// session.routes.ts

import { FastifyInstance } from 'fastify'
import { revokeSession } from '../services/session.services'
import { sendSuccess, sendError } from '../utils/response'

export default async function sessionRoutes(app: FastifyInstance) {

  // LOGOUT (revoke session)
  app.post('/logout', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const token = request.headers['x-refresh-token'] as string

      if (!token) throw new Error('Missing refresh token')

      await revokeSession(token)
      return sendSuccess(reply, null, 'Logged out')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })
}