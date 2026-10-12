# 🥑 KitchenHub — Grocery Manager

A full-stack kitchen-inventory platform: track what you have, get warned before
it expires, and waste less food. TypeScript end to end — Express 5 API, React 19
front end, MongoDB for persistence and an optional Redis read-through cache.

[![CI](https://github.com/daviddning/Grocery-Manager/actions/workflows/ci.yml/badge.svg)](https://github.com/daviddning/Grocery-Manager/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-39%20passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-80%25-green)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![License](https://img.shields.io/badge/license-MIT-blue)

<!-- Replace with a real screenshot or GIF of the dashboard. -->
<!-- ![Dashboard](docs/screenshot.png) -->
<img width="1852" height="972" alt="image" src="https://github.com/user-attachments/assets/6280b057-f92b-4217-a452-8ab548597adf" />
<img width="1440" height="976" alt="image" src="https://github.com/user-attachments/assets/71f8094e-a971-49fb-935d-278eb9accbc0" />


---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Benchmarks](#benchmarks)
- [Getting started](#getting-started)
- [Testing](#testing)
- [API reference](#api-reference)
- [Engineering notes](#engineering-notes)
- [Tech stack](#tech-stack)

---

## Features

- **Inventory tracking** — categories, units, price, store, per-item low-stock
  thresholds and optional barcode/image/notes.
- **Expiration intelligence** — every item is bucketed into *fresh*,
  *expiring-this-week*, *expiring-soon* or *expired* by a Mongoose virtual, so
  the client never re-derives it and all consumers agree.
- **Waste forecast** — a single aggregation pipeline projects how much inventory
  (count + dollar value) will expire in the next 0–3, 4–7, 8–30 and 30+ days.
- **Notifications** — prioritised (high/medium/low) alerts for expiring items
  and low stock, polled by the UI.
- **Analytics dashboard** — totals, expired/expiring/low-stock counts, a
  per-category breakdown and total inventory value.
- **Search, filter & sort** across the collection.
- **Atomic duplicate-merge** — adding an item matching an existing name+expiry
  increments the quantity instead of creating a second row, safely under
  concurrency.
- **Bulk cleanup** — delete every expired item in one request.

---

## Architecture

```
┌──────────────┐        ┌──────────────────┐        ┌──────────────┐
│  React SPA   │  HTTP  │  Express 5 API   │        │   MongoDB    │
│  (Vite/TS)   ├───────►│  TypeScript      ├───────►│  + indexes   │
└──────────────┘  /api  └────────┬─────────┘        └──────────────┘
                                 │ read-through
                                 ▼
                          ┌──────────────┐
                          │    Redis     │  (optional — degrades to no-op)
                          └──────────────┘
```

```
frontend/                 React 19 + Vite + TypeScript
  src/hooks/              useGroceries, useNotifications, useDebouncedValue
  src/api/                typed fetch layer (groceries, notifications)
  src/components/         Dashboard, AddGroceryForm, GroceryList,
                          FilterBar, NotificationPanel
  src/test/               Vitest + Testing Library

backend/                  Express 5 + TypeScript
  src/app.ts              Express app (routes + middleware only, no side effects)
  src/index.ts            entry point: connects DB + cache, then listens
  src/models/             Mongoose schema, compound + unique indexes, virtuals
  src/routes/             groceries, notifications
  src/services/           analyticsService, notificationService
  src/config/             db, cache, transaction
  src/__tests__/          Jest + Supertest suite (36 tests)

scripts/                  devserver.js, loadtest.js, benchmark.js
docker-compose.yml        frontend + backend + mongo + redis
```

---

## Benchmarks

All numbers are produced by scripts in this repo and are reproducible with one
command — no hand-waving.

### Compound index — `{ name, expiresAt }`

`node scripts/benchmark.js` measures the compound index against a forced
collection scan at 20,000 documents:

| Query path        | Median | p95    |
| ----------------- | ------ | ------ |
| Collection scan   | 58 ms  | 77 ms  |
| Compound index    | 1.6 ms | 2.0 ms |

> **~97% reduction in median query latency**, with `explain()` confirming the
> `name_1_expiresAt_1` index is chosen.

### Throughput

`node scripts/loadtest.js` drives the read path under configurable concurrency
and prints p50/p95/p99 and req/s. Run it against a real MongoDB — the in-memory
test server is single-threaded and caps around 60 req/s regardless of load
(see [Engineering notes](#engineering-notes)).

---

## Getting started

### Docker (recommended)

```bash
docker compose up --build
```

| Service  | URL                                  |
| -------- | ------------------------------------ |
| Frontend | http://localhost:8080                |
| API      | http://localhost:3001/api/health     |

Brings up MongoDB, Redis, the API and the front end, with healthchecks gating
startup order.

### Local development

Requires Node 20+ and MongoDB.

```bash
# backend
cd backend
npm install
npm run dev            # http://localhost:3001

# frontend (separate terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173
```

Redis is optional. Leave `REDIS_URL` unset and the cache becomes a no-op.

---

## Testing

```bash
cd backend  && npm test        # 36 tests — Jest + Supertest + in-memory Mongo
cd frontend && npm test        # 3 tests  — Vitest + Testing Library
```

The backend suite spins up an in-memory MongoDB, so no local database is
required. It covers every endpoint plus the concurrency and caching guarantees
below. Coverage floor is enforced in CI (80% statements).

---

## API reference

Base path `/api`.

| Method | Path                      | Description                                             |
| ------ | ------------------------- | ------------------------------------------------------- |
| GET    | `/health`                 | Liveness check                                          |
| GET    | `/groceries`              | List. Query: `category`, `status`, `search`, `sortBy`   |
| POST   | `/groceries`              | Create, or merge onto a matching name + expiry          |
| PUT    | `/groceries/:id`          | Update an item                                          |
| DELETE | `/groceries/:id`          | Delete an item                                          |
| DELETE | `/groceries/expired/bulk` | Delete every expired item                               |
| GET    | `/groceries/expiring`     | Expiring within `?days=N` (default 3)                   |
| GET    | `/groceries/expired`      | Past-expiry items                                       |
| GET    | `/groceries/fresh`        | Fresh beyond 7 days                                     |
| GET    | `/groceries/low-stock`    | At or below the low-stock threshold                     |
| GET    | `/groceries/analytics`    | Counts, category breakdown, value, waste forecast       |
| GET    | `/notifications`          | Prioritised notifications                               |
| GET    | `/notifications/count`    | Notification counts by priority                         |

---

## Engineering notes

Decisions worth calling out, each with a test behind it.

**Atomic create-or-merge.** The original read-then-save merge lost updates: two
concurrent adds of the same item both read `quantity = N` and both wrote
`N + x`. It is now a single `$inc` upsert, retrying on duplicate-key (11000)
because concurrent upserts can race the unique `{name, expiresAt}` index. A test
fires 25 simultaneous adds and asserts exactly one row with the summed quantity.

**Single-pass analytics.** Six separate queries became one `$facet` pipeline
that computes the counts, the per-category breakdown and the total value in one
pass; the waste forecast uses `$switch` to bucket inside the database.

**Indexes do the filtering.** Low-stock and notification queries filter in
MongoDB (`$expr`) rather than loading the collection and reducing in JavaScript.

**Cache degrades gracefully.** The cache sits behind an injectable store. With
no `REDIS_URL` (or an unreachable Redis) every call is a no-op and requests are
served from MongoDB. Tests exercise hit, miss, TTL expiry and prefix
invalidation without needing a live Redis.

**Transactions where the deployment allows.** `withTransaction()` wraps
multi-step work in a session and transparently falls back to non-transactional
execution on standalone MongoDB, which has no replica set.

**App and server are separate.** `app.ts` exports the Express app with no side
effects; `index.ts` owns the socket. That is what lets the suite import the app
without binding a port.

**Load-test honesty.** The bundled in-memory MongoDB is a single-threaded dev
build and saturates around 60 req/s regardless of concurrency — a property of
the test database, not the API. On the same machine the database-free
`/api/health` route sustains ~4,700 req/s, so the application layer is not the
bottleneck. Measure the read path against a real MongoDB.

---

## Environment variables

See `.env.example`.

| Variable        | Where    | Notes                                    |
| --------------- | -------- | ---------------------------------------- |
| `PORT`          | backend  | default `3001`                           |
| `MONGODB_URI`   | backend  | default `mongodb://127.0.0.1:27017/kitchenhub` |
| `REDIS_URL`     | backend  | optional; unset ⇒ cache disabled         |
| `VITE_API_URL`  | frontend | build-time; defaults to localhost        |

---

## Tech stack

**Languages & runtime:** TypeScript, Node.js
**Backend:** Express 5, Mongoose, MongoDB aggregations
**Caching:** Redis
**Frontend:** React 19, Vite, custom hooks
**Infra:** Docker, Docker Compose, GitHub Actions
**Testing:** Jest, Supertest, Vitest, Testing Library, mongodb-memory-server

---

## License

MIT
