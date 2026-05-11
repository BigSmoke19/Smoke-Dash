// plugins/cors.ts

import fp from 'fastify-plugin'
import fastifyCors from '@fastify/cors'
import { FastifyInstance } from 'fastify'
import { env } from '../config/env'

export default fp(async function corsPlugin(app: FastifyInstance) {
  app.register(fastifyCors, {
    origin: [env.FRONTEND_URL],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
})
