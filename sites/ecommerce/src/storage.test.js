import { describe, it, expect, beforeEach } from 'vitest'
import { loadItems, saveItems } from './storage'

beforeEach(() => {
  localStorage.clear()
})

// ─── loadItems ───────────────────────────────────────────────────────────────

describe('loadItems', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(loadItems()).toEqual([])
  })

  it('returns previously saved cart items', () => {
    const cart = [{ name: 'Slim Fit Jeans', value: 79.99, quantity: 1 }]
    localStorage.setItem('ecommerce-cart', JSON.stringify(cart))
    expect(loadItems()).toEqual(cart)
  })

  it('returns an empty array when stored data is invalid JSON', () => {
    localStorage.setItem('ecommerce-cart', 'not-valid-json')
    expect(loadItems()).toEqual([])
  })
})

// ─── saveItems ───────────────────────────────────────────────────────────────

describe('saveItems', () => {
  it('persists cart items to localStorage', () => {
    const cart = [{ name: 'Slim Fit Jeans', value: 79.99, quantity: 2 }]
    saveItems(cart)
    const stored = JSON.parse(localStorage.getItem('ecommerce-cart'))
    expect(stored).toEqual(cart)
  })

  it('returns the same array it was given', () => {
    const cart = [{ name: 'Slim Fit Jeans', value: 79.99, quantity: 1 }]
    expect(saveItems(cart)).toBe(cart)
  })

  it('overwrites previously saved cart', () => {
    const first = [{ name: 'Slim Fit Jeans', value: 79.99, quantity: 1 }]
    const second = [{ name: 'Straight Leg Jeans', value: 89.99, quantity: 3 }]
    saveItems(first)
    saveItems(second)
    expect(loadItems()).toEqual(second)
  })

  it('persists an empty cart (after checkout)', () => {
    saveItems([])
    expect(loadItems()).toEqual([])
  })
})

// ─── round-trip ──────────────────────────────────────────────────────────────

describe('save/load round-trip', () => {
  it('restores multiple cart items with all fields intact', () => {
    const cart = [
      { name: 'Slim Fit Jeans', value: 79.99, quantity: 1 },
      { name: 'Straight Leg Jeans', value: 89.99, quantity: 2 },
    ]
    saveItems(cart)
    expect(loadItems()).toEqual(cart)
  })
})
