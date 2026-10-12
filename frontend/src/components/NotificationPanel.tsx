import { useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import type { Notification } from '../api/notifications'
import './NotificationPanel.css'

function getIcon(type: Notification['type']): string {
  switch (type) {
    case 'expiring-soon':
      return '⏰'
    case 'expired':
      return '❌'
    case 'low-stock':
      return '⚠️'
  }
}

export function NotificationPanel() {
  const { notifications, loading, highPriorityCount } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="notification-container">
      <button
        className={`notification-bell ${highPriorityCount > 0 ? 'has-alerts' : ''}`}
        onClick={() => setIsOpen((o) => !o)}
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
                  key={`${notif.item.id}-${notif.type}-${index}`}
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
