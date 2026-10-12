import {
  getCached,
  setCached,
  invalidate,
  isCacheReady,
  __setStoreForTests,
  createMemoryStore,
} from '../config/cache'

/**
 * The cache must never be required for the app to function: with no store
 * configured these calls are safe no-ops.
 */
describe('cache without a configured store', () => {
  afterEach(() => __setStoreForTests(null))

  it('reports not ready', () => {
    __setStoreForTests(null)
    expect(isCacheReady()).toBe(false)
  })

  it('getCached returns null instead of throwing', async () => {
    await expect(getCached('anything')).resolves.toBeNull()
  })

  it('setCached and invalidate resolve without error', async () => {
    await expect(setCached('key', { a: 1 })).resolves.toBeUndefined()
    await expect(invalidate('groceries:')).resolves.toBeUndefined()
  })
})

describe('cache with an in-memory store', () => {
  beforeEach(() => __setStoreForTests(createMemoryStore()))
  afterEach(() => __setStoreForTests(null))

  it('reports ready', () => {
    expect(isCacheReady()).toBe(true)
  })

  it('round-trips a value (cache hit)', async () => {
    await setCached('groceries:list:{}', [{ name: 'Milk' }], 30)
    expect(await getCached('groceries:list:{}')).toEqual([{ name: 'Milk' }])
  })

  it('returns null for a miss', async () => {
    expect(await getCached('groceries:list:missing')).toBeNull()
  })

  it('expires entries after their TTL', async () => {
    await setCached('short', { a: 1 }, 0)
    await new Promise((r) => setTimeout(r, 5))
    expect(await getCached('short')).toBeNull()
  })

  it('invalidates every key under a prefix', async () => {
    await setCached('groceries:list:a', 1, 30)
    await setCached('groceries:list:b', 2, 30)
    await setCached('other:key', 3, 30)

    await invalidate('groceries:')

    expect(await getCached('groceries:list:a')).toBeNull()
    expect(await getCached('groceries:list:b')).toBeNull()
    // Unrelated keys survive.
    expect(await getCached('other:key')).toBe(3)
  })
})
