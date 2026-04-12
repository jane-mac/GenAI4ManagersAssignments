// Grading tests — hidden from students.
// Tests check FUNCTIONALITY, not specific function names.
// Standard engine functions (addItem, removeItem, etc.) must keep those names.
// New feature functions are discovered by name variants or behavioral probing.

import { describe, it, expect } from 'vitest'
import { addItem, getTotal, updateQuantity, getItemCount, findItem, removeItem } from './engine'

// ─── Engine — bug-fix confirmation ───────────────────────────────────────────

describe('E-Commerce engine — getTotal bug fix', () => {
  it('multiplies price × quantity (not price + quantity)', () => {
    const cart = addItem([], '501 Original Fit', 79.5, 3)
    expect(getTotal(cart)).toBe(238.5)
  })

  it('returns 0 for an empty cart', () => {
    expect(getTotal([])).toBe(0)
  })

  it('handles floating-point prices across multiple items', () => {
    let cart = addItem([], '501 Original Fit', 59.99, 2)
    cart = addItem(cart, '505 Regular Fit', 69.99, 1)
    expect(getTotal(cart)).toBeCloseTo(189.97)
  })
})


// ─── Engine — edge cases ──────────────────────────────────────────────────────

describe('E-Commerce engine — edge cases', () => {
  it('updateQuantity to 0 removes the item from the cart', () => {
    let cart = addItem([], '501 Original Fit', 79.5, 2)
    cart = updateQuantity(cart, '501 Original Fit', 0)
    expect(cart).toHaveLength(0)
  })

  it('updateQuantity with a negative number removes the item', () => {
    let cart = addItem([], '501 Original Fit', 79.5, 2)
    cart = updateQuantity(cart, '501 Original Fit', -5)
    expect(cart).toHaveLength(0)
  })

  it('updateQuantity on a non-existent item leaves the cart unchanged', () => {
    const cart = addItem([], '501 Original Fit', 79.5, 1)
    const result = updateQuantity(cart, 'Phantom Item', 3)
    expect(result).toHaveLength(1)
  })

  it('addItem stacks quantity when the same product is added twice', () => {
    let cart = addItem([], '501 Original Fit', 79.5, 1)
    cart = addItem(cart, '501 Original Fit', 79.5, 1)
    expect(cart).toHaveLength(1)
    expect(cart[0].quantity).toBe(2)
  })

  it('addItem is case-insensitive when matching existing items', () => {
    let cart = addItem([], '501 Original Fit', 79.5, 1)
    cart = addItem(cart, '501 original fit', 79.5, 1)
    expect(cart).toHaveLength(1)
    expect(cart[0].quantity).toBe(2)
  })

  it('removeItem is case-insensitive', () => {
    let cart = addItem([], '501 Original Fit', 79.5, 2)
    cart = removeItem(cart, '501 original fit')
    expect(cart).toHaveLength(0)
  })

  it('findItem returns null for a missing item', () => {
    const cart = addItem([], '501 Original Fit', 79.5, 1)
    expect(findItem(cart, 'does not exist')).toBeNull()
  })

  it('findItem is case-insensitive', () => {
    const cart = addItem([], '501 Original Fit', 79.5, 1)
    expect(findItem(cart, '501 ORIGINAL FIT')).not.toBeNull()
  })

  it('getItemCount sums quantities across all items', () => {
    let cart = addItem([], '501 Original Fit', 79.5, 2)
    cart = addItem(cart, '505 Regular Fit', 69.5, 3)
    expect(getItemCount(cart)).toBe(5)
  })

  it('getItemCount returns 0 for an empty cart', () => {
    expect(getItemCount([])).toBe(0)
  })

  it('handles very large quantities without incorrect overflow', () => {
    const cart = addItem([], '501 Original Fit', 79.5, 10000)
    expect(getItemCount(cart)).toBe(10000)
    expect(getTotal(cart)).toBeCloseTo(795000)
  })

  it('stores a malicious HTML string as a name without crashing', () => {
    const xss = '<script>alert("xss")</script>'
    const cart = addItem([], xss, 10, 1)
    expect(cart).toHaveLength(1)
    expect(getTotal(cart)).toBe(10)
  })

  it('addItem does not mutate the original cart array', () => {
    const original = [{ name: '501 Original Fit', value: 79.5, quantity: 1 }]
    addItem(original, '505 Regular Fit', 69.5, 1)
    expect(original).toHaveLength(1)
  })

  it('removeItem does not mutate the original cart array', () => {
    const original = [{ name: '501 Original Fit', value: 79.5, quantity: 1 }]
    removeItem(original, '501 Original Fit')
    expect(original).toHaveLength(1)
  })
})