// Grading tests — hidden from students.
// Tests check FUNCTIONALITY, not specific function names.
// Standard engine functions (addItem, removeItem, etc.) must keep those names.
// New feature functions are discovered by name variants or behavioral probing.

import { describe, it, expect } from 'vitest'
import * as engineModule from './engine'

const { addItem, removeItem, updateQuantity, getTotal, getItemCount, findItem } = engineModule

// ─── Discovery helpers ────────────────────────────────────────────────────────

function findFn(mod, ...names) {
  for (const name of names) {
    if (typeof mod[name] === 'function') return mod[name]
  }
  return null
}

const CORE_ENGINE = new Set([
  'addItem', 'removeItem', 'updateQuantity', 'getTotal', 'getItemCount', 'findItem',
])

// Find the belt-promo function: try name variants, then probe by behavior.
function detectBeltPromoFn() {
  const fn = findFn(
    engineModule,
    'applyBeltPromo', 'beltPromo', 'checkBeltPromo', 'handleBeltPromo',
    'applyPromo', 'addBeltPromo', 'addBeltIfEligible', 'applyBeltDiscount',
    'beltDiscount', 'promoBelt',
  )
  if (fn) return fn

  // Behavioral: a function that takes a cart with 2 light-wash items and returns
  // a cart that now contains a belt.
  for (const [name, candidate] of Object.entries(engineModule)) {
    if (typeof candidate !== 'function' || CORE_ENGINE.has(name)) continue
    try {
      const testCart = addItem([], '501 Light Wash', 79.5, 2)
      const result = candidate(testCart)
      if (Array.isArray(result) && result.some(i => i.name?.toLowerCase().includes('belt'))) {
        return candidate
      }
    } catch {}
  }
  return null
}

// Find the shipping-estimator function: try name variants, then probe by behavior.
function detectShippingFn() {
  const fn = findFn(
    engineModule,
    'estimateShipping', 'calcShipping', 'calculateShipping', 'getShippingEstimate',
    'shippingEstimate', 'shippingCost', 'getShipping', 'computeShipping',
    'shippingDays', 'getDeliveryEstimate', 'deliveryEstimate',
  )
  if (fn) return fn

  // Behavioral: a function that accepts a zip string and returns an object
  // with a positive numeric days (or estimatedDays) property.
  for (const [name, candidate] of Object.entries(engineModule)) {
    if (typeof candidate !== 'function' || CORE_ENGINE.has(name)) continue
    try {
      const result = candidate('90210')
      if (
        result &&
        typeof result === 'object' &&
        !Array.isArray(result) &&
        (typeof result.days === 'number' || typeof result.estimatedDays === 'number')
      ) {
        return candidate
      }
    } catch {}
  }
  return null
}

const applyBeltPromo  = detectBeltPromoFn()
const estimateShipping = detectShippingFn()

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

// ─── Belt Promo (new feature) ────────────────────────────────────────────────
// Expects a function exported from engine.js that:
//   - takes the current cart array
//   - adds a free Belt (value = 0) when cart contains ≥ 2 light-wash jeans
//   - removes the belt when the light-wash quantity drops below 2
// Common export names: applyBeltPromo, beltPromo, handleBeltPromo, addBeltIfEligible, etc.

describe('E-Commerce — belt promo feature', () => {
  const MISSING = 'No belt-promo function found in engine.js exports. ' +
    'Expected an exported function (e.g. applyBeltPromo, beltPromo, addBeltIfEligible, …) ' +
    'that accepts a cart array and adds/removes a free belt based on light-wash quantity.'

  it('adds a free belt when cart contains exactly 2 light-wash jeans', () => {
    if (!applyBeltPromo) throw new Error(MISSING)
    let cart = addItem([], '501 Light Wash', 79.5, 2)
    cart = applyBeltPromo(cart)
    const belt = findItem(cart, 'belt')
    expect(belt).not.toBeNull()
    expect(belt.value).toBe(0)
  })

  it('adds a free belt when light-wash quantity is greater than 2', () => {
    if (!applyBeltPromo) throw new Error(MISSING)
    let cart = addItem([], '501 Light Wash', 79.5, 4)
    cart = applyBeltPromo(cart)
    expect(findItem(cart, 'belt')).not.toBeNull()
  })

  it('does NOT add a belt when cart has only 1 light-wash jean', () => {
    if (!applyBeltPromo) throw new Error(MISSING)
    let cart = addItem([], '501 Light Wash', 79.5, 1)
    cart = applyBeltPromo(cart)
    expect(findItem(cart, 'belt')).toBeNull()
  })

  it('does NOT add a belt when cart has 0 light-wash jeans', () => {
    if (!applyBeltPromo) throw new Error(MISSING)
    const cart = applyBeltPromo([])
    expect(findItem(cart, 'belt')).toBeNull()
  })

  it('does NOT add a belt for non-light-wash products', () => {
    if (!applyBeltPromo) throw new Error(MISSING)
    let cart = addItem([], '501 Original Fit', 79.5, 3)
    cart = applyBeltPromo(cart)
    expect(findItem(cart, 'belt')).toBeNull()
  })

  it('belt does not increase the cart total (it is free)', () => {
    if (!applyBeltPromo) throw new Error(MISSING)
    let cart = addItem([], '501 Light Wash', 79.5, 2)
    cart = applyBeltPromo(cart)
    expect(getTotal(cart)).toBeCloseTo(159) // 79.5 × 2; belt is $0
  })

  it('does not add duplicate belts when promo is applied more than once', () => {
    if (!applyBeltPromo) throw new Error(MISSING)
    let cart = addItem([], '501 Light Wash', 79.5, 2)
    cart = applyBeltPromo(cart)
    cart = applyBeltPromo(cart)
    const belts = cart.filter((item) => item.name.toLowerCase() === 'belt')
    expect(belts).toHaveLength(1)
  })

  it('removes the belt if light-wash quantity drops below 2 after update', () => {
    if (!applyBeltPromo) throw new Error(MISSING)
    let cart = addItem([], '501 Light Wash', 79.5, 2)
    cart = applyBeltPromo(cart)
    expect(findItem(cart, 'belt')).not.toBeNull()

    cart = updateQuantity(cart, '501 Light Wash', 1)
    cart = applyBeltPromo(cart)
    expect(findItem(cart, 'belt')).toBeNull()
  })
})

// ─── Shipping Estimator (new feature) ────────────────────────────────────────
// Expects a function exported from engine.js that:
//   - accepts a US zip code string
//   - returns an object with at least { days } (positive integer) for valid zips
//   - returns null or an object without days for invalid inputs
// Common export names: estimateShipping, calcShipping, getShippingEstimate, etc.

describe('E-Commerce — shipping estimator feature', () => {
  const MISSING = 'No shipping-estimator function found in engine.js exports. ' +
    'Expected an exported function (e.g. estimateShipping, calcShipping, getShippingEstimate, …) ' +
    'that accepts a zip code string and returns an object with a days property.'

  it('returns a result object for a valid 5-digit zip code', () => {
    if (!estimateShipping) throw new Error(MISSING)
    const result = estimateShipping('90210')
    expect(result).not.toBeNull()
    expect(result).toBeDefined()
  })

  it('estimated days is a positive number for a valid zip', () => {
    if (!estimateShipping) throw new Error(MISSING)
    const result = estimateShipping('10001')
    const days = result?.days ?? result?.estimatedDays
    expect(typeof days).toBe('number')
    expect(days).toBeGreaterThan(0)
  })

  it('returns valid estimates for different zip codes', () => {
    if (!estimateShipping) throw new Error(MISSING)
    const r1 = estimateShipping('90001') // LA
    const r2 = estimateShipping('10001') // NYC
    expect(r1?.days ?? r1?.estimatedDays).toBeGreaterThan(0)
    expect(r2?.days ?? r2?.estimatedDays).toBeGreaterThan(0)
  })

  it('returns null or an error indicator for an empty zip code', () => {
    if (!estimateShipping) throw new Error(MISSING)
    const result = estimateShipping('')
    const isInvalid =
      result == null ||
      result.error != null ||
      (result.days == null && result.estimatedDays == null)
    expect(isInvalid).toBe(true)
  })

  it('returns null or an error indicator for a non-numeric zip', () => {
    if (!estimateShipping) throw new Error(MISSING)
    const result = estimateShipping('abcde')
    const isInvalid =
      result == null ||
      result.error != null ||
      (result.days == null && result.estimatedDays == null)
    expect(isInvalid).toBe(true)
  })

  it('returns null or an error indicator for a zip that is too short', () => {
    if (!estimateShipping) throw new Error(MISSING)
    const result = estimateShipping('123')
    const isInvalid =
      result == null ||
      result.error != null ||
      (result.days == null && result.estimatedDays == null)
    expect(isInvalid).toBe(true)
  })

  it('does not throw for a SQL-injection-style string', () => {
    if (!estimateShipping) throw new Error(MISSING)
    expect(() => estimateShipping("'; DROP TABLE zips; --")).not.toThrow()
  })

  it('does not throw for a very long input string', () => {
    if (!estimateShipping) throw new Error(MISSING)
    expect(() => estimateShipping('1'.repeat(1000))).not.toThrow()
  })
})
