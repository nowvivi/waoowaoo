import { logDebug as _ulogDebug, logError as _ulogError } from '@/lib/logging/core'
import Redis from 'ioredis'

type RedisSingleton = {
  app?: Redis
  queue?: Redis
}

const globalForRedis = globalThis as typeof globalThis & {
  __waoowaooRedis?: RedisSingleton
}

// 构建环境判断（Vercel）
const IS_CI = !!process.env.CI || !!process.env.VERCEL

// ==========================================
// 空客户端（构建时用）
// ==========================================
const emptyClient = {} as any

// ==========================================
// 正常环境逻辑
// ==========================================
let _redis: Redis
let _queueRedis: Redis
let _createSubscriber: () => Redis

if (!IS_CI) {
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
// 统一导出（符合语法！不会报错！）
// ==========================================
export const redis = IS_CI ? emptyClient : _redis
export const queueRedis = IS_CI ? emptyClient : _queueRedis
export const createSubscriber = IS_CI ? () => emptyClient : _createSubscriber