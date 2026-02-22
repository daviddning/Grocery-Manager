import express from 'express'
import cors from 'cors'
import groceriesRouter from './routes/groceries'
import { connectDB } from './config/db'

connectDB()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/groceries', groceriesRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KitchenHub backend alive' })
})

// Start server
app.listen(3001, () => console.log('Server running on port 3001'))
