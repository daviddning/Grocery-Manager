import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getGroceries,
  deleteGrocery,
  deleteExpiredGroceries,
  type Grocery,
  type FilterParams,
} from '../api'

const DEFAULT_FILTERS: FilterParams = {
  category: 'all',
  status: 'all',
  search: '',
  sortBy: 'expiresAt',
}

/**
 * Owns inventory state: fetching, filtering, deletes and the derived
 * counts the UI shows. Extracted from the component so the view stays
 * presentational and the logic is testable in isolation.
 */
export function useGroceries() {
  const [groceries, setGroceries] = useState<Grocery[]>([])
  const [filters, setFilters] = useState<FilterParams>(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setGroceries(await getGroceries(filters))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groceries')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void load()
  }, [load])

  const remove = useCallback(async (id: string) => {
    await deleteGrocery(id)
    setGroceries((prev) => prev.filter((g) => g._id !== id))
  }, [])

  const removeExpired = useCallback(async () => {
    const { deletedCount } = await deleteExpiredGroceries()
    await load()
    return deletedCount
  }, [load])

  const counts = useMemo(
    () => ({
      total: groceries.length,
      expiringSoon: groceries.filter((g) => g.expirationStatus === 'expiring-soon').length,
      expired: groceries.filter((g) => g.expirationStatus === 'expired').length,
      lowStock: groceries.filter((g) => g.isLowStock).length,
    }),
    [groceries],
  )

  return {
    groceries,
    filters,
    setFilters,
    loading,
    error,
    counts,
    reload: load,
    remove,
    removeExpired,
  }
}
