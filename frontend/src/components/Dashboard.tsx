import { useEffect, useState } from 'react'
import { getAnalytics, type Analytics } from '../api'
import './Dashboard.css'

export function Dashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const data = await getAnalytics()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="dashboard loading">Loading analytics...</div>
  }

  if (!analytics) {
    return <div className="dashboard error">Failed to load analytics</div>
  }

  return (
    <div className="dashboard">
      <h2>Kitchen Overview</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{analytics.total}</div>
            <div className="stat-label">Total Items</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-value">{analytics.expiringSoon}</div>
            <div className="stat-label">Expiring Soon</div>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-value">{analytics.expired}</div>
            <div className="stat-label">Expired</div>
          </div>
        </div>

        <div className="stat-card alert">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{analytics.lowStock}</div>
            <div className="stat-label">Low Stock</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">${analytics.totalValue.toFixed(2)}</div>
            <div className="stat-label">Total Value</div>
          </div>
        </div>
      </div>

      {analytics.byCategory.length > 0 && (
        <div className="category-breakdown">
          <h3>Items by Category</h3>
          <div className="category-bars">
            {analytics.byCategory.map(cat => {
              const percentage = (cat.count / analytics.total) * 100
              return (
                <div key={cat._id} className="category-bar-item">
                  <div className="category-info">
                    <span className="category-name">{cat._id}</span>
                    <span className="category-count">{cat.count}</span>
                  </div>
                  <div className="category-bar-bg">
                    <div
                      className="category-bar-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {analytics.expiringSoon > 0 && (
        <div className="alert-box warning">
          <strong>⏰ Attention!</strong> You have {analytics.expiringSoon} item
          {analytics.expiringSoon !== 1 ? 's' : ''} expiring within 3 days.
        </div>
      )}

      {analytics.expired > 0 && (
        <div className="alert-box danger">
          <strong>❌ Notice!</strong> You have {analytics.expired} expired item
          {analytics.expired !== 1 ? 's' : ''}. Consider removing them.
        </div>
      )}

      {analytics.lowStock > 0 && (
        <div className="alert-box alert">
          <strong>⚠️ Low Stock!</strong> {analytics.lowStock} item
          {analytics.lowStock !== 1 ? 's are' : ' is'} running low.
        </div>
      )}
    </div>
  )
}