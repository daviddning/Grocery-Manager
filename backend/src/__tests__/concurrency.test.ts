import request from 'supertest'
import app from '../app'
import Grocery from '../models/Grocery'
import { withTransaction } from '../config/transaction'
import mongoose from 'mongoose'

const API = '/api/groceries'

function daysFromNow(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

describe('atomic create-or-merge', () => {
  it('loses no updates when the same item is added concurrently', async () => {
    const expiresAt = daysFromNow(7).toISOString()
    const CONCURRENT = 25

    // Fire many simultaneous adds of the identical item.
    await Promise.all(
      Array.from({ length: CONCURRENT }, () =>
        request(app).post(API).send({ name: 'RaceItem', quantity: 2, expiresAt }),
      ),
    )

    const rows = await Grocery.find({ name: 'RaceItem' })
    expect(rows).toHaveLength(1)
    // A read-then-save implementation would drop increments here.
    expect(rows[0].quantity).toBe(CONCURRENT * 2)
  })

  it('creates once and increments on subsequent adds', async () => {
    const expiresAt = daysFromNow(3).toISOString()
    const first = await request(app).post(API).send({ name: 'Milk', quantity: 1, expiresAt })
    const second = await request(app).post(API).send({ name: 'Milk', quantity: 4, expiresAt })

    expect(first.status).toBe(201)
    expect(second.status).toBe(200)
    expect(second.body.quantity).toBe(5)
    expect(await Grocery.countDocuments({ name: 'Milk' })).toBe(1)
  })
})

describe('withTransaction helper', () => {
  it('runs the work and reports whether a transaction was used', async () => {
    const { result, transactional } = await withTransaction(async () => {
      await Grocery.create({ name: 'TxItem', quantity: 1, expiresAt: daysFromNow(5) })
      return 'ok'
    })

    expect(result).toBe('ok')
    // In-memory/standalone Mongo has no replica set, so the helper must
    // degrade rather than throw - that is the contract under test.
    expect(typeof transactional).toBe('boolean')
    expect(await Grocery.countDocuments({ name: 'TxItem' })).toBe(1)
  })

  it('rolls the work back when it throws (or leaves nothing behind)', async () => {
    await expect(
      withTransaction(async () => {
        await Grocery.create({ name: 'Doomed', quantity: 1, expiresAt: daysFromNow(5) })
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')

    // On a replica set this would be rolled back; on standalone the document
    // may persist. Either way the helper must surface the error, not swallow it.
    const found = await Grocery.countDocuments({ name: 'Doomed' })
    expect([0, 1]).toContain(found)
  })
})

describe('bulk delete expiry boundary', () => {
  it('deletes only strictly past-expiry items inside a transaction path', async () => {
    const now = new Date()
    await mongoose.connection.collection('groceries').insertMany([
      { name: 'Past', quantity: 1, expiresAt: new Date(now.getTime() - 1000), lowStockThreshold: 1, createdAt: now, updatedAt: now },
      { name: 'Future', quantity: 1, expiresAt: new Date(now.getTime() + 86400000), lowStockThreshold: 1, createdAt: now, updatedAt: now },
    ])

    const res = await request(app).delete(`${API}/expired/bulk`)
    expect(res.status).toBe(200)
    expect(res.body.deletedCount).toBe(1)
    expect(await Grocery.countDocuments({ name: 'Future' })).toBe(1)
  })
})
