import express from 'express'
import cors from 'cors'

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
