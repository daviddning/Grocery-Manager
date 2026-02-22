import { useEffect, useState } from 'react'
import type { Grocery } from './api'
import {
  getExpiredGroceries,
  getExpiringGroceries,
  getFreshGroceries,
  deleteGrocery,
} from './api'
import { GroceryList } from './components/GroceryList'
import { AddGroceryForm } from './components/AddGroceryForm'

function App() {
  const [expiringSoon, setExpiringSoon] = useState<Grocery[]>([])
  const [expired, setExpired] = useState<Grocery[]>([])
  const [fresh, setFresh] = useState<Grocery[]>([])

  const refreshData = async () => {
    const [expiredItems, expiringItems, freshItems] =
      await Promise.all([
        getExpiredGroceries(),
        getExpiringGroceries(3),
        getFreshGroceries(),
      ])

    setExpired(expiredItems)
    setExpiringSoon(expiringItems)
    setFresh(freshItems)
  }

  useEffect(() => {
    refreshData()
  }, [])

  const handleDelete = async (id: number) => {
    await deleteGrocery(id)
    await refreshData()
  }

  const handleUpdate = async () => {
    await refreshData()
  }

  return (
    <div>
      <h1>KitchenHub</h1>

      <p>
        <strong>{fresh.length}</strong> fresh •{' '}
        <strong>{expired.length}</strong> expired •{' '}
        <strong>{expiringSoon.length}</strong> expiring in 3 days
      </p>

      <AddGroceryForm onAdd={refreshData} />

      <h2>🔴 Expired</h2>
      {expired.length === 0 ? (
        <p>No expired items 🎉</p>
      ) : (
        <GroceryList
          groceries={expired}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}

      <h2>🟡 Expiring Soon</h2>
      {expiringSoon.length === 0 ? (
        <p>No items expiring soon 🎉</p>
      ) : (
        <GroceryList
          groceries={expiringSoon}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}

      <h2>🟢 Fresh</h2>
      {fresh.length === 0 ? (
        <p>No fresh items</p>
      ) : (
        <GroceryList
          groceries={fresh}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}

export default App