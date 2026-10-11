import express from 'express'
import cors from 'cors'
import groceriesRouter from './routes/groceries'
import notificationRoutes from './routes/notifications'
import { connectDB } from './config/db'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/groceries', groceriesRouter)
app.use('/api/notifications', notificationRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KitchenHub backend alive' })
})

export default app
