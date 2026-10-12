// Boots the backend against an in-memory MongoDB with seeded data, so the
// load test and UI demos can run without a local mongod. Usage:
//
//   node scripts/devserver.js                 # empty database
//   node scripts/devserver.js --demo          # realistic demo inventory
//   SEED=200 node scripts/devserver.js        # N synthetic filler rows
//
// Run from the repo root. Resolves backend deps explicitly because this script
// lives outside backend/.
const path = require('path')

const backendDir = path.join(__dirname, '..', 'backend')
const req = (name) => require(path.join(backendDir, 'node_modules', name))

const DAY = 86400000

// A hand-written inventory that exercises every status the UI can show:
// fresh, expiring this week, expiring soon, expired, and low stock.
// `threshold` is 0 unless the item should read as genuinely low — since
// isLowStock is quantity <= threshold, a threshold of 1 flags every
// single-unit item and muddies the view.
const DEMO_ITEMS = [
  { name: 'Whole Milk', quantity: 2, unit: 'l', category: 'Dairy', price: 4.29, store: 'Safeway', days: 5, threshold: 0 },
  { name: 'Greek Yogurt', quantity: 1, unit: 'count', category: 'Dairy', price: 6.49, store: 'Costco', days: 2, threshold: 2 },
  { name: 'Free-Range Eggs', quantity: 12, unit: 'count', category: 'Dairy', price: 5.99, store: 'Safeway', days: 14, threshold: 4 },
  { name: 'Aged Cheddar', quantity: 1, unit: 'count', category: 'Dairy', price: 8.75, store: 'Whole Foods', days: 40, threshold: 0 },

  { name: 'Baby Spinach', quantity: 1, unit: 'count', category: 'Produce', price: 3.49, store: 'Save-On Foods', days: 1, threshold: 0 },
  { name: 'Roma Tomatoes', quantity: 6, unit: 'count', category: 'Produce', price: 4.10, store: 'Save-On Foods', days: 6, threshold: 2 },
  { name: 'Bananas', quantity: 7, unit: 'count', category: 'Produce', price: 2.35, store: 'Safeway', days: 4, threshold: 0 },
  { name: 'Avocados', quantity: 3, unit: 'count', category: 'Produce', price: 5.99, store: 'Whole Foods', days: 3, threshold: 0 },
  { name: 'Sweet Potatoes', quantity: 5, unit: 'lbs', category: 'Produce', price: 3.99, store: 'Costco', days: 25, threshold: 0 },
  { name: 'Blueberries', quantity: 1, unit: 'count', category: 'Produce', price: 4.99, store: 'Safeway', days: -2, threshold: 0 },

  { name: 'Chicken Breast', quantity: 2, unit: 'lbs', category: 'Meat', price: 13.50, store: 'Costco', days: 2, threshold: 0 },
  { name: 'Ground Beef', quantity: 1, unit: 'lbs', category: 'Meat', price: 9.25, store: 'Safeway', days: -1, threshold: 0 },

  { name: 'Sockeye Salmon', quantity: 1, unit: 'lbs', category: 'Seafood', price: 18.99, store: 'Whole Foods', days: 1, threshold: 0 },

  { name: 'Sourdough Loaf', quantity: 1, unit: 'count', category: 'Bakery', price: 6.25, store: 'Local Bakery', days: 3, threshold: 0 },
  { name: 'Whole Wheat Wraps', quantity: 8, unit: 'count', category: 'Bakery', price: 4.50, store: 'Save-On Foods', days: 11, threshold: 2 },

  { name: 'Basmati Rice', quantity: 4, unit: 'kg', category: 'Pantry', price: 12.99, store: 'Costco', days: 180, threshold: 1 },
  { name: 'Olive Oil', quantity: 1, unit: 'l', category: 'Pantry', price: 14.49, store: 'Costco', days: 300, threshold: 0 },
  { name: 'Peanut Butter', quantity: 1, unit: 'count', category: 'Pantry', price: 7.99, store: 'Safeway', days: 150, threshold: 0 },
  { name: 'Rolled Oats', quantity: 2, unit: 'kg', category: 'Pantry', price: 6.79, store: 'Save-On Foods', days: 200, threshold: 0 },
  { name: 'Canned Chickpeas', quantity: 3, unit: 'count', category: 'Pantry', price: 1.89, store: 'Safeway', days: 400, threshold: 0 },

  { name: 'Frozen Peas', quantity: 1, unit: 'kg', category: 'Frozen', price: 4.29, store: 'Costco', days: 120, threshold: 0 },
  { name: 'Vanilla Ice Cream', quantity: 1, unit: 'l', category: 'Frozen', price: 8.49, store: 'Safeway', days: 90, threshold: 0 },

  { name: 'Orange Juice', quantity: 1, unit: 'l', category: 'Beverages', price: 5.49, store: 'Safeway', days: 8, threshold: 0 },
  { name: 'Cold Brew Concentrate', quantity: 1, unit: 'ml', category: 'Beverages', price: 9.99, store: 'Whole Foods', days: 18, threshold: 2 },

  { name: 'Dark Chocolate', quantity: 2, unit: 'count', category: 'Snacks', price: 4.79, store: 'Save-On Foods', days: 220, threshold: 0 },
  { name: 'Almonds', quantity: 1, unit: 'kg', category: 'Snacks', price: 15.99, store: 'Costco', days: 160, threshold: 0 },
  { name: 'Tortilla Chips', quantity: 1, unit: 'count', category: 'Snacks', price: 5.25, store: 'Safeway', days: 60, threshold: 0 },
  { name: 'Paper Towels', quantity: 2, unit: 'count', category: 'Other', price: 11.99, store: 'Costco', days: 500, threshold: 3 },
]

function demoDocs() {
  const now = Date.now()
  return DEMO_ITEMS.map((i) => ({
    name: i.name,
    quantity: i.quantity,
    unit: i.unit,
    category: i.category,
    price: i.price,
    store: i.store,
    expiresAt: new Date(now + i.days * DAY),
    lowStockThreshold: i.threshold,
  }))
}

function syntheticDocs(count) {
  const now = Date.now()
  const cats = ['Produce', 'Dairy', 'Bakery', 'Pantry', 'Frozen']
  return Array.from({ length: count }, (_, i) => ({
    name: `Item-${String(i).padStart(4, '0')}`,
    quantity: (i % 12) + 1,
    expiresAt: new Date(now + ((i % 30) - 5) * DAY),
    category: cats[i % cats.length],
    price: (i % 9) + 1.5,
    lowStockThreshold: 1,
  }))
}

async function main() {
  const { MongoMemoryServer } = req('mongodb-memory-server')
  const mongod = await MongoMemoryServer.create()
  process.env.MONGODB_URI = mongod.getUri()
  process.env.PORT = process.env.PORT || '3001'

  const mongoose = req('mongoose')
  await mongoose.connect(process.env.MONGODB_URI)

  const Grocery = require(path.join(backendDir, 'dist', 'models', 'Grocery')).default

  const wantDemo = process.argv.includes('--demo')
  const seedCount = Number(process.env.SEED || 0)

  if (seedCount > 0) {
    const docs = syntheticDocs(seedCount)
    await Grocery.insertMany(docs)
    console.log(`seeded ${docs.length} synthetic rows (load-test filler)`)
  } else if (wantDemo) {
    const docs = demoDocs()
    await Grocery.insertMany(docs)
    const lows = docs.filter((d) => d.quantity <= d.lowStockThreshold).length
    console.log(`seeded ${docs.length} demo items (${lows} low-stock)`)
  } else {
    console.log('starting with an empty database (--demo or SEED=N to load data)')
  }

  const app = require(path.join(backendDir, 'dist', 'app')).default
  app.listen(Number(process.env.PORT), () =>
    console.log(`dev server on :${process.env.PORT}`),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
