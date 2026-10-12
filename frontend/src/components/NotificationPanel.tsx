import { useEffect, useRef, useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import type { Notification } from '../api/notifications'
import './NotificationPanel.css'

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

const ICONS: Record<Notification['type'], string> = {
  'expiring-soon': '⏱',
  expired: '⚠',
  'low-stock': '↓',
}

export function NotificationPanel() {
  const { notifications, loading, highPriorityCount } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click or Escape — expected of a popover.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const count = notifications.length

  return (
    <div className="notification-container" ref={ref}>
      <button
        type="button"
        className={`notification-bell ${highPriorityCount > 0 ? 'has-alerts' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={
          count > 0 ? `Notifications, ${count} unread` : 'Notifications'
        }
        aria-expanded={open}
      >
        <BellIcon />
        {count > 0 && (
          <span className="notification-badge">{count > 99 ? '99+' : count}</span>
        )}
      </button>

      {open && (
        <div className="notification-panel" role="dialog" aria-label="Notifications">
          <div className="notification-header">
            <h3>Notifications</h3>
            <button
              type="button"
              className="close-btn"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
            >
              ✕
            </button>
          </div>

          <div className="notification-list">
            {loading ? (
              <p className="notification-empty">Loading…</p>
            ) : count === 0 ? (
              <p className="notification-empty">
                You're all caught up — nothing expiring or low.
              </p>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={`${n.item.id}-${n.type}-${i}`}
                  className={`notification-item priority-${n.priority}`}
                >
                  <span className="notification-icon" aria-hidden="true">
                    {ICONS[n.type]}
                  </span>
                  <div className="notification-content">
                    <p className="notification-message">{n.message}</p>
                    {n.item.expiresAt && (
                      <p className="notification-details">
                        Expires{' '}
                        {new Date(n.item.expiresAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
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
