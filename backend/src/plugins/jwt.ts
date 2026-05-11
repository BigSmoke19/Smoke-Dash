// plugins/jwt.ts

import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { redis, REDIS_KEYS } from '@/config/redis'
import { JwtPayload } from '@/types'

export default fp(async (app: FastifyInstance) => {
  // ─────────────────────────────────────────────
  // ACCESS TOKEN (Fastify JWT)
  // ─────────────────────────────────────────────
  app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  })

  // ─────────────────────────────────────────────
  // ACCESS TOKEN SIGN
  // ─────────────────────────────────────────────
  app.decorate('accessSign', function (payload: JwtPayload) {
    return app.jwt.sign(payload, {
      expiresIn: env.JWT_EXPIRES_IN,
    })
  })

  // ─────────────────────────────────────────────
  // REFRESH TOKEN (jsonwebtoken - NOT fastify-jwt)
  // ─────────────────────────────────────────────
  app.decorate('refreshSign', function (payload: { sub: string }) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    })
  })

  // ─────────────────────────────────────────────
  // REFRESH VERIFY (manual)
  // ─────────────────────────────────────────────
  app.decorate('refreshVerify', function (token: string) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET)
  })

  // ─────────────────────────────────────────────
  // AUTH MIDDLEWARE
  // ─────────────────────────────────────────────
  app.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify()

        const token =
          request.headers.authorization?.replace('Bearer ', '') ?? ''

        const blacklisted = await redis.get(REDIS_KEYS.blacklist(token))

        if (blacklisted) {
          return reply.code(401).send({
            success: false,
            error: 'Token revoked',
          })
        }
      } catch {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
        })
      }
    }
  )
})