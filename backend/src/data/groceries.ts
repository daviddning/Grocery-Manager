export type Grocery = {
  id: number
  name: string
  quantity: number
  expiresAt: string
  createdAt: string
}

let groceries: Grocery[] = []
let nextId = 1

export function getAllGroceries() {
  return groceries
}

export function addGrocery(data: Omit<Grocery, 'id' | 'createdAt'>) {
  const grocery: Grocery = {
    id: nextId++,
    createdAt: new Date().toISOString(),
    ...data,
  }

  groceries.push(grocery)
  return grocery
}

export function deleteGrocery(id: number) {
  const index = groceries.findIndex(g => g.id === id)
  if (index === -1) return false

  groceries.splice(index, 1)
  return true
}

export function updateGrocery(id: number, newData: Partial<{ name: string, quantity: number, expiresAt: string }>) {
  const grocery = groceries.find(g => g.id === id)
  if (!grocery) return null

  // update only provided fields
  if (newData.name !== undefined) grocery.name = newData.name
  if (newData.quantity !== undefined) grocery.quantity = newData.quantity
  if (newData.expiresAt !== undefined) grocery.expiresAt = newData.expiresAt

  return grocery
}