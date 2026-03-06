// Public smoke tests — these are a subset of what the grader will run.
// Passing these does NOT guarantee a full score; the majority of tests are hidden.

import { describe, it, expect } from 'vitest'
import { addItem, getTotal, getItemCount } from './engine'

describe('E-Commerce — public smoke tests', () => {
  it('adding an item to an empty cart returns a cart with one entry', () => {
    const cart = addItem([], '501 Original Fit', 79.5, 1)
    expect(cart).toHaveLength(1)
    expect(cart[0].name).toBe('501 Original Fit')
  })

  it('cart total is price × quantity, not price + quantity', () => {
    const cart = addItem([], '501 Original Fit', 79.5, 2)
    expect(getTotal(cart)).toBe(159)
  })

  it('adding the same item twice increases quantity, not length', () => {
    let cart = addItem([], '501 Original Fit', 79.5, 1)
    cart = addItem(cart, '501 Original Fit', 79.5, 1)
    expect(cart).toHaveLength(1)
    expect(cart[0].quantity).toBe(2)
  })

  it('getItemCount returns the sum of all quantities', () => {
    const cart = addItem([], '501 Original Fit', 79.5, 3)
    expect(getItemCount(cart)).toBe(3)
  })
})
