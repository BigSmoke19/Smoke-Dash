import 'dotenv/config'
import Fastify from 'fastify'
import { env } from './config/env'
import { logger } from './config/logger'
import { prisma } from './config/prisma'
import { redis } from './config/redis'
import { FastifyError } from 'fastify'



// ─── Plugins ──────────────────────────────────────────────────
import corsPlugin from './plugins/cors'
import securityPlugin from './plugins/security'
import jwtPlugin from './plugins/jwt'

// ─── Routes ───────────────────────────────────────────────────

import userRoutes from './routes/user.routes'
import doctorRoutes from './routes/doctor.routes'
import timeSlotRoutes from './routes/timeslot.routes'
import bookingRoutes from './routes/booking.routes'
import sessionRoutes from './routes/session.routes'
import authRoutes from './routes/auth.routes'
import auditRoutes from './routes/audit.routes'

// ─── Build App ────────────────────────────────────────────────

const app = Fastify({
  logger: false, // We use Winston instead
  trustProxy: true,
})

// ─── Register Plugins ─────────────────────────────────────────

async function registerPlugins() {
  await app.register(corsPlugin)
  await app.register(securityPlugin)
  await app.register(jwtPlugin)
}

// ─── Register Routes ──────────────────────────────────────────

async function registerRoutes() {
  await app.register(userRoutes, { prefix: '/api/users' })
  await app.register(doctorRoutes, { prefix: '/api/doctors' })
  await app.register(timeSlotRoutes, { prefix: '/api/slots' })
  await app.register(bookingRoutes, { prefix: '/api/bookings' })
  await app.register(sessionRoutes, { prefix: '/api/sessions' })
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(auditRoutes, { prefix: '/api/audit-logs' })
 
}

// ─── Health Check ─────────────────────────────────────────────

app.get('/health', async () => ({
  status: 'ok',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  environment: env.NODE_ENV,
}))

// ─── Global Error Handler ─────────────────────────────────────

app.setErrorHandler((error : FastifyError, request, reply) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
  })

  if (error.validation) {
    return reply.code(422).send({
      success: false,
      error: 'Validation failed',
      details: error.validation,
    })
  }

  return reply.code(error.statusCode ?? 500).send({
    success: false,
    error: env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
  })
})

// ─── 404 Handler ──────────────────────────────────────────────

app.setNotFoundHandler((request, reply) => {
  reply.code(404).send({ success: false, error: `Route ${request.method} ${request.url} not found` })
})

// ─── Graceful Shutdown ────────────────────────────────────────

async function gracefulShutdown() {
  logger.info('Shutting down...')
  await app.close()
  await prisma.$disconnect()
  await redis.quit()
  logger.info('Shutdown complete')
  process.exit(0)
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

// ─── Start ────────────────────────────────────────────────────
export async function testBuildApp() {
  const app = Fastify({
    logger: false,
    trustProxy: true,
  })

  await app.register(corsPlugin)
  await app.register(securityPlugin)
  await app.register(jwtPlugin)

  await app.register(userRoutes, { prefix: '/api/users' })
  await app.register(doctorRoutes, { prefix: '/api/doctors' })
  await app.register(timeSlotRoutes, { prefix: '/api/slots' })
  await app.register(bookingRoutes, { prefix: '/api/bookings' })
  await app.register(sessionRoutes, { prefix: '/api/sessions' })

  return app
}


async function start() {
  try {
    await registerPlugins()
    await registerRoutes()


    await app.listen({ port: env.PORT, host: env.HOST })
    logger.info(`API running on http://${env.HOST}:${env.PORT}`)
    logger.info(`Environment: ${env.NODE_ENV}`)
  } catch (err) {
    logger.error('Failed to start server', err)
    process.exit(1)
  }
}


start()
