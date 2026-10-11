# Grocery Manager

A full-stack kitchen-inventory app: track what you have, get warned before it
expires, and stop throwing food away. Built with a TypeScript/Express API, a
React front end, MongoDB for persistence and an optional Redis cache in front
of the read path.

<!-- Replace with a real screenshot / GIF of the dashboard. -->
<!-- ![Dashboard](docs/screenshot.png) -->

## Features

- **Inventory tracking** with categories, units, price and per-item low-stock
  thresholds.
- **Expiration intelligence** — every item is classified as fresh,
  expiring-this-week, expiring-soon or expired, computed on the model as
  virtuals so the front end never re-derives it.
- **Notifications** — prioritised (high/medium/low) alerts for expiring items
  and low stock.
- **Analytics** — totals, expired/expiring/low-stock counts, category
  breakdown and total inventory value, aggregated in MongoDB.
- **Search, filter and sort** across the collection.
- **Duplicate merge** — adding an item that matches an existing name and
  expiry increments the quantity instead of creating a second row.
- **Bulk cleanup** — delete every expired item in one request.

## Architecture

```
frontend/            React 19 + Vite + TypeScript
  src/api.ts         Typed API client (single fetch layer)
  src/components/    Dashboard, AddGroceryForm, GroceryList, FilterBar,
                     NotificationPanel

backend/             Express 5 + TypeScript
  src/app.ts         Express app (routes + middleware only)
  src/index.ts       Server entry: connects DB + cache, then listens
  src/models/        Mongoose schema, indexes and virtuals
  src/routes/        groceries + notifications routers
  src/services/      notificationService (priority bucketing)
  src/config/        db.ts, cache.ts
  src/__tests__/     Jest + supertest integration suite

scripts/             loadtest.js, devserver.js
docker-compose.yml   frontend + backend + mongo + redis
```

Design notes:

- **The app and the server are separate.** `app.ts` exports the Express app
  with no side effects; `index.ts` owns the listening socket. That is what
  lets the test suite import the app without binding a port.
- **The cache degrades gracefully.** If `REDIS_URL` is unset or Redis is
  unreachable, every cache call becomes a no-op and the API keeps serving from
  MongoDB. Local development and CI need no Redis at all.
- **The database does the filtering.** Low-stock and notification queries use
  Mongo expressions/aggregation rather than loading the collection and
  filtering in JavaScript.

## Getting started

### With Docker (recommended)

Brings up MongoDB, Redis, the API and the front end together:

```bash
docker compose up --build
```

- Front end: http://localhost:8080
- API: http://localhost:3001/api/health

### Locally

Requires Node 20+ and a MongoDB instance.

```bash
# backend
cd backend
npm install
cp ../.env.example .env      # adjust MONGODB_URI if needed
npm run dev                  # http://localhost:3001

# frontend (separate terminal)
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

Redis is optional — leave `REDIS_URL` unset to run without a cache.

## Testing

```bash
cd backend
npm test          # 25 integration + unit tests (in-memory MongoDB)
npm run typecheck
```

The suite boots an in-memory MongoDB (`mongodb-memory-server`) and exercises
every endpoint with `supertest`, so no local database is required.

## Load testing

```bash
node scripts/devserver.js &              # or point at a real backend
BASE_URL=http://localhost:3001 CONCURRENCY=200 REQUESTS=20 node scripts/loadtest.js
```

The script reports p50/p95/p99 latency and throughput.

> **Note:** measure against a real MongoDB. The in-memory server used by
> `devserver.js` is a single-threaded development build that caps at roughly
> 60 req/s regardless of concurrency — that ceiling is the test database, not
> the API. On the same machine the database-free `/api/health` route sustains
> ~4700 req/s, so the application layer is not the bottleneck.

## API reference

Base path: `/api`

| Method | Path                   | Description                                    |
| ------ | ---------------------- | ---------------------------------------------- |
| GET    | `/health`              | Liveness check                                 |
| GET    | `/groceries`           | List items. Query: `category`, `status`, `search`, `sortBy` |
| POST   | `/groceries`           | Create (or merge onto a matching name + expiry) |
| PUT    | `/groceries/:id`       | Update an item                                 |
| DELETE | `/groceries/:id`       | Delete an item                                 |
| DELETE | `/groceries/expired/bulk` | Delete every expired item                   |
| GET    | `/groceries/expiring`  | Items expiring within `?days=N` (default 3)    |
| GET    | `/groceries/expired`   | Past-expiry items                              |
| GET    | `/groceries/fresh`     | Items fresh beyond 7 days                      |
| GET    | `/groceries/low-stock` | Items at or below their low-stock threshold    |
| GET    | `/groceries/analytics` | Aggregate counts, category breakdown, value    |
| GET    | `/notifications`       | Prioritised notifications                      |
| GET    | `/notifications/count` | Notification counts by priority                |

## Environment variables

See `.env.example`. On the backend: `PORT`, `MONGODB_URI`, `REDIS_URL`
(optional). On the front end: `VITE_API_URL` (build-time).

## Tech stack

TypeScript · Node.js · Express 5 · MongoDB / Mongoose · Redis · React 19 ·
Vite · Docker · Jest · Supertest · GitHub Actions

## License

MIT
