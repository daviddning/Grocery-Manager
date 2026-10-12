import request from 'supertest'
import app from '../app'
import Grocery from '../models/Grocery'

const API = '/api/groceries'

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

describe('GET /api/health', () => {
  it('reports ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})

describe('POST /api/groceries', () => {
  it('creates an item and returns 201 with the document', async () => {
    const res = await request(app).post(API).send({
      name: 'Milk',
      quantity: 2,
      unit: 'l',
      expiresAt: daysFromNow(30),
      category: 'Dairy',
      price: 3.99,
    })

    expect(res.status).toBe(201)
    expect(res.body._id).toBeDefined()
    expect(res.body.name).toBe('Milk')
    expect(res.body.expirationStatus).toBe('fresh')
  })

  it('merges quantity when the same name and expiry already exist', async () => {
    const payload = {
      name: 'Eggs',
      quantity: 6,
      expiresAt: daysFromNow(10),
      category: 'Dairy',
    }
    const first = await request(app).post(API).send(payload)
    const second = await request(app).post(API).send({ ...payload, quantity: 4 })

    expect(second.status).toBe(200)
    expect(second.body.quantity).toBe(10)
    expect(second.body._id).toBe(first.body._id)
  })

  it('rejects an invalid document', async () => {
    const res = await request(app).post(API).send({ quantity: 1 })
    expect(res.status).toBe(400)
  })

  it('rejects a category outside the enum', async () => {
    const res = await request(app).post(API).send({
      name: 'Mystery',
      quantity: 1,
      expiresAt: daysFromNow(2),
      category: 'NotACategory',
    })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/groceries', () => {
  beforeEach(async () => {
    await Grocery.create([
      { name: 'Apple', quantity: 5, expiresAt: daysFromNow(-1), category: 'Produce' },
      { name: 'Bread', quantity: 1, expiresAt: daysFromNow(2), category: 'Bakery' },
      { name: 'Rice', quantity: 10, expiresAt: daysFromNow(30), category: 'Pantry' },
    ])
  })

  it('returns all items', async () => {
    const res = await request(app).get(API)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(3)
  })

  it('filters by category', async () => {
    const res = await request(app).get(`${API}?category=Bakery`)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('Bread')
  })

  it('searches by name (case-insensitive)', async () => {
    const res = await request(app).get(`${API}?search=app`)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('Apple')
  })

  it('filters expired items via status=expired', async () => {
    const res = await request(app).get(`${API}?status=expired`)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('Apple')
  })

  it('filters expiring-this-week via status', async () => {
    const res = await request(app).get(`${API}?status=expiring-this-week`)
    expect(res.body.map((g: { name: string }) => g.name)).toContain('Bread')
  })

  it('sorts by name when requested', async () => {
    const res = await request(app).get(`${API}?sortBy=name`)
    expect(res.body.map((g: { name: string }) => g.name)).toEqual([
      'Apple',
      'Bread',
      'Rice',
    ])
  })

  it('filters low-stock items via status=low-stock', async () => {
    const res = await request(app).get(`${API}?status=low-stock`)
    expect(res.status).toBe(200)
    // Only Bread (quantity 1, default threshold 1) is at or below its threshold.
    expect(res.body.map((g: { name: string }) => g.name)).toEqual(['Bread'])
  })

  it('respects a per-item low-stock threshold in the filter', async () => {
    await Grocery.create({
      name: 'Coffee',
      quantity: 3,
      expiresAt: daysFromNow(20),
      category: 'Pantry',
      lowStockThreshold: 5,
    })
    const res = await request(app).get(`${API}?status=low-stock`)
    const names = res.body.map((g: { name: string }) => g.name)
    expect(names).toContain('Coffee')
    expect(names).not.toContain('Rice') // qty 10, threshold 1
  })
})

describe('derived endpoints', () => {
  beforeEach(async () => {
    await Grocery.create([
      { name: 'Yogurt', quantity: 3, expiresAt: daysFromNow(2), category: 'Dairy' },
      { name: 'Old Cheese', quantity: 3, expiresAt: daysFromNow(-2), category: 'Dairy' },
      { name: 'Salt', quantity: 9, expiresAt: daysFromNow(90), category: 'Pantry', lowStockThreshold: 2 },
      { name: 'Pepper', quantity: 1, expiresAt: daysFromNow(90), category: 'Pantry', lowStockThreshold: 2 },
    ])
  })

  it('GET /expiring returns only items within the window', async () => {
    const res = await request(app).get(`${API}/expiring?days=3`)
    expect(res.status).toBe(200)
    expect(res.body.map((g: { name: string }) => g.name)).toEqual(['Yogurt'])
  })

  it('GET /expired returns only past-expiry items', async () => {
    const res = await request(app).get(`${API}/expired`)
    expect(res.body.map((g: { name: string }) => g.name)).toEqual(['Old Cheese'])
  })

  it('GET /low-stock filters in the database, not in memory', async () => {
    const res = await request(app).get(`${API}/low-stock`)
    expect(res.status).toBe(200)
    const names = res.body.map((g: { name: string }) => g.name)
    expect(names).toContain('Pepper')
    expect(names).not.toContain('Salt')
  })

  it('GET /analytics aggregates counts, categories and value', async () => {
    const res = await request(app).get(`${API}/analytics`)
    expect(res.status).toBe(200)
    expect(res.body.total).toBe(4)
    expect(res.body.expired).toBe(1)
    expect(res.body.lowStock).toBe(1)
    expect(res.body.byCategory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ _id: 'Pantry', count: 2 }),
      ]),
    )
  })
})

describe('PUT and DELETE', () => {
  it('updates an existing item', async () => {
    const created = await request(app).post(API).send({
      name: 'Butter',
      quantity: 1,
      expiresAt: daysFromNow(7),
    })
    const res = await request(app)
      .put(`${API}/${created.body._id}`)
      .send({ quantity: 4 })

    expect(res.status).toBe(200)
    expect(res.body.quantity).toBe(4)
  })

  it('404s when updating a missing item', async () => {
    const res = await request(app)
      .put(`${API}/64b000000000000000000000`)
      .send({ quantity: 2 })
    expect(res.status).toBe(404)
  })

  it('deletes an item', async () => {
    const created = await request(app).post(API).send({
      name: 'Cheese',
      quantity: 1,
      expiresAt: daysFromNow(3),
    })
    const res = await request(app).delete(`${API}/${created.body._id}`)
    expect(res.status).toBe(204)
    expect(await Grocery.countDocuments()).toBe(0)
  })

  it('bulk-deletes expired items', async () => {
    await Grocery.create([
      { name: 'A', quantity: 1, expiresAt: daysFromNow(-5) },
      { name: 'B', quantity: 1, expiresAt: daysFromNow(5) },
    ])
    const res = await request(app).delete(`${API}/expired/bulk`)
    expect(res.body.deletedCount).toBe(1)
    expect(await Grocery.countDocuments()).toBe(1)
  })
})

describe('notifications', () => {
  it('returns prioritised notifications for expiring and low stock items', async () => {
    await Grocery.create([
      { name: 'Expiring', quantity: 5, expiresAt: daysFromNow(1), lowStockThreshold: 1 },
      { name: 'LowStock', quantity: 1, expiresAt: daysFromNow(60), lowStockThreshold: 3 },
    ])
    const res = await request(app).get('/api/notifications')
    expect(res.status).toBe(200)
    const types = res.body.map((n: { type: string }) => n.type)
    expect(types).toContain('expiring-soon')
    expect(types).toContain('low-stock')
  })

  it('counts notifications by priority', async () => {
    await Grocery.create([
      { name: 'Expiring', quantity: 5, expiresAt: daysFromNow(-1), lowStockThreshold: 1 },
    ])
    const res = await request(app).get('/api/notifications/count')
    expect(res.body.total).toBeGreaterThanOrEqual(1)
    expect(res.body.high).toBeGreaterThanOrEqual(1)
  })
})
