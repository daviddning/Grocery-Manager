const BASE_URL = 'http://localhost:3001/api'

export interface Grocery {
  id?: number
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

export async function deleteGrocery(id: number) {
  await fetch(`${BASE_URL}/groceries/${id}`, {
    method: 'DELETE',
  })
}

export async function updateGrocery(
  id: number,
  data: Partial<Omit<Grocery, 'id'>>
): Promise<Grocery> {
  const res = await fetch(`${BASE_URL}/groceries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
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