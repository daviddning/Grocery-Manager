import { useEffect, useState } from 'react'
import './NotificationPanel.css'

interface Notification {
  type: 'expiring-soon' | 'expired' | 'low-stock'
  item: {
    id: string
    name: string
    quantity: number
    unit: string
    expiresAt?: string
    daysUntilExpiration?: number
  }
  message: string
  priority: 'high' | 'medium' | 'low'
}

const API_URL = 'http://localhost:3001/api/notifications'

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
    // Poll for new notifications every 5 minutes
    const interval = setInterval(loadNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const res = await fetch(API_URL)
      const data = await res.json()
      setNotifications(data)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'expiring-soon':
        return '⏰'
      case 'expired':
        return '❌'
      case 'low-stock':
        return '⚠️'
    }
  }

  const highPriorityCount = notifications.filter(n => n.priority === 'high').length

  return (
    <div className="notification-container">
      <button
        className={`notification-bell ${highPriorityCount > 0 ? 'has-alerts' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        🔔
        {notifications.length > 0 && (
          <span className="notification-badge">{notifications.length}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <p>🎉 All good! No alerts at the moment.</p>
              </div>
            ) : (
              notifications.map((notif, index) => (
                <div
                  key={index}
                  className={`notification-item priority-${notif.priority} type-${notif.type}`}
                >
                  <div className="notification-icon">{getIcon(notif.type)}</div>
                  <div className="notification-content">
                    <div className="notification-message">{notif.message}</div>
                    <div className="notification-details">
                      {notif.item.quantity} {notif.item.unit}
                      {notif.item.expiresAt && (
                        <> • Expires {new Date(notif.item.expiresAt).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}