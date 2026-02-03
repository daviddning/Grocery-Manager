import React from 'react'
import type { Grocery } from '../api'

interface Props {
  groceries: Grocery[]
  onDelete: (id: number) => void
}

export const GroceryList: React.FC<Props> = ({ groceries, onDelete }) => {
  return (
    <ul>
      {groceries.map(g => (
        <li key={g.id}>
          {g.name} - {g.quantity} - expires {g.expiresAt}
          <button onClick={() => g.id && onDelete(g.id)}>Delete</button>
        </li>
      ))}
    </ul>
  )
}
