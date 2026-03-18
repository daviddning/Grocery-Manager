import { Router } from 'express'
import Grocery from '../models/Grocery'

const router = Router()

// Get all groceries with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, status, search, sortBy = 'expiresAt' } = req.query
    
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
    }
    
    // Determine sort order
    let sortOptions: any = {}
    if (sortBy === 'expiresAt') sortOptions.expiresAt = 1
    else if (sortBy === 'name') sortOptions.name = 1
    else if (sortBy === 'category') sortOptions.category = 1
    else if (sortBy === 'purchaseDate') sortOptions.purchaseDate = -1
    
    const groceries = await Grocery.find(query).sort(sortOptions)
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
    const groceries = await Grocery.find().sort({ quantity: 1 })
    
    // Filter items where quantity <= lowStockThreshold
    const lowStockItems = groceries.filter(
      item => item.quantity <= item.lowStockThreshold
    )
    
    res.json(lowStockItems)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch low stock items' })
  }
})

// Get analytics/stats
router.get('/analytics', async (_req, res) => {
  try {
    const now = new Date()
    const threeDays = new Date()
    threeDays.setDate(now.getDate() + 3)
    
    const [
      total,
      expired,
      expiringSoon,
      lowStock,
      byCategory,
      totalValue
    ] = await Promise.all([
      Grocery.countDocuments(),
      Grocery.countDocuments({ expiresAt: { $lt: now } }),
      Grocery.countDocuments({ 
        expiresAt: { $gte: now, $lte: threeDays } 
      }),
      Grocery.find().then(items => 
        items.filter(i => i.quantity <= i.lowStockThreshold).length
      ),
      Grocery.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Grocery.aggregate([
        { $group: { _id: null, total: { $sum: '$price' } } }
      ])
    ])
    
    res.json({
      total,
      expired,
      expiringSoon,
      lowStock,
      byCategory,
      totalValue: totalValue[0]?.total || 0
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

// Add grocery (with duplicate merge logic)
router.post('/', async (req, res) => {
  try {
    const { name, quantity, expiresAt, ...rest } = req.body

    // Check for existing item with same name and expiration
    const existing = await Grocery.findOne({
      name: new RegExp(`^${name}$`, 'i'),
      expiresAt,
    })

    if (existing) {
      existing.quantity += quantity
      
      // Update other fields if provided
      if (rest.price !== undefined) existing.price = rest.price
      if (rest.store) existing.store = rest.store
      if (rest.category) existing.category = rest.category
      if (rest.unit) existing.unit = rest.unit
      
      await existing.save()
      return res.json(existing)
    }

    const newItem = await Grocery.create({
      name,
      quantity,
      expiresAt,
      ...rest
    })

    res.status(201).json(newItem)
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
    
    res.json({ deletedCount: result.deletedCount })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expired items' })
  }
})

export default router