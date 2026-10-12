import { useEffect, useState } from 'react'
import { getAnalytics, type Analytics } from '../api'
import './Dashboard.css'

export function Dashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setAnalytics(await getAnalytics())
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) return <div className="dashboard loading">Loading analytics…</div>
  if (!analytics) return <div className="dashboard error">Failed to load analytics</div>

  const cards = [
    { key: '', label: 'Total items', value: analytics.total },
    { key: 'warning', label: 'Expiring soon', value: analytics.expiringSoon },
    { key: 'danger', label: 'Expired', value: analytics.expired },
    { key: 'alert', label: 'Low stock', value: analytics.lowStock },
    { key: 'success', label: 'Total value', value: `$${analytics.totalValue.toFixed(2)}` },
  ]

  return (
    <section className="dashboard">
      <h2>Kitchen Overview</h2>

      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className={`stat-card ${c.key}`}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>

      {(analytics.wasteForecast?.length ?? 0) > 0 && (
        <div className="waste-forecast">
          <h3>Expiry forecast</h3>
          <div className="forecast-grid">
            {analytics.wasteForecast?.map((b) => (
              <div key={b.bucket} className="forecast-cell">
                <div className="bucket">{b.bucket}</div>
                <div className="amount">
                  {b.items} item{b.items !== 1 ? 's' : ''}
                </div>
                {b.value > 0 && <div className="value">${b.value.toFixed(2)}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics.byCategory.length > 0 && (
        <div className="category-breakdown">
          <h3>Items by category</h3>
          <div className="category-bars">
            {analytics.byCategory.map((cat) => (
              <div key={cat._id} className="category-bar-item">
                <div className="category-info">
                  <span className="category-name">{cat._id}</span>
                  <span className="category-count">{cat.count}</span>
                </div>
                <div className="category-bar-bg">
                  <div
                    className="category-bar-fill"
                    style={{
                      width: `${analytics.total ? (cat.count / analytics.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics.expired > 0 && (
        <div className="alert-box danger">
          <strong>{analytics.expired} expired.</strong>
          <span>Consider removing them.</span>
        </div>
      )}
    </section>
  )
}
