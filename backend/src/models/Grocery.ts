import mongoose from 'mongoose'

export const CATEGORIES = [
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
] as const

export const UNITS = [
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
] as const

const GrocerySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: {
      type: String,
      enum: UNITS,
      default: 'count'
    },
    expiresAt: { type: Date, required: true },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'Other'
    },
    purchaseDate: {
      type: Date,
      default: () => new Date()
    },
    price: {
      type: Number,
      min: 0
    },
    store: { type: String },
    barcode: { type: String },
    imageUrl: { type: String },
    notes: { type: String },
    lowStockThreshold: {
      type: Number,
      default: 1
    },
  },
  { timestamps: true }
)

// Indexes for performance
GrocerySchema.index({ name: 1, expiresAt: 1 })
GrocerySchema.index({ category: 1 })
GrocerySchema.index({ expiresAt: 1 })

// Virtual field for days until expiration
GrocerySchema.virtual('daysUntilExpiration').get(function () {
  const now = new Date()
  const expires = new Date(this.expiresAt)
  const diffTime = expires.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

// Virtual field for expiration status
GrocerySchema.virtual('expirationStatus').get(function () {
  const days = this.daysUntilExpiration
  if (days < 0) return 'expired'
  if (days <= 3) return 'expiring-soon'
  if (days <= 7) return 'expiring-this-week'
  return 'fresh'
})

// Virtual field for low stock status
GrocerySchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.lowStockThreshold
})

// Ensure virtuals are included in JSON
GrocerySchema.set('toJSON', { virtuals: true })
GrocerySchema.set('toObject', { virtuals: true })

export default mongoose.model('Grocery', GrocerySchema)