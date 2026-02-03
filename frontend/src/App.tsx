import React, { useEffect, useState } from 'react'
import type { Grocery } from './api'
import { getGroceries, deleteGrocery } from './api'
import { GroceryList } from './components/GroceryList'
import { AddGroceryForm } from './components/AddGroceryForm'

function App() {
  const [groceries, setGroceries] = useState<Grocery[]>([])

  const fetchGroceries = async () => {
    const data = await getGroceries()
    setGroceries(data)
  }

  useEffect(() => {
    fetchGroceries()
  }, [])

  const handleAdd = (grocery: Grocery) => {
    setGroceries(prev => [...prev, grocery])
  }

  const handleDelete = async (id: number) => {
    await deleteGrocery(id)
    setGroceries(prev => prev.filter(g => g.id !== id))
  }

  return (
    <div>
      <h1>KitchenHub</h1>
      <AddGroceryForm onAdd={handleAdd} />
      <GroceryList groceries={groceries} onDelete={handleDelete} />
    </div>
  )
}

export default App
