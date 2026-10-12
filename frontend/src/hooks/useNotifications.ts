import { useEffect, useState } from 'react'
import { getNotifications, type Notification } from '../api/notifications'

const POLL_INTERVAL_MS = 5 * 60 * 1000

/**
 * Subscribes to the notifications endpoint and re-polls on an interval.
 * Kept out of the component so the view stays presentational.
 */
export function useNotifications(pollMs = POLL_INTERVAL_MS) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await getNotifications()
        if (!cancelled) setNotifications(data)
      } catch (err) {
        console.error('Failed to load notifications:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    const id = setInterval(load, pollMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [pollMs])

  return {
    notifications,
    loading,
    highPriorityCount: notifications.filter((n) => n.priority === 'high').length,
  }
}
