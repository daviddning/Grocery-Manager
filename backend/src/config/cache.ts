import { createClient, type RedisClientType } from 'redis'

/**
 * Cache layer with graceful degradation.
 *
 * If REDIS_URL is unset or the server is unreachable, the cache becomes a
 * no-op and the app keeps working against MongoDB directly. This keeps local
 * dev and CI (no Redis installed) fully functional while caching in production.
 *
 * The store is injected (see `__setStoreForTests`) so cache-hit behaviour can
 * be exercised without a live Redis.
 */

interface CacheStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  keys(prefix: string): Promise<string[]>
  del(keys: string[]): Promise<void>
}

let store: CacheStore | null = null

const REDIS_URL = process.env.REDIS_URL

export async function connectCache(): Promise<void> {
  if (!REDIS_URL) {
    console.log('REDIS_URL not set - running without cache')
    return
  }

  try {
    const client: RedisClientType = createClient({ url: REDIS_URL })
    client.on('error', (err) => console.warn('Redis error:', err.message))
    await client.connect()
    store = {
      get: (key) => client.get(key) as Promise<string | null>,
      set: (key, value, ttlSeconds) => client.set(key, value, { EX: ttlSeconds }).then(() => undefined),
      keys: (prefix) => client.keys(`${prefix}*`),
      del: (keys) => client.del(keys).then(() => undefined),
    }
    console.log('Redis cache connected')
  } catch {
    console.warn('Redis unavailable - continuing without cache')
    store = null
  }
}

export async function getCached<T>(key: string): Promise<T | null> {
  if (!store) return null
  try {
    const raw = await store.get(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function setCached(key: string, value: unknown, ttlSeconds = 30): Promise<void> {
  if (!store) return
  try {
    await store.set(key, JSON.stringify(value), ttlSeconds)
  } catch {
    /* best-effort: a failed write must never break the request path */
  }
}

export async function invalidate(prefix: string): Promise<void> {
  if (!store) return
  try {
    const keys = await store.keys(prefix)
    if (keys.length) await store.del(keys)
  } catch {
    /* best-effort */
  }
}

export function isCacheReady(): boolean {
  return store !== null
}

/** Test-only seam: inject an in-memory store without a live Redis. */
export function __setStoreForTests(next: CacheStore | null): void {
  store = next
}

/** An in-memory CacheStore with TTL support, used by tests. */
export function createMemoryStore(): CacheStore {
  const map = new Map<string, { value: string; expiresAt: number }>()
  return {
    async get(key) {
      const hit = map.get(key)
      if (!hit) return null
      if (hit.expiresAt < Date.now()) {
        map.delete(key)
        return null
      }
      return hit.value
    },
    async set(key, value, ttlSeconds) {
      map.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
    },
    async keys(prefix) {
      return [...map.keys()].filter((k) => k.startsWith(prefix))
    },
    async del(keys) {
      keys.forEach((k) => map.delete(k))
    },
  }
}
