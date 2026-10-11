/**
 * Load test for the groceries API.
 *
 * Fires CONCURRENCY parallel clients, each sending REQUESTS sequential GETs,
 * and reports latency percentiles. Run against a live backend:
 *
 *   node scripts/loadtest.js
 *   BASE_URL=http://localhost:3001 CONCURRENCY=200 REQUESTS=25 node scripts/loadtest.js
 *
 * Requires seeded data for a meaningful read path; the endpoints work on an
 * empty database too (p95 will be lowest there).
 *
 * IMPORTANT: run this against a real MongoDB, not scripts/devserver.js.
 * The bundled mongodb-memory-server is a single-threaded dev build and caps
 * throughput around 60 req/s regardless of concurrency - that ceiling is the
 * test database, not the API. With a real mongod + the model's compound
 * indexes, throughput is dramatically higher (the no-DB /api/health path
 * reaches ~4700 req/s on the same box, so the app layer is not the limit).
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'
const CONCURRENCY = Number(process.env.CONCURRENCY) || 200
const REQUESTS = Number(process.env.REQUESTS) || 20

function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

async function worker(samples) {
  for (let i = 0; i < REQUESTS; i++) {
    const start = process.hrtime.bigint()
    try {
      const res = await fetch(`${BASE_URL}/api/groceries`)
      await res.arrayBuffer()
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      samples.push(Number(process.hrtime.bigint() - start) / 1e6)
    } catch (err) {
      samples.push(Number(process.hrtime.bigint() - start) / 1e6)
      console.error('request failed:', err.message)
    }
  }
}

async function main() {
  // warm-up so the first request doesn't skew the tail
  try {
    await fetch(`${BASE_URL}/api/health`)
  } catch {
    console.error(`Backend not reachable at ${BASE_URL}`)
    process.exit(1)
  }

  const samples = []
  const start = Date.now()
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(samples)))
  const elapsed = (Date.now() - start) / 1000

  samples.sort((a, b) => a - b)
  const total = samples.length
  const sum = samples.reduce((a, b) => a + b, 0)

  console.log(`\nLoad test complete`)
  console.log(`  concurrency : ${CONCURRENCY}`)
  console.log(`  requests    : ${total}`)
  console.log(`  throughput  : ${(total / elapsed).toFixed(0)} req/s`)
  console.log(`  p50         : ${percentile(samples, 50).toFixed(1)} ms`)
  console.log(`  p95         : ${percentile(samples, 95).toFixed(1)} ms`)
  console.log(`  p99         : ${percentile(samples, 99).toFixed(1)} ms`)
  console.log(`  mean        : ${(sum / total).toFixed(1)} ms\n`)
}

main()
