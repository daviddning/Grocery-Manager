import React, { useEffect, useState } from 'react'
import type { Grocery } from './api'
import { getGroceries, deleteGrocery } from './api'
import { GroceryList } from './components/GroceryList'
import { AddGroceryForm } from './components/AddGroceryForm'

function App() {
  const [groceries, setGroceries] = useState<Grocery[]>([])

  // Fetch all groceries from backend
  const fetchGroceries = async () => {
    const data = await getGroceries()
    setGroceries(data)
  }

  useEffect(() => {
    fetchGroceries()
  }, [])

  // Handle adding a new grocery
  const handleAdd = (grocery: Grocery) => {
    setGroceries(prev => [...prev, grocery])
  }

  // Handle deleting a grocery
  const handleDelete = async (id: number) => {
    await deleteGrocery(id)
    setGroceries(prev => prev.filter(g => g.id !== id))
  }

  // Handle updating a grocery
  const handleUpdate = (updated: Grocery) => {
    setGroceries(prev =>
      prev.map(g => (g.id === updated.id ? updated : g))
    )
  }

  return (
    <div>
      <h1>KitchenHub</h1>
      <AddGroceryForm onAdd={handleAdd} />
      <GroceryList
        groceries={groceries}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    </div>
  )
}

export default App
