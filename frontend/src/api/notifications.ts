export type NotificationType = 'expiring-soon' | 'expired' | 'low-stock'
export type NotificationPriority = 'high' | 'medium' | 'low'

export interface Notification {
  type: NotificationType
  item: {
    id: string
    name: string
    quantity: number
    unit: string
    expiresAt?: string
    daysUntilExpiration?: number
  }
  message: string
  priority: NotificationPriority
}

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/groceries$/, '') ??
  'http://localhost:3001/api'

export async function getNotifications(): Promise<Notification[]> {
  const res = await fetch(`${API_BASE}/notifications`)
  return res.json()
}

export async function getNotificationCount(): Promise<{
  total: number
  high: number
  medium: number
  low: number
}> {
  const res = await fetch(`${API_BASE}/notifications/count`)
  return res.json()
}
