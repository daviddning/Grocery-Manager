const API_URL = 'http://localhost:3001/api/groceries'

export type Category = 
  | 'Produce'
  | 'Dairy'
  | 'Meat'
  | 'Seafood'
  | 'Bakery'
  | 'Pantry'
  | 'Frozen'
  | 'Beverages'
  | 'Snacks'
  | 'Other'

export type Unit = 
  | 'count'
  | 'lbs'
  | 'kg'
  | 'g'
  | 'oz'
  | 'ml'
  | 'l'
  | 'gal'
  | 'cups'
  | 'tbsp'
  | 'tsp'

export type ExpirationStatus = 
  | 'expired'
  | 'expiring-soon'
  | 'expiring-this-week'
  | 'fresh'

export interface Grocery {
  _id?: string
  name: string
  quantity: number
  unit: Unit
  expiresAt: string
  category: Category
  purchaseDate?: string
  price?: number
  store?: string
  barcode?: string
  imageUrl?: string
  notes?: string
  lowStockThreshold: number
  daysUntilExpiration?: number
  expirationStatus?: ExpirationStatus
  isLowStock?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface GroceryInput {
  name: string
  quantity: number
  unit?: Unit
  expiresAt: string
  category?: Category
  purchaseDate?: string
  price?: number
  store?: string
  barcode?: string
  imageUrl?: string
  notes?: string
  lowStockThreshold?: number
}

export interface FilterParams {
  category?: string
  status?: ExpirationStatus | 'all'
  search?: string
  sortBy?: 'expiresAt' | 'name' | 'category' | 'purchaseDate'
}

export interface Analytics {
  total: number
  expired: number
  expiringSoon: number
  lowStock: number
  byCategory: Array<{ _id: string; count: number }>
  totalValue: number
}

// Fetch groceries with optional filters
export async function getGroceries(filters?: FilterParams): Promise<Grocery[]> {
  const params = new URLSearchParams()
  
  if (filters?.category) params.append('category', filters.category)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.search) params.append('search', filters.search)
  if (filters?.sortBy) params.append('sortBy', filters.sortBy)
  
  const url = params.toString() ? `${API_URL}?${params}` : API_URL
  const res = await fetch(url)
  return res.json()
}

// Get expiring groceries
export async function getExpiringGroceries(days = 3): Promise<Grocery[]> {
  const res = await fetch(`${API_URL}/expiring?days=${days}`)
  return res.json()
}

// Get expired groceries
export async function getExpiredGroceries(): Promise<Grocery[]> {
  const res = await fetch(`${API_URL}/expired`)
  return res.json()
}

// Get fresh groceries
export async function getFreshGroceries(): Promise<Grocery[]> {
  const res = await fetch(`${API_URL}/fresh`)
  return res.json()
}

// Get low stock items
export async function getLowStockGroceries(): Promise<Grocery[]> {
  const res = await fetch(`${API_URL}/low-stock`)
  return res.json()
}

// Get analytics
export async function getAnalytics(): Promise<Analytics> {
  const res = await fetch(`${API_URL}/analytics`)
  return res.json()
}

// Add a new grocery
export async function addGrocery(grocery: GroceryInput): Promise<Grocery> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(grocery),
  })
  return res.json()
}

// Update a grocery
export async function updateGrocery(
  id: string,
  updates: Partial<GroceryInput>
): Promise<Grocery> {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  return res.json()
}

// Delete a grocery
export async function deleteGrocery(id: string): Promise<void> {
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' })
}

// Bulk delete expired items
export async function deleteExpiredGroceries(): Promise<{ deletedCount: number }> {
  const res = await fetch(`${API_URL}/expired/bulk`, { method: 'DELETE' })
  return res.json()
}