import { Router } from 'express'
import { getNotifications } from '../services/notificationService'

const router = Router()

// Get all current notifications
router.get('/', async (_req, res) => {
  try {
    const notifications = await getNotifications()
    res.json(notifications)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// Get notification count
router.get('/count', async (_req, res) => {
  try {
    const notifications = await getNotifications()
    res.json({
      total: notifications.length,
      high: notifications.filter(n => n.priority === 'high').length,
      medium: notifications.filter(n => n.priority === 'medium').length,
      low: notifications.filter(n => n.priority === 'low').length,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notification count' })
  }
})

export default router