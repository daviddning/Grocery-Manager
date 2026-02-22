import { useState } from 'react'
import type { Grocery } from '../api'
import { updateGrocery } from '../api'

interface GroceryListProps {
  groceries: Grocery[]
  onDelete: (id: string) => void | Promise<void>
  onUpdate: () => void | Promise<void>
}

export function GroceryList({
  groceries,
  onDelete,
  onUpdate,
}: GroceryListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState(0)
  const [editExpiresAt, setEditExpiresAt] = useState('')

  const startEdit = (g: Grocery) => {
    setEditingId(g._id!)
    setEditQuantity(g.quantity)
    setEditExpiresAt(g.expiresAt.slice(0, 10)) // format for <input type="date" />
  }

  const saveEdit = async (id: string) => {
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
        <li key={g._id}>
          {editingId === g._id ? (
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
              <button onClick={() => saveEdit(g._id!)}>
                Save
              </button>
              <button onClick={() => setEditingId(null)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              {g.name} — {g.quantity} —{' '}
              {new Date(g.expiresAt).toLocaleDateString()}{' '}
              <button onClick={() => startEdit(g)}>
                Edit
              </button>
              <button onClick={() => onDelete(g._id!)}>
                Delete
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}