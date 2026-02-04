const BASE_URL = 'http://localhost:3001/api'

export interface Grocery {
  id?: number
  name: string
  quantity: number
  expiresAt: string
}

// Fetch all groceries
export async function getGroceries(): Promise<Grocery[]> {
  const res = await fetch(`${BASE_URL}/groceries`)
  return res.json()
}

// Add a new grocery
export async function addGrocery(grocery: Grocery): Promise<Grocery> {
  const res = await fetch(`${BASE_URL}/groceries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(grocery),
  })
  return res.json()
}

// Delete a grocery
export async function deleteGrocery(id: number) {
  await fetch(`${BASE_URL}/groceries/${id}`, { method: 'DELETE' })
}

// Update a grocery
export async function updateGrocery(
  id: number,
  data: Partial<Omit<Grocery, 'id' | 'name'>>
): Promise<Grocery> {
  const res = await fetch(`${BASE_URL}/groceries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}