const BASE_URL = 'http://localhost:3001/api'

export interface Grocery {
  _id?: string
  name: string
  quantity: number
  expiresAt: string
}

export async function getGroceries(): Promise<Grocery[]> {
  const res = await fetch(`${BASE_URL}/groceries`)
  return res.json()
}

export async function getExpiringGroceries(days = 3): Promise<Grocery[]> {
  const res = await fetch(
    `${BASE_URL}/groceries/expiring?days=${days}`
  )
  return res.json()
}

export async function addGrocery(
  grocery: Grocery
): Promise<Grocery> {
  const res = await fetch(`${BASE_URL}/groceries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(grocery),
  })
  return res.json()
}

export async function deleteGrocery(id: string) {
  const res = await fetch(`${BASE_URL}/groceries/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    throw new Error('Failed to delete grocery')
  }
}

export async function updateGrocery(
  id: string,
  data: Partial<Omit<Grocery, '_id'>>
): Promise<Grocery> {
  const res = await fetch(`${BASE_URL}/groceries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    throw new Error('Failed to update grocery')
  }

  return res.json()
}

export async function getExpiredGroceries(): Promise<Grocery[]> {
  const res = await fetch(`${BASE_URL}/groceries/expired`)
  return res.json()
}

export async function getFreshGroceries(): Promise<Grocery[]> {
  const res = await fetch(`${BASE_URL}/groceries/fresh`)
  return res.json()
}