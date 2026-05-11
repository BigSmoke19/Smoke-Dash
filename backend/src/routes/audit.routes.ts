  import { FastifyInstance } from 'fastify'
  import { sendSuccess, sendError } from '../utils/response'
  import { adminOnly } from '../middleware/rbac'
import { getAuditLogs } from '@/services/audit.services'
  
  
  // GET Audit logs
  export default async function auditRoutes(app: FastifyInstance) {
    app.get(
    '/',
    { preHandler: [app.authenticate, adminOnly] },
    async (request, reply) => {
        try {
        
        const { page = 1, limit = 10,entityType,entityId,action,userId} = request.query as any

        const result = await getAuditLogs({
            page: Number(page) || 1,
            limit: Number(limit) || 20,

            entityType: entityType as string,
            entityId: entityId as string,
            action: action as string,
            userId: userId as string,
            })

        return sendSuccess(reply, result)
        } catch (err: any) {
        return sendError(reply, err.message)
        }
    }
    )
}