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

  it('returns previously saved items', () => {
    const items = [{ name: 'Sword', value: 150, quantity: 1 }]
    localStorage.setItem('catalog-items', JSON.stringify(items))
    expect(loadItems()).toEqual(items)
  })

  it('returns an empty array when stored data is invalid JSON', () => {
    localStorage.setItem('catalog-items', 'not-valid-json')
    expect(loadItems()).toEqual([])
  })
})

// ─── saveItems ───────────────────────────────────────────────────────────────

describe('saveItems', () => {
  it('persists items to localStorage', () => {
    const items = [{ name: 'Potion', value: 50, quantity: 3 }]
    saveItems(items)
    const stored = JSON.parse(localStorage.getItem('catalog-items'))
    expect(stored).toEqual(items)
  })

  it('returns the same items array it was given', () => {
    const items = [{ name: 'Shield', value: 80, quantity: 2 }]
    expect(saveItems(items)).toBe(items)
  })

  it('overwrites previously saved items', () => {
    const first = [{ name: 'Sword', value: 150, quantity: 1 }]
    const second = [{ name: 'Bow', value: 90, quantity: 5 }]
    saveItems(first)
    saveItems(second)
    expect(loadItems()).toEqual(second)
  })

  it('persists an empty array', () => {
    saveItems([])
    expect(loadItems()).toEqual([])
  })
})

// ─── round-trip ──────────────────────────────────────────────────────────────

describe('save/load round-trip', () => {
  it('restores multiple items with all fields intact', () => {
    const items = [
      { name: 'Sword', value: 150, quantity: 2 },
      { name: 'Potion', value: 50, quantity: 10 },
    ]
    saveItems(items)
    expect(loadItems()).toEqual(items)
  })
})
