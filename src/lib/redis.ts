import { logDebug as _ulogDebug, logError as _ulogError } from '@/lib/logging/core'
import Redis from 'ioredis'

type RedisSingleton = {
  app?: Redis
  queue?: Redis
}

const globalForRedis = globalThis as typeof globalThis & {
  __waoowaooRedis?: RedisSingleton
}

// ==============================================
// 👇 关键：判断是否是 Vercel 构建环境
// ==============================================
const IS_VERCEL_BUILD = process.env.VERCEL === '1' || process.env.CI === 'true'
const IS_BUILD_TIME = typeof window === 'undefined' && IS_VERCEL_BUILD

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1'
const REDIS_PORT = Number.parseInt(process.env.REDIS_PORT || '6379', 10) || 6379
const REDIS_USERNAME = process.env.REDIS_USERNAME
const REDIS_PASSWORD = process.env.REDIS_PASSWORD
const REDIS_TLS = process.env.REDIS_TLS === 'true'
const IS_TEST_ENV = process.env.NODE_ENV === 'test'

function buildBaseConfig() {
  return {
    host: REDIS_HOST,
    port: REDIS_PORT,
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
    tls: REDIS_TLS ? {} : undefined,
    enableReadyCheck: true,
    lazyConnect: IS_TEST_ENV,
    retryStrategy(times: number) {
      return Math.min(2 ** Math.min(times, 10) * 100, 30_000)
    },
  }
}

function onConnectLog(scope: string, client: Redis) {
  client.on('connect', () => _ulogDebug(`[Redis:${scope}] connected ${REDIS_HOST}:${REDIS_PORT}`))
  client.on('error', (err) => _ulogError(`[Redis:${scope}] error:`, err.message))
}

function createAppRedis() {
  // ==============================================
  // 👇 构建时直接返回空对象，不创建 Redis 实例
  // ==============================================
  if (IS_BUILD_TIME) {
    return {} as Redis
  }

  const client = new Redis({
    ...buildBaseConfig(),
    maxRetriesPerRequest: 2,
  })
  onConnectLog('app', client)
  return client
}

function createQueueRedis() {
  // ==============================================
  // 👇 构建时直接返回空对象，不创建 Redis 实例
  // ==============================================
  if (IS_BUILD_TIME) {
    return {} as Redis
  }

  const client = new Redis({
    ...buildBaseConfig(),
    maxRetriesPerRequest: null,
  })
  onConnectLog('queue', client)
  return client
}

// ==============================================
// 👇 构建时不初始化 Redis
// ==============================================
const singleton = globalForRedis.__waoowaooRedis || {}
if (!globalForRedis.__waoowaooRedis && !IS_BUILD_TIME) {
  globalForRedis.__waoowaooRedis = singleton
}

export const redis = IS_BUILD_TIME 
  ? ({} as Redis) 
  : (singleton.app || (singleton.app = createAppRedis()))

export const queueRedis = IS_BUILD_TIME
  ? ({} as Redis)
  : (singleton.queue || (singleton.queue = createQueueRedis()))

export function createSubscriber() {
  if (IS_BUILD_TIME) {
    return {} as Redis
  }

  const client = new Redis({
    ...buildBaseConfig(),
    maxRetriesPerRequest: null,
  })
  onConnectLog('sub', client)
  return client
}
