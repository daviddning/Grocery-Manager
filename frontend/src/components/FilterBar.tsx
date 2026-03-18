import type { Category, ExpirationStatus } from '../api'
import './FilterBar.css'

interface FilterBarProps {
  onFilterChange: (filters: {
    category: string
    status: ExpirationStatus | 'all'
    search: string
    sortBy: 'expiresAt' | 'name' | 'category' | 'purchaseDate'
  }) => void
  expiringSoonCount: number
  expiredCount: number
  lowStockCount: number
}

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Categories' },
  { value: 'Produce', label: 'Produce' },
  { value: 'Dairy', label: 'Dairy' },
  { value: 'Meat', label: 'Meat' },
  { value: 'Seafood', label: 'Seafood' },
  { value: 'Bakery', label: 'Bakery' },
  { value: 'Pantry', label: 'Pantry' },
  { value: 'Frozen', label: 'Frozen' },
  { value: 'Beverages', label: 'Beverages' },
  { value: 'Snacks', label: 'Snacks' },
  { value: 'Other', label: 'Other' },
]

const STATUS_FILTERS: Array<{ value: ExpirationStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Items' },
  { value: 'fresh', label: 'Fresh' },
  { value: 'expiring-this-week', label: 'This Week' },
  { value: 'expiring-soon', label: 'Expiring Soon' },
  { value: 'expired', label: 'Expired' },
]

const SORT_OPTIONS = [
  { value: 'expiresAt', label: 'Expiration Date' },
  { value: 'name', label: 'Name' },
  { value: 'category', label: 'Category' },
  { value: 'purchaseDate', label: 'Purchase Date' },
]

export function FilterBar({
  onFilterChange,
  expiringSoonCount,
  expiredCount,
  lowStockCount,
}: FilterBarProps) {
  const handleChange = (key: string, value: string) => {
    const currentFilters = {
      category: (document.getElementById('filter-category') as HTMLSelectElement)
        ?.value || 'all',
      status: ((document.getElementById('filter-status') as HTMLSelectElement)
        ?.value || 'all') as ExpirationStatus | 'all',
      search: (document.getElementById('filter-search') as HTMLInputElement)
        ?.value || '',
      sortBy: ((document.getElementById('filter-sort') as HTMLSelectElement)
        ?.value || 'expiresAt') as 'expiresAt' | 'name' | 'category' | 'purchaseDate',
    }

    onFilterChange({ ...currentFilters, [key]: value })
  }

  return (
    <div className="filter-bar">
      <div className="filter-section">
        <h3>Filter & Search</h3>

        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="filter-search">Search</label>
            <input
              id="filter-search"
              type="text"
              placeholder="Search items..."
              onChange={e => handleChange('search', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="filter-category">Category</label>
            <select
              id="filter-category"
              onChange={e => handleChange('category', e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-status">Status</label>
            <select
              id="filter-status"
              onChange={e => handleChange('status', e.target.value)}
            >
              {STATUS_FILTERS.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-sort">Sort By</label>
            <select
              id="filter-sort"
              onChange={e => handleChange('sortBy', e.target.value)}
            >
              {SORT_OPTIONS.map(sort => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="quick-filters">
        <h4>Quick Filters</h4>
        <div className="quick-filter-buttons">
          <button
            className="quick-filter-btn expiring-soon"
            onClick={() => {
              const select = document.getElementById(
                'filter-status'
              ) as HTMLSelectElement
              select.value = 'expiring-soon'
              handleChange('status', 'expiring-soon')
            }}
          >
            <span className="badge">{expiringSoonCount}</span>
            Expiring Soon
          </button>

          <button
            className="quick-filter-btn expired"
            onClick={() => {
              const select = document.getElementById(
                'filter-status'
              ) as HTMLSelectElement
              select.value = 'expired'
              handleChange('status', 'expired')
            }}
          >
            <span className="badge">{expiredCount}</span>
            Expired
          </button>

          <button
            className="quick-filter-btn low-stock"
            onClick={() => {
              // For low stock, we need to fetch separately
              alert('Low stock filtering coming soon!')
            }}
          >
            <span className="badge">{lowStockCount}</span>
            Low Stock
          </button>
        </div>
      </div>
    </div>
  )
}