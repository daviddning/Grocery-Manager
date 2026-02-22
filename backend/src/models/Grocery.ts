import mongoose from 'mongoose'

const GrocerySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
)

GrocerySchema.index({ name: 1, expiresAt: 1 })

export default mongoose.model('Grocery', GrocerySchema)