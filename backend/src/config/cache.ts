import { createClient, type RedisClientType } from 'redis'

/**
 * Cache layer with graceful degradation.
 *
 * If REDIS_URL is unset or the server is unreachable, the cache becomes a
 * no-op and the app keeps working against MongoDB directly. This keeps local
 * dev and CI (no Redis installed) fully functional while caching in production.
 */

let client: RedisClientType | null = null
let ready = false

const REDIS_URL = process.env.REDIS_URL

export async function connectCache(): Promise<void> {
  if (!REDIS_URL) {
    console.log('REDIS_URL not set - running without cache')
    return
  }

  try {
    client = createClient({ url: REDIS_URL })
    client.on('error', (err) => console.warn('Redis error:', err.message))
    await client.connect()
    ready = true
    console.log('Redis cache connected')
  } catch {
    console.warn('Redis unavailable - continuing without cache')
    client = null
    ready = false
  }
}

export async function getCached<T>(key: string): Promise<T | null> {
  if (!ready || !client) return null
  try {
    const raw: unknown = await client.get(key)
    if (typeof raw !== 'string' || !raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function setCached(key: string, value: unknown, ttlSeconds = 30): Promise<void> {
  if (!ready || !client) return
  try {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds })
  } catch {
    /* best-effort: a failed write must never break the request path */
  }
}

export async function invalidate(prefix: string): Promise<void> {
  if (!ready || !client) return
  try {
    const keys = await client.keys(`${prefix}*`)
    if (keys.length) await client.del(keys)
  } catch {
    /* best-effort */
  }
}

export function isCacheReady(): boolean {
  return ready
}
