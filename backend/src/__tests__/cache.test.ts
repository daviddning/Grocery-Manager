import { getCached, setCached, invalidate, isCacheReady } from '../config/cache'

/**
 * The cache must never be required for the app to function. With no
 * REDIS_URL configured these calls are no-ops that return safe defaults.
 */
describe('cache without a configured Redis', () => {
  it('reports not ready when REDIS_URL is unset', () => {
    expect(isCacheReady()).toBe(false)
  })

  it('getCached returns null instead of throwing', async () => {
    await expect(getCached('anything')).resolves.toBeNull()
  })

  it('setCached resolves without error', async () => {
    await expect(setCached('key', { a: 1 })).resolves.toBeUndefined()
  })

  it('invalidate resolves without error', async () => {
    await expect(invalidate('groceries:')).resolves.toBeUndefined()
  })
})
