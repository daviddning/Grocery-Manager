import { Router } from 'express'
import {
  getAllGroceries,
  addGrocery,
  updateGrocery,
  deleteGrocery,
} from '../data/groceries'

const router = Router()

// Get all groceries
router.get('/', (_req, res) => {
  res.json(getAllGroceries())
})

// Get groceries expiring within N days (default 3)
router.get('/expiring', (req, res) => {
  const daysParam = Number(req.query.days ?? 3)
  const days = Number.isNaN(daysParam) || daysParam < 0 ? 3 : daysParam

  const now = new Date()
  const threshold = new Date()
  threshold.setDate(now.getDate() + days)

  const expiring = getAllGroceries()
    .filter(item => {
      const expires = new Date(item.expiresAt)
      return expires >= now && expires <= threshold
    })
    .sort(
      (a, b) =>
        new Date(a.expiresAt).getTime() -
        new Date(b.expiresAt).getTime()
    )

  res.json(expiring)
})

// Add grocery
router.post('/', (req, res) => {
  const newGrocery = addGrocery(req.body)
  res.status(201).json(newGrocery)
})

// Update grocery
router.put('/:id', (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id))
    return res.status(400).json({ error: 'Invalid ID' })

  const updated = updateGrocery(id, req.body)
  if (!updated)
    return res.status(404).json({ error: 'Grocery not found' })

  res.json(updated)
})

// Delete grocery
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id))
    return res.status(400).json({ error: 'Invalid ID' })

  const success = deleteGrocery(id)
  if (!success)
    return res.status(404).json({ error: 'Grocery not found' })

  res.status(204).send()
})

// Get expired groceries
router.get('/expired', (_req, res) => {
  const now = new Date()

  const expired = getAllGroceries()
    .filter(item => new Date(item.expiresAt) < now)
    .sort(
      (a, b) =>
        new Date(a.expiresAt).getTime() -
        new Date(b.expiresAt).getTime()
    )

  res.json(expired)
})

router.get('/fresh', (_req, res) => {
  const now = new Date()
  const threshold = new Date()
  threshold.setDate(now.getDate() + 3)

  const fresh = getAllGroceries()
    .filter(item => {
      const expires = new Date(item.expiresAt)
      return expires > threshold
    })
    .sort(
      (a, b) =>
        new Date(a.expiresAt).getTime() -
        new Date(b.expiresAt).getTime()
    )

  res.json(fresh)
})

export default router