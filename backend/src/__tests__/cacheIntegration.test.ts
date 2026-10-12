import request from 'supertest'
import app from '../app'
import Grocery from '../models/Grocery'
import { __setStoreForTests, createMemoryStore } from '../config/cache'

const API = '/api/groceries'

function daysFromNow(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

describe('read-through caching', () => {
  beforeEach(() => __setStoreForTests(createMemoryStore()))
  afterEach(() => __setStoreForTests(null))

  it('serves a repeated list request from cache', async () => {
    await Grocery.create({ name: 'Cached', quantity: 1, expiresAt: daysFromNow(5) })

    const spy = jest.spyOn(Grocery, 'find')
    try {
      const first = await request(app).get(API)
      const second = await request(app).get(API)

      expect(first.body).toHaveLength(1)
      expect(second.body).toEqual(first.body)
      // First request hits the DB, the second is served from cache.
      expect(spy).toHaveBeenCalledTimes(1)
    } finally {
      spy.mockRestore()
    }
  })

  it('invalidates the cache when a write happens', async () => {
    const spy = jest.spyOn(Grocery, 'find')
    try {
      await request(app).get(API) // populate cache (miss)
      await request(app).post(API).send({ name: 'New', quantity: 1, expiresAt: daysFromNow(2) })
      await request(app).get(API) // must re-query after invalidation

      // expect: first read + read after mutation = 2 DB hits
      expect(spy).toHaveBeenCalledTimes(2)
    } finally {
      spy.mockRestore()
    }
  })
})
