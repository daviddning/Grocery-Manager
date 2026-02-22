import { Router } from 'express'
import Grocery from '../models/Grocery'

const router = Router()

// Get all groceries
router.get('/', async (_req, res) => {
  const groceries = await Grocery.find().sort({ expiresAt: 1 })
  res.json(groceries)
})

// Get groceries expiring within N days (default 3)
router.get('/expiring', async (req, res) => {
  const daysParam = Number(req.query.days ?? 3)
  const days = Number.isNaN(daysParam) || daysParam < 0 ? 3 : daysParam

  const now = new Date()
  const threshold = new Date()
  threshold.setDate(now.getDate() + days)

  const groceries = await Grocery.find({
    expiresAt: { $gte: now, $lte: threshold },
  }).sort({ expiresAt: 1 })

  res.json(groceries)
})

// Get expired groceries
router.get('/expired', async (_req, res) => {
  const now = new Date()

  const groceries = await Grocery.find({
    expiresAt: { $lt: now },
  }).sort({ expiresAt: 1 })

  res.json(groceries)
})

// Get fresh groceries (beyond 3 days)
router.get('/fresh', async (_req, res) => {
  const now = new Date()
  const threshold = new Date()
  threshold.setDate(now.getDate() + 3)

  const groceries = await Grocery.find({
    expiresAt: { $gt: threshold },
  }).sort({ expiresAt: 1 })

  res.json(groceries)
})

// Add grocery (with duplicate merge logic)
router.post('/', async (req, res) => {
  const { name, quantity, expiresAt } = req.body

  const existing = await Grocery.findOne({
    name: new RegExp(`^${name}$`, 'i'),
    expiresAt,
  })

  if (existing) {
    existing.quantity += quantity
    await existing.save()
    return res.json(existing)
  }

  const newItem = await Grocery.create({
    name,
    quantity,
    expiresAt,
  })

  res.status(201).json(newItem)
})

// Update grocery
router.put('/:id', async (req, res) => {
  const updated = await Grocery.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  )

  if (!updated) {
    return res.status(404).json({ error: 'Grocery not found' })
  }

  res.json(updated)
})

// Delete grocery
router.delete('/:id', async (req, res) => {
  const deleted = await Grocery.findByIdAndDelete(req.params.id)

  if (!deleted) {
    return res.status(404).json({ error: 'Grocery not found' })
  }

  res.status(204).send()
})

export default router