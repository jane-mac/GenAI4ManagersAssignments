import { describe, it, expect, beforeEach } from 'vitest'
import { loadItems, saveItems } from './storage'

beforeEach(() => {
  localStorage.clear()
})

// ─── loadItems ───────────────────────────────────────────────────────────────

describe('loadItems', () => {
  it('returns an empty array when no game has been played', () => {
    expect(loadItems()).toEqual([])
  })

  it('returns the last saved inventory', () => {
    const inventory = [{ name: 'coin', value: 1, quantity: 5 }]
    localStorage.setItem('game-inventory', JSON.stringify(inventory))
    expect(loadItems()).toEqual(inventory)
  })

  it('returns an empty array when stored data is invalid JSON', () => {
    localStorage.setItem('game-inventory', 'not-valid-json')
    expect(loadItems()).toEqual([])
  })
})

// ─── saveItems ───────────────────────────────────────────────────────────────

describe('saveItems', () => {
  it('persists inventory to localStorage', () => {
    const inventory = [{ name: 'star', value: 5, quantity: 2 }]
    saveItems(inventory)
    const stored = JSON.parse(localStorage.getItem('game-inventory'))
    expect(stored).toEqual(inventory)
  })

  it('returns the same array it was given', () => {
    const inventory = [{ name: 'coin', value: 1, quantity: 3 }]
    expect(saveItems(inventory)).toBe(inventory)
  })

  it('overwrites the previous inventory on restart', () => {
    const lastGame = [{ name: 'star', value: 5, quantity: 1 }]
    saveItems(lastGame)
    saveItems([])
    expect(loadItems()).toEqual([])
  })
})

// ─── round-trip ──────────────────────────────────────────────────────────────

describe('save/load round-trip', () => {
  it('restores a mixed inventory with all fields intact', () => {
    const inventory = [
      { name: 'coin', value: 1, quantity: 10 },
      { name: 'star', value: 5, quantity: 3 },
    ]
    saveItems(inventory)
    expect(loadItems()).toEqual(inventory)
  })
})
