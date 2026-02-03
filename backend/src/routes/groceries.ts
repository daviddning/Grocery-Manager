import { Router } from 'express'
import { getAllGroceries, addGrocery, updateGrocery, deleteGrocery } from '../data/groceries'

const router = Router()

// Get all groceries
router.get('/', (req, res) => {
  res.json(getAllGroceries())
})

// Add a grocery
router.post('/', (req, res) => {
  const newGrocery = addGrocery(req.body)
  res.status(201).json(newGrocery)
})

// Update a grocery
router.put('/:id', (req, res) => {
  const id = Number(req.params.id)
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' })

  const updated = updateGrocery(id, req.body)
  if (!updated) return res.status(404).json({ error: 'Grocery not found' })

  res.json(updated)
})

// Delete a grocery
router.delete('/:id', (req, res) => {
  const success = deleteGrocery(Number(req.params.id))
  if (!success) return res.status(404).json({ error: 'Grocery not found' })
  res.status(204).send()
})

export default router
