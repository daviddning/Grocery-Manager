import { Router } from 'express'
import Grocery from '../models/Grocery'
import { getCached, setCached, invalidate } from '../config/cache'
import { getAnalytics } from '../services/analyticsService'

const router = Router()

const CACHE_PREFIX = 'groceries:'
const LIST_TTL = 30

/**
 * Atomic create-or-increment.
 *
 * `findOneAndUpdate(..., { upsert: true })` can lose a race: two concurrent
 * upserts may both miss the filter and one insert fails with a duplicate-key
 * error against the unique {name, expiresAt} index. Retrying the same
 * operation turns that into a plain increment, which is the desired outcome.
 */
async function upsertIncrement(
  name: string,
  expiresAt: Date,
  quantity: number,
  setFields: Record<string, unknown>,
  attempts = 5,
) {
  const nameMatch = new RegExp(`^${name}$`, 'i')
  for (let attempt = 0; ; attempt++) {
    try {
      return await Grocery.findOneAndUpdate(
        { name: nameMatch, expiresAt },
        {
          $inc: { quantity },
          // The filter uses a RegExp, which Mongo cannot use as an inserted
          // value, so the literal fields must be supplied via $setOnInsert.
          $setOnInsert: { name, expiresAt },
          ...(Object.keys(setFields).length ? { $set: setFields } : {}),
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      )
    } catch (error) {
      const code = (error as { code?: number })?.code
      // 11000 = duplicate key. The row now exists, so retrying increments it.
      if (code === 11000 && attempt < attempts - 1) continue
      throw error
    }
  }
}

// Get all groceries with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, status, search, sortBy = 'expiresAt' } = req.query

    const cacheKey = `${CACHE_PREFIX}list:${JSON.stringify(req.query)}`
    const cached = await getCached(cacheKey)
    if (cached) return res.json(cached)

    let query: any = {}
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category
    }
    
    // Filter by search term
    if (search) {
      query.name = { $regex: search, $options: 'i' }
    }
    
    // Filter by expiration status
    const now = new Date()
    if (status === 'expired') {
      query.expiresAt = { $lt: now }
    } else if (status === 'expiring-soon') {
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(now.getDate() + 3)
      query.expiresAt = { $gte: now, $lte: threeDaysFromNow }
    } else if (status === 'expiring-this-week') {
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(now.getDate() + 7)
      query.expiresAt = { $gte: now, $lte: sevenDaysFromNow }
    } else if (status === 'fresh') {
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(now.getDate() + 7)
      query.expiresAt = { $gt: sevenDaysFromNow }
    } else if (status === 'low-stock') {
      // Matches the per-item threshold, not a fixed quantity.
      query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] }
    }
    
    // Determine sort order
    let sortOptions: any = {}
    if (sortBy === 'expiresAt') sortOptions.expiresAt = 1
    else if (sortBy === 'name') sortOptions.name = 1
    else if (sortBy === 'category') sortOptions.category = 1
    else if (sortBy === 'purchaseDate') sortOptions.purchaseDate = -1
    
    const groceries = await Grocery.find(query).sort(sortOptions)
    await setCached(cacheKey, groceries, LIST_TTL)
    res.json(groceries)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groceries' })
  }
})

// Get groceries expiring within N days (default 3)
router.get('/expiring', async (req, res) => {
  try {
    const daysParam = Number(req.query.days ?? 3)
    const days = Number.isNaN(daysParam) || daysParam < 0 ? 3 : daysParam

    const now = new Date()
    const threshold = new Date()
    threshold.setDate(now.getDate() + days)

    const groceries = await Grocery.find({
      expiresAt: { $gte: now, $lte: threshold },
    }).sort({ expiresAt: 1 })

    res.json(groceries)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expiring groceries' })
  }
})

// Get expired groceries
router.get('/expired', async (_req, res) => {
  try {
    const now = new Date()

    const groceries = await Grocery.find({
      expiresAt: { $lt: now },
    }).sort({ expiresAt: 1 })

    res.json(groceries)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expired groceries' })
  }
})

// Get fresh groceries (beyond 7 days)
router.get('/fresh', async (_req, res) => {
  try {
    const now = new Date()
    const threshold = new Date()
    threshold.setDate(now.getDate() + 7)

    const groceries = await Grocery.find({
      expiresAt: { $gt: threshold },
    }).sort({ expiresAt: 1 })

    res.json(groceries)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fresh groceries' })
  }
})

// Get low stock items
router.get('/low-stock', async (_req, res) => {
  try {
    // Filter in the database rather than loading every document into memory.
    const lowStockItems = await Grocery.find({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
    }).sort({ quantity: 1 })

    res.json(lowStockItems)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch low stock items' })
  }
})

// Get analytics/stats (single-pass aggregation, see analyticsService)
router.get('/analytics', async (_req, res) => {
  try {
    const analytics = await getAnalytics()
    res.json(analytics)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

// Add grocery (with duplicate merge logic)
router.post('/', async (req, res) => {
  try {
    const { name, quantity, expiresAt, ...rest } = req.body

    // Validate the fields used in the match filter up front. findOneAndUpdate
    // with upsert does not run schema validators against the *filter*, so an
    // upsert with a missing name/expiresAt would happily insert a broken row.
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' })
    }
    if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ error: 'quantity must be a non-negative number' })
    }
    const expiry = new Date(expiresAt)
    if (!expiresAt || Number.isNaN(expiry.getTime())) {
      return res.status(400).json({ error: 'expiresAt must be a valid date' })
    }

    const escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // Atomic find-and-increment. A read-then-save would lose updates when two
    // requests for the same item race; $inc applies the delta on the server.
    // upsert creates the document when no match exists, so a single round trip
    // covers both branches.
    const setFields: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) setFields[k] = v
    }

    const before = await Grocery.findOne({
      name: new RegExp(`^${escaped}$`, 'i'),
      expiresAt: expiry,
    }).select('_id')

    const updated = await upsertIncrement(name, expiry, quantity, setFields)

    await invalidate(CACHE_PREFIX)
    res.status(before ? 200 : 201).json(updated)
  } catch (error) {
    res.status(400).json({ error: 'Failed to create grocery item' })
  }
})

// Update grocery
router.put('/:id', async (req, res) => {
  try {
    const updated = await Grocery.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!updated) {
      return res.status(404).json({ error: 'Grocery not found' })
    }

    await invalidate(CACHE_PREFIX)
    res.json(updated)
  } catch (error) {
    res.status(400).json({ error: 'Failed to update grocery item' })
  }
})

// Delete grocery
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Grocery.findByIdAndDelete(req.params.id)

    if (!deleted) {
      return res.status(404).json({ error: 'Grocery not found' })
    }

    await invalidate(CACHE_PREFIX)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete grocery item' })
  }
})

// Bulk delete expired items
router.delete('/expired/bulk', async (_req, res) => {
  try {
    const now = new Date()
    const result = await Grocery.deleteMany({ 
      expiresAt: { $lt: now } 
    })
    
    await invalidate(CACHE_PREFIX)
    res.json({ deletedCount: result.deletedCount })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expired items' })
  }
})

export default router