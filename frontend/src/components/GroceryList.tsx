import { useState } from 'react'
import type { Grocery, Category, Unit, ExpirationStatus } from '../api'
import { updateGrocery } from '../api'
import './GroceryList.css'

interface GroceryListProps {
  groceries: Grocery[]
  onDelete: (id: string) => void | Promise<void>
  onUpdate: () => void | Promise<void>
}

const CATEGORIES: Category[] = [
  'Produce',
  'Dairy',
  'Meat',
  'Seafood',
  'Bakery',
  'Pantry',
  'Frozen',
  'Beverages',
  'Snacks',
  'Other',
]

const UNITS: Unit[] = [
  'count',
  'lbs',
  'kg',
  'g',
  'oz',
  'ml',
  'l',
  'gal',
  'cups',
  'tbsp',
  'tsp',
]

export function GroceryList({
  groceries,
  onDelete,
  onUpdate,
}: GroceryListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Grocery>>({})

  const startEdit = (g: Grocery) => {
    setEditingId(g._id!)
    setEditForm({
      name: g.name,
      quantity: g.quantity,
      unit: g.unit,
      expiresAt: g.expiresAt.split('T')[0],
      category: g.category,
      price: g.price,
      store: g.store,
      notes: g.notes,
      lowStockThreshold: g.lowStockThreshold,
    })
  }

  const saveEdit = async (id: string) => {
    await updateGrocery(id, editForm)
    await onUpdate()
    setEditingId(null)
    setEditForm({})
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const getStatusClass = (status?: ExpirationStatus) => {
    switch (status) {
      case 'expired':
        return 'status-expired'
      case 'expiring-soon':
        return 'status-expiring-soon'
      case 'expiring-this-week':
        return 'status-expiring-week'
      case 'fresh':
        return 'status-fresh'
      default:
        return ''
    }
  }

  const getStatusLabel = (days?: number) => {
    if (days === undefined) return ''
    if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`
    if (days === 0) return 'Expires today!'
    if (days === 1) return 'Expires tomorrow'
    return `${days} days left`
  }

  if (groceries.length === 0) {
    return (
      <div className="empty-state">
        <p>No groceries found. Add some items to get started!</p>
      </div>
    )
  }

  return (
    <div className="grocery-list">
      {groceries.map(g => (
        <div
          key={g._id}
          className={`grocery-item ${getStatusClass(g.expirationStatus)} ${g.isLowStock ? 'low-stock' : ''
            }`}
        >
          {editingId === g._id ? (
            // Edit Mode
            <div className="edit-mode">
              <div className="edit-row">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="Name"
                />
                <select
                  value={editForm.category}
                  onChange={e =>
                    setEditForm({
                      ...editForm,
                      category: e.target.value as Category,
                    })
                  }
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="edit-row">
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={editForm.quantity}
                  onChange={e =>
                    setEditForm({
                      ...editForm,
                      quantity: Number(e.target.value),
                    })
                  }
                />
                <select
                  value={editForm.unit}
                  onChange={e =>
                    setEditForm({
                      ...editForm,
                      unit: e.target.value as Unit,
                    })
                  }
                >
                  {UNITS.map(u => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={editForm.expiresAt}
                  onChange={e =>
                    setEditForm({ ...editForm, expiresAt: e.target.value })
                  }
                />
              </div>

              <div className="edit-row">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Price"
                  value={editForm.price || ''}
                  onChange={e =>
                    setEditForm({
                      ...editForm,
                      price: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Store"
                  value={editForm.store || ''}
                  onChange={e =>
                    setEditForm({ ...editForm, store: e.target.value })
                  }
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Low stock threshold"
                  value={editForm.lowStockThreshold}
                  onChange={e =>
                    setEditForm({
                      ...editForm,
                      lowStockThreshold: Number(e.target.value),
                    })
                  }
                />
              </div>

              <textarea
                placeholder="Notes"
                value={editForm.notes || ''}
                onChange={e =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
                rows={2}
              />

              <div className="edit-actions">
                <button onClick={() => saveEdit(g._id!)} className="btn-save">
                  Save
                </button>
                <button onClick={cancelEdit} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // Display Mode
            <div className="display-mode">
              <div className="item-header">
                <h3 className="item-name">{g.name}</h3>
                <span className={`category-badge ${g.category.toLowerCase()}`}>
                  {g.category}
                </span>
                {g.isLowStock && (
                  <span className="low-stock-badge">⚠️ Low Stock</span>
                )}
              </div>

              <div className="item-details">
                <div className="detail-group">
                  <span className="label">Quantity:</span>
                  <span className="value">
                    {g.quantity} {g.unit}
                  </span>
                </div>

                <div className="detail-group">
                  <span className="label">Expires:</span>
                  <span className="value">
                    {new Date(g.expiresAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="detail-group">
                  <span className={`expiration-status ${getStatusClass(g.expirationStatus)}`}>
                    {getStatusLabel(g.daysUntilExpiration)}
                  </span>
                </div>
              </div>

              {(g.price || g.store || g.notes) && (
                <div className="item-extras">
                  {g.price && (
                    <div className="extra-detail">
                      <span className="label">Price:</span>
                      <span className="value">${g.price.toFixed(2)}</span>
                    </div>
                  )}
                  {g.store && (
                    <div className="extra-detail">
                      <span className="label">Store:</span>
                      <span className="value">{g.store}</span>
                    </div>
                  )}
                  {g.notes && (
                    <div className="extra-detail notes">
                      <span className="label">Notes:</span>
                      <span className="value">{g.notes}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="item-actions">
                <button onClick={() => startEdit(g)} className="btn-edit">
                  Edit
                </button>
                <button onClick={() => onDelete(g._id!)} className="btn-delete">
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}