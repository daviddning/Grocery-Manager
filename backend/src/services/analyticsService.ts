import Grocery from '../models/Grocery'

/**
 * Read-side analytics built as MongoDB aggregation pipelines.
 *
 * Everything the dashboard needs is computed in a single pass on the server
 * rather than by loading documents into Node and reducing them in JavaScript,
 * so the cost stays flat as the collection grows.
 */

const DAY_MS = 24 * 60 * 60 * 1000

export interface WasteForecastBucket {
  bucket: string
  items: number
  value: number
}

export interface AnalyticsSummary {
  total: number
  expired: number
  expiringSoon: number
  lowStock: number
  byCategory: Array<{ _id: string; count: number; value: number }>
  totalValue: number
  /** Projected wastage if nothing is consumed, grouped by days-until-expiry. */
  wasteForecast: WasteForecastBucket[]
}

/**
 * Classify every item into an expiry bucket in one aggregation, then sum
 * counts and dollar value per bucket. $switch keeps the bucketing in the
 * database so no per-document round trip is needed.
 */
async function wasteForecast(now: Date): Promise<WasteForecastBucket[]> {
  const rows = await Grocery.aggregate<{ _id: string; items: number; value: number }>([
    {
      $project: {
        value: { $ifNull: ['$price', 0] },
        bucket: {
          $switch: {
            branches: [
              { case: { $lt: ['$expiresAt', now] }, then: 'expired' },
              {
                case: {
                  $lte: ['$expiresAt', new Date(now.getTime() + 3 * DAY_MS)],
                },
                then: '0-3 days',
              },
              {
                case: {
                  $lte: ['$expiresAt', new Date(now.getTime() + 7 * DAY_MS)],
                },
                then: '4-7 days',
              },
              {
                case: {
                  $lte: ['$expiresAt', new Date(now.getTime() + 30 * DAY_MS)],
                },
                then: '8-30 days',
              },
            ],
            default: '30+ days',
          },
        },
      },
    },
    {
      $group: {
        _id: '$bucket',
        items: { $sum: 1 },
        value: { $sum: '$value' },
      },
    },
  ])

  const order = ['expired', '0-3 days', '4-7 days', '8-30 days', '30+ days']
  return rows
    .map((r) => ({ bucket: r._id, items: r.items, value: Number(r.value.toFixed(2)) }))
    .sort((a, b) => order.indexOf(a.bucket) - order.indexOf(b.bucket))
}

/**
 * Single $facet pipeline: one pass over the collection produces the headline
 * counts, the per-category breakdown and the total value. Avoids the N
 * separate queries the naive implementation used.
 */
export async function getAnalytics(): Promise<AnalyticsSummary> {
  const now = new Date()
  const threeDays = new Date(now.getTime() + 3 * DAY_MS)

  const [facet] = await Grocery.aggregate<{
    summary: Array<{ total: number; expired: number; expiringSoon: number; lowStock: number; totalValue: number }>
    byCategory: Array<{ _id: string; count: number; value: number }>
  }>([
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              expired: {
                $sum: { $cond: [{ $lt: ['$expiresAt', now] }, 1, 0] },
              },
              expiringSoon: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ['$expiresAt', now] },
                        { $lte: ['$expiresAt', threeDays] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              lowStock: {
                $sum: {
                  $cond: [
                    { $lte: ['$quantity', '$lowStockThreshold'] },
                    1,
                    0,
                  ],
                },
              },
              totalValue: { $sum: { $ifNull: ['$price', 0] } },
            },
          },
        ],
        byCategory: [
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 },
              value: { $sum: { $ifNull: ['$price', 0] } },
            },
          },
          { $sort: { count: -1 } },
        ],
      },
    },
  ])

  const summary = facet?.summary[0] ?? {
    total: 0,
    expired: 0,
    expiringSoon: 0,
    lowStock: 0,
    totalValue: 0,
  }

  return {
    total: summary.total,
    expired: summary.expired,
    expiringSoon: summary.expiringSoon,
    lowStock: summary.lowStock,
    totalValue: Number(summary.totalValue.toFixed(2)),
    byCategory: (facet?.byCategory ?? []).map((c) => ({
      _id: c._id,
      count: c.count,
      value: Number(c.value.toFixed(2)),
    })),
    wasteForecast: await wasteForecast(now),
  }
}
