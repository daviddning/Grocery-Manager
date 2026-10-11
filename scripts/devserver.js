// Boots the backend against an in-memory MongoDB with seeded data, so the
// load test can run without a local mongod. Usage: node scripts/devserver.js
//
// Run from the repo root. Resolves backend deps explicitly because this script
// lives outside backend/.
const path = require('path')

const backendDir = path.join(__dirname, '..', 'backend')
const req = (name) => require(path.join(backendDir, 'node_modules', name))

async function main() {
  const { MongoMemoryServer } = req('mongodb-memory-server')
  const mongod = await MongoMemoryServer.create()
  process.env.MONGODB_URI = mongod.getUri()
  process.env.PORT = process.env.PORT || '3001'

  const mongoose = req('mongoose')
  await mongoose.connect(process.env.MONGODB_URI)

  const Grocery = require(path.join(backendDir, 'dist', 'models', 'Grocery')).default
  const now = Date.now()
  const day = 86400000
  const cats = ['Produce', 'Dairy', 'Bakery', 'Pantry', 'Frozen']
  const docs = Array.from({ length: 200 }, (_, i) => ({
    name: `Item ${i}`,
    quantity: (i % 12) + 1,
    expiresAt: new Date(now + ((i % 30) - 5) * day),
    category: cats[i % cats.length],
    price: (i % 9) + 1.5,
  }))
  await Grocery.insertMany(docs)
  console.log(`seeded ${docs.length} items`)

  const app = require(path.join(backendDir, 'dist', 'app')).default
  app.listen(Number(process.env.PORT), () =>
    console.log(`dev server on :${process.env.PORT}`),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
