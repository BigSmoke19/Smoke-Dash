import { FastifyReply } from 'fastify'
import { ApiResponse } from '../types'

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  message?: string,
  statusCode = 200
) {
  const response: ApiResponse<T> = { success: true, message, data }
  return reply.code(statusCode).send(response)
}

export function sendError(
  reply: FastifyReply,
  error: string,
  statusCode = 400
) {
  const response: ApiResponse = { success: false, error }
  return reply.code(statusCode).send(response)
}
