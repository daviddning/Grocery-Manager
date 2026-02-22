import { useState } from 'react'
import type { Grocery } from '../api'
import { updateGrocery } from '../api'

interface GroceryListProps {
  groceries: Grocery[]
  onDelete: (id: number) => void | Promise<void>
  onUpdate: () => void | Promise<void>
}

export function GroceryList({
  groceries,
  onDelete,
  onUpdate,
}: GroceryListProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editQuantity, setEditQuantity] = useState(0)
  const [editExpiresAt, setEditExpiresAt] = useState('')

  const startEdit = (g: Grocery) => {
    setEditingId(g.id!)
    setEditQuantity(g.quantity)
    setEditExpiresAt(g.expiresAt)
  }

  const saveEdit = async (id: number) => {
    await updateGrocery(id, {
      quantity: editQuantity,
      expiresAt: editExpiresAt,
    })
    await onUpdate()
    setEditingId(null)
  }

  return (
    <ul>
      {groceries.map(g => (
        <li key={g.id}>
          {editingId === g.id ? (
            <>
              <input
                type="number"
                value={editQuantity}
                onChange={e =>
                  setEditQuantity(Number(e.target.value))
                }
              />
              <input
                type="date"
                value={editExpiresAt}
                onChange={e =>
                  setEditExpiresAt(e.target.value)
                }
              />
              <button onClick={() => saveEdit(g.id!)}>
                Save
              </button>
              <button onClick={() => setEditingId(null)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              {g.name} — {g.quantity} — {g.expiresAt}{' '}
              <button onClick={() => startEdit(g)}>
                Edit
              </button>
              <button onClick={() => onDelete(g.id!)}>
                Delete
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}