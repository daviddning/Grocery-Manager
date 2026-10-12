/**
 * Index benchmark: measures the real effect of the compound index on the
 * recipe / inventory query path (`name` + `expiresAt`), and writes the result
 * to docs/benchmarks.json so the README can quote a measured number.
 *
 * Run:  node scripts/benchmark.js
 * Uses an in-memory MongoDB seeded with a realistic document count.
 */
const path = require('path')
const fs = require('fs')

const backendDir = path.join(__dirname, '..', 'backend')
const req = (name) => require(path.join(backendDir, 'node_modules', name))

const COUNT = Number(process.env.SEED || 20000)

function stats(samples) {
  const s = [...samples].sort((a, b) => a - b)
  const at = (p) => s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]
  return {
    min: +s[0].toFixed(2),
    median: +at(50).toFixed(2),
    p95: +at(95).toFixed(2),
  }
}

async function timeIt(fn, runs = 30) {
  // warm-up
  for (let i = 0; i < 5; i++) await fn()
  const samples = []
  for (let i = 0; i < runs; i++) {
    const t0 = process.hrtime.bigint()
    await fn()
    samples.push(Number(process.hrtime.bigint() - t0) / 1e6)
  }
  return stats(samples)
}

async function main() {
  const { MongoMemoryServer } = req('mongodb-memory-server')
  const mongoose = req('mongoose')
  const mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())

  const Grocery = require(path.join(backendDir, 'dist', 'models', 'Grocery')).default

  const day = 86400000
  const cats = ['Produce', 'Dairy', 'Bakery', 'Pantry', 'Frozen', 'Meat']
  const docs = Array.from({ length: COUNT }, (_, i) => ({
    name: `Item-${i}`,
    quantity: (i % 12) + 1,
    expiresAt: new Date(Date.now() + ((i % 60) - 10) * day),
    category: cats[i % cats.length],
    price: +((i % 900) / 100 + 1).toFixed(2),
  }))

  // Insert WITHOUT indexes so the scan-vs-index comparison is fair, then build.
  await Grocery.collection.insertMany(docs)
  console.log(`seeded ${COUNT} documents`)

  const query = { name: 'Item-12345', expiresAt: { $gte: new Date(0) } }

  await Grocery.collection.dropIndexes()
  const before = await timeIt(() => Grocery.find(query).lean())

  await Grocery.collection.createIndex({ name: 1, expiresAt: 1 })
  const after = await timeIt(() => Grocery.find(query).lean())

  // Confirm the index is actually used
  const explain = await Grocery.find(query).lean().explain('executionStats')
  const usedIndex = explain?.queryPlanner?.winningPlan?.inputStage?.indexName
    || explain?.queryPlanner?.winningPlan?.stage

  const reduction = before.median > 0
    ? (1 - after.median / before.median) * 100
    : 0

  const result = {
    generatedAt: new Date().toISOString(),
    documents: COUNT,
    queryPattern: 'name + expiresAt (compound index)',
    scan: before,
    indexed: after,
    medianReductionPct: +reduction.toFixed(1),
    indexUsed: usedIndex,
  }

  console.log(JSON.stringify(result, null, 2))

  const outDir = path.join(__dirname, '..', 'docs')
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'benchmarks.json'), JSON.stringify(result, null, 2))
  console.log(`\nwrote docs/benchmarks.json`)

  await mongoose.disconnect()
  await mongod.stop()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
