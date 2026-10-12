import { AddGroceryForm } from './components/AddGroceryForm'
import { GroceryList } from './components/GroceryList'
import { Dashboard } from './components/Dashboard'
import { FilterBar } from './components/FilterBar'
import { NotificationPanel } from './components/NotificationPanel'
import { useGroceries } from './hooks/useGroceries'
import './App.css'

function App() {
  const {
    groceries,
    setFilters,
    loading,
    error,
    counts,
    reload,
    remove,
    removeExpired,
  } = useGroceries()

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await remove(id)
    } catch {
      alert('Failed to delete item')
    }
  }

  const handleBulkDeleteExpired = async () => {
    if (counts.expired === 0) {
      alert('No expired items to delete')
      return
    }

    const label = `Delete all ${counts.expired} expired item${
      counts.expired !== 1 ? 's' : ''
    }?`
    if (!confirm(label)) return

    try {
      const deleted = await removeExpired()
      alert(`Deleted ${deleted} expired item${deleted !== 1 ? 's' : ''}`)
    } catch {
      alert('Failed to delete expired items')
    }
  }

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

        <AddGroceryForm onAdd={reload} />

        <div className="grocery-section">
          <div className="section-header">
            <h2>Your Groceries ({counts.total})</h2>
            {counts.expired > 0 && (
              <button className="bulk-delete-btn" onClick={handleBulkDeleteExpired}>
                🗑️ Delete All Expired ({counts.expired})
              </button>
            )}
          </div>

          <FilterBar
            onFilterChange={setFilters}
            expiringSoonCount={counts.expiringSoon}
            expiredCount={counts.expired}
            lowStockCount={counts.lowStock}
          />

          {error && <div className="error-state">{error}</div>}

          {loading ? (
            <div className="loading-state">Loading groceries...</div>
          ) : (
            <GroceryList groceries={groceries} onDelete={handleDelete} onUpdate={reload} />
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
