import Redis from 'ioredis'
import { env } from './env'
import { logger } from './logger'

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

redis.on('connect', () => logger.info('Redis connected'))
redis.on('error', (err) => logger.error('Redis error', err))

export const REDIS_KEYS = {
  session: (userId: string) => `session:${userId}`,
  blacklist: (token: string) => `blacklist:${token}`,
  plans: (zip: string) => `plans:zip:${zip}`,
  rateLimit: (ip: string) => `rate:${ip}`,
  otpCode: (userId: string) => `otp:${userId}`,
  passwordReset: (token: string) => `reset:${token}`,
}