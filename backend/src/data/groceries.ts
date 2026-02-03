// src/data/groceries.ts

export interface Grocery {
  id: number
  name: string
  quantity: number
  expiresAt: string
  createdAt: string
}

let groceries: Grocery[] = []

// Read all groceries
export function getAllGroceries() {
  return groceries
}

// Add a new grocery
export function addGrocery(item: Omit<Grocery, 'id' | 'createdAt'>) {
  const newItem: Grocery = {
    id: groceries.length + 1,
    createdAt: new Date().toISOString(),
    ...item
  }
  groceries.push(newItem)
  return newItem
}

// Update a grocery by ID
export function updateGrocery(id: number, newData: Partial<Omit<Grocery, 'id' | 'createdAt'>>) {
  const grocery = groceries.find(g => g.id === id)
  if (!grocery) return null
  Object.assign(grocery, newData)
  return grocery
}

// Delete a grocery by ID
export function deleteGrocery(id: number) {
  const index = groceries.findIndex(g => g.id === id)
  if (index === -1) return false
  groceries.splice(index, 1)
  return true
}
