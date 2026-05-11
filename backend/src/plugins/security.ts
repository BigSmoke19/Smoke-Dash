// plugins/security.ts

import fp from 'fastify-plugin'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import fastifyCookie from '@fastify/cookie'
import { FastifyInstance } from 'fastify'
import { redis } from '../config/redis'
import { env } from '../config/env'

export default fp(async function securityPlugin(app: FastifyInstance) {
  // HTTP security headers
  app.register(fastifyHelmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  })

  // Rate limiting backed by Redis
  app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis,
    keyGenerator: (request) =>
      request.headers['x-forwarded-for']?.toString() ?? request.ip,
    errorResponseBuilder: () => ({
      success: false,
      error: 'Too many requests. Please slow down.',
    }),
  })

  // Cookie support (for refresh token httpOnly cookie)
  app.register(fastifyCookie, {
    secret: env.JWT_SECRET,
  })
})
