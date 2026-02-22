import { useState } from 'react'
import { addGrocery } from '../api'

interface Props {
  onAdd: () => void | Promise<void>
}

export function AddGroceryForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [expiresAt, setExpiresAt] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !expiresAt) return

    await addGrocery({ name, quantity, expiresAt })
    await onAdd()

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
        value={quantity}
        onChange={e => setQuantity(Number(e.target.value))}
      />
      <input
        type="date"
        value={expiresAt}
        onChange={e => setExpiresAt(e.target.value)}
      />
      <button type="submit">Add</button>
    </form>
  )
}