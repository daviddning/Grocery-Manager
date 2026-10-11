import app from './app'
import { connectDB } from './config/db'
import { connectCache } from './config/cache'

const PORT = Number(process.env.PORT) || 3001

Promise.all([connectDB(), connectCache()]).then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})
