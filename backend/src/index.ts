import express from 'express'
import cors from 'cors'
import { getAllGroceries, addGrocery } from './data/groceries'
import { deleteGrocery } from './data/groceries'
import { updateGrocery } from './data/groceries'

const app = express()

app.use(cors())
app.use(express.json())

// test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KitchenHub backend alive' })
})

app.listen(3001, () => {
  console.log('Server running on port 3001')
})

app.get('/api/groceries', (req, res) => {
  res.json(getAllGroceries())
})

app.post('/api/groceries', (req, res) => {
  const { name, quantity, expiresAt } = req.body

  if (!name || !quantity || !expiresAt) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const grocery = addGrocery({ name, quantity, expiresAt })
  res.status(201).json(grocery)
})


app.delete('/api/groceries/:id', (req, res) => {
  const id = Number(req.params.id)

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid id' })
  }

  const success = deleteGrocery(id)

  if (!success) {
    return res.status(404).json({ error: 'Grocery not found' })
  }

  res.status(204).send()
})

app.put('/api/groceries/:id', (req, res) => {
  const id = Number(req.params.id)
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

  const updated = updateGrocery(id, req.body)
  if (!updated) return res.status(404).json({ error: 'Grocery not found' })

  res.json(updated)
})
