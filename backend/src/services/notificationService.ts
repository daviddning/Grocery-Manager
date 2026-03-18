import Grocery from '../models/Grocery'

export interface Notification {
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

/**
 * Get all notifications for expiring items and low stock
 */
export async function getNotifications(): Promise<Notification[]> {
    const notifications: Notification[] = []
    const now = new Date()

    // Get expiring soon items (within 3 days)
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(now.getDate() + 3)

    const expiringSoon = await Grocery.find({
        expiresAt: { $gte: now, $lte: threeDaysFromNow },
    })

    expiringSoon.forEach(item => {
        const days = item.daysUntilExpiration || 0
        notifications.push({
            type: 'expiring-soon',
            item: {
                id: item._id!.toString(),
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                expiresAt: item.expiresAt.toISOString(),
                daysUntilExpiration: days,
            },
            message: `${item.name} expires in ${days} day${days !== 1 ? 's' : ''}`,
            priority: days <= 1 ? 'high' : 'medium',
        })
    })

    // Get expired items
    const expired = await Grocery.find({
        expiresAt: { $lt: now },
    })

    expired.forEach(item => {
        const days = Math.abs(item.daysUntilExpiration || 0)
        notifications.push({
            type: 'expired',
            item: {
                id: item._id!.toString(),
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                expiresAt: item.expiresAt.toISOString(),
                daysUntilExpiration: item.daysUntilExpiration,
            },
            message: `${item.name} expired ${days} day${days !== 1 ? 's' : ''} ago`,
            priority: 'high',
        })
    })

    // Get low stock items
    const allItems = await Grocery.find()
    const lowStockItems = allItems.filter(item => item.quantity <= item.lowStockThreshold)

    lowStockItems.forEach(item => {
        notifications.push({
            type: 'low-stock',
            item: {
                id: item._id!.toString(),
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
            },
            message: `${item.name} is low on stock (${item.quantity} ${item.unit} remaining)`,
            priority: item.quantity === 0 ? 'high' : 'medium',
        })
    })

    // Sort by priority (high first)
    notifications.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    return notifications
}

/**
 * Check for notifications that should trigger alerts
 * This would be called by a scheduled job (cron) in production
 */
export async function checkAndSendNotifications(): Promise<void> {
    const notifications = await getNotifications()

    // For now just log them
    if (notifications.length > 0) {
        console.log(`\n🔔 ${notifications.length} notifications:`)
        notifications.forEach(notif => {
            console.log(`   [${notif.priority.toUpperCase()}] ${notif.message}`)
        })
    }
}