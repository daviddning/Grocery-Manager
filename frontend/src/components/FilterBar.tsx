import { useState } from 'react'
import type { ExpirationStatus, FilterParams } from '../api'
import './FilterBar.css'

type StatusValue = ExpirationStatus | 'low-stock' | 'all'

interface FilterBarProps {
  onFilterChange: (filters: FilterParams) => void
  expiringSoonCount: number
  expiredCount: number
  lowStockCount: number
}

const CATEGORIES = [
  'all',
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

const STATUS_FILTERS: Array<{ value: StatusValue; label: string }> = [
  { value: 'all', label: 'All Items' },
  { value: 'fresh', label: 'Fresh' },
  { value: 'expiring-this-week', label: 'This Week' },
  { value: 'expiring-soon', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
  { value: 'low-stock', label: 'Low Stock' },
]

const SORT_OPTIONS = [
  { value: 'expiresAt', label: 'Expiration Date' },
  { value: 'name', label: 'Name' },
  { value: 'category', label: 'Category' },
  { value: 'purchaseDate', label: 'Purchase Date' },
] as const

const QUICK_FILTERS: Array<{
  key: string
  label: string
  status: StatusValue
}> = [
  { key: 'expiring-soon', label: 'Expiring Soon', status: 'expiring-soon' },
  { key: 'expired', label: 'Expired', status: 'expired' },
  { key: 'low-stock', label: 'Low Stock', status: 'low-stock' },
]

export function FilterBar({
  onFilterChange,
  expiringSoonCount,
  expiredCount,
  lowStockCount,
}: FilterBarProps) {
  const [filters, setFilters] = useState<Required<FilterParams>>({
    category: 'all',
    status: 'all',
    search: '',
    sortBy: 'expiresAt',
  })

  const update = (patch: Partial<FilterParams>) => {
    const next = { ...filters, ...patch } as Required<FilterParams>
    setFilters(next)
    onFilterChange(next)
  }

  const counts: Record<string, number> = {
    'expiring-soon': expiringSoonCount,
    expired: expiredCount,
    'low-stock': lowStockCount,
  }

  return (
    <div className="filter-bar">
      <div className="filter-controls">
        <div className="filter-group filter-search">
          <label htmlFor="filter-search">Search</label>
          <input
            id="filter-search"
            type="text"
            placeholder="Search items…"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-category">Category</label>
          <select
            id="filter-category"
            value={filters.category}
            onChange={(e) => update({ category: e.target.value })}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-status">Status</label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => update({ status: e.target.value as StatusValue })}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-sort">Sort by</label>
          <select
            id="filter-sort"
            value={filters.sortBy}
            onChange={(e) =>
              update({
                sortBy: e.target.value as Required<FilterParams>['sortBy'],
              })
            }
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="quick-filters">
        {QUICK_FILTERS.map((q) => (
          <button
            key={q.key}
            type="button"
            className={`quick-filter-btn ${q.key} ${
              filters.status === q.status ? 'active' : ''
            }`}
            aria-pressed={filters.status === q.status}
            onClick={() =>
              update({ status: filters.status === q.status ? 'all' : q.status })
            }
          >
            {q.label}
            <span className="badge">{counts[q.key]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
