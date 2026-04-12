import { logDebug as _ulogDebug, logError as _ulogError } from '@/lib/logging/core'
import Redis from 'ioredis'

type RedisSingleton = {
  app?: Redis
  queue?: Redis
}

const globalForRedis = globalThis as typeof globalThis & {
  __waoowaooRedis?: RedisSingleton
}

// ==========================================
// ✅ 关键修复：Vercel 环境也执行 Redis 逻辑
// ==========================================
const IS_BUILD_TIME = !!process.env.CI && process.env.NODE_ENV === 'production'

// ==========================================
// 空实现（仅构建时用，运行时绝对不用）
// ==========================================
const emptyClient = {} as Redis
const emptyCreateSubscriber = () => emptyClient

// ==========================================
// 正常环境逻辑（本地 + Vercel 运行时都执行）
// ==========================================
let _redis: Redis = emptyClient
let _queueRedis: Redis = emptyClient
let _createSubscriber: () => Redis = emptyCreateSubscriber

// ✅ 仅在构建时用空实现，运行时（本地/Vercel）都执行真实 Redis 逻辑
if (IS_BUILD_TIME) {
  _redis = emptyClient
  _queueRedis = emptyClient
  _createSubscriber = emptyCreateSubscriber
} else {
  // ==========================================
  // ✅ 强制写死 Upstash 配置（本地/Vercel 都生效）
  // ==========================================
  const REDIS_HOST = "enormous-mackerel-97187.upstash.io"
  const REDIS_PORT = 6379
  const REDIS_USERNAME = "default"
  const REDIS_PASSWORD = "gQAAAAAAAXujAAIncDEyMWJiMzY2MDdiYmU0YjFlYjYzNTY4ZmY4Y2MzMTkwZnAxOTcxODc"
  const REDIS_TLS = true

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
    const client = new Redis({
      ...buildBaseConfig(),
      maxRetriesPerRequest: 2,
    })
    onConnectLog('app', client)
    return client
  }

  function createQueueRedis() {
    const client = new Redis({
      ...buildBaseConfig(),
      maxRetriesPerRequest: null,
    })
    onConnectLog('queue', client)
    return client
  }

  const singleton = globalForRedis.__waoowaooRedis || {}
  if (!globalForRedis.__waoowaooRedis) {
    globalForRedis.__waoowaooRedis = singleton
  }

  _redis = singleton.app || (singleton.app = createAppRedis())
  _queueRedis = singleton.queue || (singleton.queue = createQueueRedis())

  _createSubscriber = function createSubscriber() {
    const client = new Redis({
      ...buildBaseConfig(),
      maxRetriesPerRequest: null,
    })
    onConnectLog('sub', client)
    return client
  }
}

// ==========================================
// 最终导出
// ==========================================
export const redis = _redis
export const queueRedis = _queueRedis
export const createSubscriber = _createSubscriber