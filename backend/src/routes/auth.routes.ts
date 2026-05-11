import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  registerUser, loginUser, verifyEmail,
  requestPasswordReset, resetPassword,
  createSession, revokeSession, getValidSession,
} from '../services/auth.service'
import { sendSuccess, sendError } from '../utils/response'
import { redis, REDIS_KEYS } from '../config/redis'

// ─── Schemas ──────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const verifyEmailSchema = z.object({
  userId: z.string().uuid(),
  token: z.string(),
})

const passwordResetRequestSchema = z.object({
  email: z.string().email(),
})

const passwordResetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
})

// ─── Route Handler ────────────────────────────────────────────

export default async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/register
  app.post('/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body)
      const user = await registerUser(body)
      return sendSuccess(reply, user, 'Account created. Please verify your email.', 201)
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })

  // POST /api/auth/login
  app.post('/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body)
      const ip = request.headers['x-forwarded-for']?.toString() ?? request.ip

      const result = await loginUser(body.email, body.password, ip)

      // Sign tokens
      const accessToken = (app as any).accessSign({
        sub: result.user.id,
        email: result.user.email,
        role: result.user.role,
      })
      const refreshToken = (app as any).refreshSign({ sub: result.user.id })

      await createSession(result.user.id, refreshToken, ip,)

      // Set refresh token as httpOnly cookie
      reply.setCookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/api/auth',
      })

      return sendSuccess(reply, { accessToken, user: result.user }, 'Login successful')
    } catch (err: any) {
      return sendError(reply, err.message, 401)
    }
  })

  // POST /api/auth/refresh
  app.post('/refresh', async (request, reply) => {
    try {
      const refreshToken = request.cookies?.refresh_token
      if (!refreshToken) return sendError(reply, 'No refresh token', 401)

      const session = await getValidSession(refreshToken)
      if (!session) return sendError(reply, 'Invalid or expired session', 401)

      const newAccessToken = (app as any).accessSign({
        sub: session.user.id,
        email: session.user.email,
        role: session.user.role,
      })

      return sendSuccess(reply, { accessToken: newAccessToken })
    } catch (err: any) {
      return sendError(reply, err.message, 401)
    }
  })

  // POST /api/auth/logout
  app.post('/logout', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const refreshToken = request.cookies?.refresh_token
      if (refreshToken) await revokeSession(refreshToken)

      // Blacklist access token
      const token = request.headers.authorization?.replace('Bearer ', '') ?? ''
      await redis.setex(REDIS_KEYS.blacklist(token), 60 * 16, '1')

      reply.clearCookie('refresh_token', { path: '/api/auth' })
      return sendSuccess(reply, null, 'Logged out successfully')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })

  // POST /api/auth/verify-email
  app.post('/verify-email', async (request, reply) => {
    try {
      const body = verifyEmailSchema.parse(request.body)
      await verifyEmail(body.userId, body.token)
      return sendSuccess(reply, null, 'Email verified successfully')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })

  // POST /api/auth/forgot-password
  app.post('/forgot-password', async (request, reply) => {
    try {
      const body = passwordResetRequestSchema.parse(request.body)
      await requestPasswordReset(body.email)
      return sendSuccess(reply, null, 'If that email exists, a reset link has been sent.')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })

  // POST /api/auth/reset-password
  app.post('/reset-password', async (request, reply) => {
    try {
      const body = passwordResetSchema.parse(request.body)
      await resetPassword(body.token, body.newPassword)
      return sendSuccess(reply, null, 'Password reset successfully')
    } catch (err: any) {
      return sendError(reply, err.message)
    }
  })
}
