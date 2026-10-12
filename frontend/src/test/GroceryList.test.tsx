import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroceryList } from '../components/GroceryList'
import type { Grocery } from '../api'

function item(over: Partial<Grocery> = {}): Grocery {
  return {
    _id: '1',
    name: 'Milk',
    quantity: 2,
    unit: 'l',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    category: 'Dairy',
    lowStockThreshold: 1,
    expirationStatus: 'fresh',
    isLowStock: false,
    ...over,
  }
}

const api = vi.hoisted(() => ({
  getGroceries: vi.fn(),
  addGrocery: vi.fn(),
  updateGrocery: vi.fn(),
  deleteGrocery: vi.fn(),
  deleteExpiredGroceries: vi.fn(),
}))

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api')
  return { ...actual, ...api }
})

describe('GroceryList UI actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders each item name', () => {
    render(
      <GroceryList
        groceries={[item({ name: 'Milk' }), item({ _id: '2', name: 'Bread' })]}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
      />,
    )
    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Bread')).toBeInTheDocument()
  })

  it('shows an empty state when there are no items', () => {
    render(<GroceryList groceries={[]} onDelete={vi.fn()} onUpdate={vi.fn()} />)
    expect(screen.getByText(/no groceries found/i)).toBeInTheDocument()
  })

  it('invokes onDelete with the item id when delete is clicked', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    render(<GroceryList groceries={[item()]} onDelete={onDelete} onUpdate={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1))
    expect(onDelete).toHaveBeenCalledWith('1')
  })
})
