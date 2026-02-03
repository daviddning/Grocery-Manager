import React, { useState } from 'react'
import type { Grocery } from '../api'
import { addGrocery } from '../api'

interface Props {
  onAdd: (g: Grocery) => void
}

export const AddGroceryForm: React.FC<Props> = ({ onAdd }) => {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [expiresAt, setExpiresAt] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !expiresAt) return
    const newGrocery = await addGrocery({ name, quantity, expiresAt })
    onAdd(newGrocery)
    setName('')
    setQuantity(1)
    setExpiresAt('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        type="number"
        min={1}
        placeholder="Quantity"
        value={quantity}
        onChange={e => setQuantity(Number(e.target.value))}
      />
      <input
        type="date"
        value={expiresAt}
        onChange={e => setExpiresAt(e.target.value)}
      />
      <button type="submit">Add Grocery</button>
    </form>
  )
}
