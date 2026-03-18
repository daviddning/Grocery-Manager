import { useEffect, useState } from 'react'
import { AddGroceryForm } from './components/AddGroceryForm'
import { GroceryList } from './components/GroceryList'
import { Dashboard } from './components/Dashboard'
import { FilterBar } from './components/FilterBar'
import { NotificationPanel } from './components/NotificationPanel'
import {
  getGroceries,
  deleteGrocery,
  deleteExpiredGroceries,
  type Grocery,
  type FilterParams,
} from './api'
import './App.css'

function App() {
  const [groceries, setGroceries] = useState<Grocery[]>([])
  const [filters, setFilters] = useState<FilterParams>({
    category: 'all',
    status: 'all',
    search: '',
    sortBy: 'expiresAt',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGroceries()
  }, [filters])

  const loadGroceries = async () => {
    setLoading(true)
    try {
      const data = await getGroceries(filters)
      setGroceries(data)
    } catch (error) {
      console.error('Failed to load groceries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      await deleteGrocery(id)
      await loadGroceries()
    } catch (error) {
      console.error('Failed to delete grocery:', error)
      alert('Failed to delete item')
    }
  }

  const handleBulkDeleteExpired = async () => {
    const expiredCount = groceries.filter(g => g.expirationStatus === 'expired').length
    
    if (expiredCount === 0) {
      alert('No expired items to delete')
      return
    }

    if (
      !confirm(
        `Are you sure you want to delete all ${expiredCount} expired item${
          expiredCount !== 1 ? 's' : ''
        }?`
      )
    ) {
      return
    }

    try {
      await deleteExpiredGroceries()
      await loadGroceries()
      alert(`Deleted ${expiredCount} expired item${expiredCount !== 1 ? 's' : ''}`)
    } catch (error) {
      console.error('Failed to delete expired items:', error)
      alert('Failed to delete expired items')
    }
  }

  const expiringSoonCount = groceries.filter(
    g => g.expirationStatus === 'expiring-soon'
  ).length
  const expiredCount = groceries.filter(g => g.expirationStatus === 'expired').length
  const lowStockCount = groceries.filter(g => g.isLowStock).length

  return (
    <div className="app">
      <NotificationPanel />
      
      <header className="app-header">
        <h1>🥑 Grocery Manager</h1>
        <p className="app-subtitle">
          Track your groceries, prevent waste, and never let food expire again
        </p>
      </header>

      <main className="app-main">
        <Dashboard />

        <AddGroceryForm onAdd={loadGroceries} />

        <div className="grocery-section">
          <div className="section-header">
            <h2>Your Groceries ({groceries.length})</h2>
            {expiredCount > 0 && (
              <button className="bulk-delete-btn" onClick={handleBulkDeleteExpired}>
                🗑️ Delete All Expired ({expiredCount})
              </button>
            )}
          </div>

          <FilterBar
            onFilterChange={setFilters}
            expiringSoonCount={expiringSoonCount}
            expiredCount={expiredCount}
            lowStockCount={lowStockCount}
          />

          {loading ? (
            <div className="loading-state">Loading groceries...</div>
          ) : (
            <GroceryList
              groceries={groceries}
              onDelete={handleDelete}
              onUpdate={loadGroceries}
            />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>Made with ❤️ to reduce food waste</p>
      </footer>
    </div>
  )
}

export default App