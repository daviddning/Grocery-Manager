import { useState } from 'react'
import { addGrocery, type Category, type Unit } from '../api'
import './AddGroceryForm.css'

interface Props {
  onAdd: () => void | Promise<void>
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

export function AddGroceryForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState<Unit>('count')
  const [expiresAt, setExpiresAt] = useState('')
  const [category, setCategory] = useState<Category>('Other')
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [price, setPrice] = useState('')
  const [store, setStore] = useState('')
  const [notes, setNotes] = useState('')
  const [lowStockThreshold, setLowStockThreshold] = useState(1)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !expiresAt) return

    await addGrocery({
      name,
      quantity,
      unit,
      expiresAt,
      category,
      purchaseDate,
      price: price ? parseFloat(price) : undefined,
      store: store || undefined,
      notes: notes || undefined,
      lowStockThreshold,
    })

    await onAdd()

    // Reset form
    setName('')
    setQuantity(1)
    setUnit('count')
    setExpiresAt('')
    setCategory('Other')
    setPurchaseDate(new Date().toISOString().split('T')[0])
    setPrice('')
    setStore('')
    setNotes('')
    setLowStockThreshold(1)
    setShowAdvanced(false)
  }

  return (
    <form onSubmit={handleSubmit} className="add-grocery-form">
      <h2>Add New Grocery Item</h2>
      
      <div className="form-section">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Item Name *</label>
            <input
              id="name"
              type="text"
              placeholder="e.g., Milk, Apples, Chicken"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity">Quantity *</label>
            <input
              id="quantity"
              type="number"
              min={0.01}
              step={0.01}
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="unit">Unit *</label>
            <select
              id="unit"
              value={unit}
              onChange={e => setUnit(e.target.value as Unit)}
            >
              {UNITS.map(u => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="expiresAt">Expiration Date *</label>
            <input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        className="toggle-advanced"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? '− Hide' : '+ Show'} Advanced Options
      </button>

      {showAdvanced && (
        <div className="form-section advanced">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="purchaseDate">Purchase Date</label>
              <input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Price ($)</label>
              <input
                id="price"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={price}
                onChange={e => setPrice(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="store">Store/Source</label>
              <input
                id="store"
                type="text"
                placeholder="e.g., Walmart, Costco"
                value={store}
                onChange={e => setStore(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lowStockThreshold">Low Stock Alert Threshold</label>
              <input
                id="lowStockThreshold"
                type="number"
                min={0}
                value={lowStockThreshold}
                onChange={e => setLowStockThreshold(Number(e.target.value))}
              />
              <small>Alert when quantity falls below this number</small>
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      )}

      <button type="submit" className="submit-btn">
        Add Grocery Item
      </button>
    </form>
  )
}