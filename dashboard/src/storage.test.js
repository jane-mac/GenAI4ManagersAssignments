import { describe, it, expect, beforeEach } from 'vitest'
import { loadItems, saveItems, loadDashboard, saveDashboard, clearDashboard } from './storage'

beforeEach(() => {
  localStorage.clear()
})

// ─── loadItems / saveItems ────────────────────────────────────────────────────

describe('loadItems', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(loadItems()).toEqual([])
  })

  it('returns previously saved stats', () => {
    const stats = [{ name: 'Revenue', value: 42.5, quantity: 100 }]
    localStorage.setItem('dashboard-stats', JSON.stringify(stats))
    expect(loadItems()).toEqual(stats)
  })

  it('returns an empty array when stored data is invalid JSON', () => {
    localStorage.setItem('dashboard-stats', 'not-valid-json')
    expect(loadItems()).toEqual([])
  })
})

describe('saveItems', () => {
  it('persists stats to localStorage', () => {
    const stats = [{ name: 'Revenue', value: 42.5, quantity: 100 }]
    saveItems(stats)
    const stored = JSON.parse(localStorage.getItem('dashboard-stats'))
    expect(stored).toEqual(stats)
  })

  it('returns the same array it was given', () => {
    const stats = [{ name: 'Revenue', value: 42.5, quantity: 100 }]
    expect(saveItems(stats)).toBe(stats)
  })
})

// ─── loadDashboard / saveDashboard ────────────────────────────────────────────

describe('loadDashboard', () => {
  it('returns null values when nothing is stored', () => {
    expect(loadDashboard()).toEqual({ fileName: null, dashData: null })
  })

  it('returns the saved fileName and dashData', () => {
    const dashData = { headers: ['a', 'b'], rowCount: 10 }
    localStorage.setItem('dashboard-filename', 'sales.csv')
    localStorage.setItem('dashboard-data', JSON.stringify(dashData))
    expect(loadDashboard()).toEqual({ fileName: 'sales.csv', dashData })
  })

  it('returns null dashData when stored data is invalid JSON', () => {
    localStorage.setItem('dashboard-filename', 'sales.csv')
    localStorage.setItem('dashboard-data', 'not-valid-json')
    expect(loadDashboard()).toEqual({ fileName: null, dashData: null })
  })
})

describe('saveDashboard', () => {
  it('persists fileName and dashData to localStorage', () => {
    const dashData = { headers: ['x', 'y'], rowCount: 5 }
    saveDashboard('data.csv', dashData)
    expect(localStorage.getItem('dashboard-filename')).toBe('data.csv')
    expect(JSON.parse(localStorage.getItem('dashboard-data'))).toEqual(dashData)
  })
})

// ─── clearDashboard ───────────────────────────────────────────────────────────

describe('clearDashboard', () => {
  it('removes all dashboard keys from localStorage', () => {
    saveDashboard('data.csv', { headers: [] })
    saveItems([{ name: 'Revenue', value: 10, quantity: 5 }])
    clearDashboard()
    expect(localStorage.getItem('dashboard-filename')).toBeNull()
    expect(localStorage.getItem('dashboard-data')).toBeNull()
    expect(localStorage.getItem('dashboard-stats')).toBeNull()
  })

  it('loadDashboard returns nulls after clear', () => {
    saveDashboard('data.csv', { headers: [] })
    clearDashboard()
    expect(loadDashboard()).toEqual({ fileName: null, dashData: null })
  })
})

// ─── round-trip ──────────────────────────────────────────────────────────────

describe('round-trip', () => {
  it('restores stats and dashboard data after save', () => {
    const stats = [{ name: 'Revenue', value: 42.5, quantity: 100 }]
    const dashData = { headers: ['Revenue'], rowCount: 100 }
    saveItems(stats)
    saveDashboard('sales.csv', dashData)
    expect(loadItems()).toEqual(stats)
    expect(loadDashboard()).toEqual({ fileName: 'sales.csv', dashData })
  })
})
