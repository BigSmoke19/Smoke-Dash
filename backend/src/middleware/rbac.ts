import { FastifyRequest, FastifyReply } from 'fastify'
import { Role } from '../types'

/**
 * Usage in routes:
 *   preHandler: [app.authenticate, requireRole(['super_admin', 'operations_admin'])]
 */
export function requireRole(allowedRoles: Role[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { role: Role }
    if (!user || !allowedRoles.includes(user.role)) {
      return reply.code(403).send({ success: false, error: 'Forbidden' })
    }
  }
}

// Shorthand guards
export const adminOnly = requireRole(['ADMIN'])

export const admin_doctor = requireRole(['ADMIN', 'DOCTOR'])


