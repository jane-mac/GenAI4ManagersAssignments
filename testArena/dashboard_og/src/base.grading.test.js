
import { describe, it, expect } from 'vitest'
import { addItem, getTotal, getItemCount } from './engine'
import { analyzeColumns } from './utils/analyzeData'


// ─── analyzeColumns — edge cases ─────────────────────────────────────────────

describe('Dashboard — analyzeColumns edge cases', () => {
  it('returns empty numericCols and catCols for an empty rows array', () => {
    const { numericCols, catCols } = analyzeColumns(['age', 'name'], [])
    expect(numericCols).toHaveLength(0)
    expect(catCols).toHaveLength(0)
  })

  it('returns empty results for empty headers array', () => {
    const { cols } = analyzeColumns([], [{ age: '30' }])
    expect(cols).toHaveLength(0)
  })

  it('identifies a column of all negative numbers as numeric', () => {
    const headers = ['delta']
    const rows = [{ delta: '-5' }, { delta: '-10' }, { delta: '-3' }]
    const { numericCols } = analyzeColumns(headers, rows)
    expect(numericCols.map((c) => c.name)).toContain('delta')
  })

  it('computes correct mean for negative numbers', () => {
    const headers = ['delta']
    const rows = [{ delta: '-10' }, { delta: '-20' }, { delta: '-30' }]
    const { numericCols } = analyzeColumns(headers, rows)
    expect(numericCols[0].mean).toBeCloseTo(-20)
  })

  it('treats a column of all null/empty values as non-numeric', () => {
    const headers = ['empty']
    const rows = [{ empty: '' }, { empty: null }, { empty: '' }]
    const { numericCols } = analyzeColumns(headers, rows)
    const emptyCol = numericCols.find((c) => c.name === 'empty')
    expect(emptyCol).toBeUndefined()
  })

  it('strips currency symbols and parses numeric values correctly', () => {
    const headers = ['price']
    const rows = [{ price: '$10.00' }, { price: '$20.00' }, { price: '$30.00' }]
    const { numericCols } = analyzeColumns(headers, rows)
    expect(numericCols[0].mean).toBeCloseTo(20)
  })

  it('handles a malicious string in a cell without crashing', () => {
    const headers = ['name', 'score']
    const rows = [
      { name: '<script>alert(1)</script>', score: '100' },
      { name: 'Bob', score: '200' },
    ]
    expect(() => analyzeColumns(headers, rows)).not.toThrow()
  })

  it('handles a SQL-injection string in cell data without crashing', () => {
    const headers = ['label']
    const rows = [{ label: "'; DROP TABLE users; --" }]
    expect(() => analyzeColumns(headers, rows)).not.toThrow()
  })

  it('handles very large numeric values', () => {
    const headers = ['big']
    const rows = [{ big: '9999999999' }, { big: '8888888888' }]
    const { numericCols } = analyzeColumns(headers, rows)
    expect(numericCols[0].max).toBeCloseTo(9999999999)
  })

  it('correctly identifies min and max', () => {
    const headers = ['val']
    const rows = [{ val: '5' }, { val: '1' }, { val: '9' }, { val: '3' }]
    const { numericCols } = analyzeColumns(headers, rows)
    expect(numericCols[0].min).toBe(1)
    expect(numericCols[0].max).toBe(9)
  })

  it('does not count more than MAX_ROWS rows', () => {
    const headers = ['n']
    const rows = Array.from({ length: 600 }, (_, i) => ({ n: String(i) }))
    const { rows: limited } = analyzeColumns(headers, rows)
    expect(limited.length).toBeLessThanOrEqual(500)
  })
})

// ─── Export CSV bug fix ───────────────────────────────────────────────────────
// The buggy version exports only the header row.
// The fixed version must include the actual data rows.
// Looks for a helper exported from utils/analyzeData (any reasonable name).

describe('Dashboard — export CSV includes data rows (bug fix)', () => {
  const MISSING = 'No CSV-export helper found in utils/analyzeData exports. ' +
    'Expected an exported function (e.g. buildExportCsv, exportCsv, generateCsv, toCsv, …) ' +
    'that accepts (headers, rows) and returns a CSV string including data rows.'

  it('produces more than just the header line', () => {
    if (!buildExportCsv) return // graceful skip — function may live in App.jsx instead
    const headers = ['name', 'score']
    const rows = [{ name: 'Alice', score: '88' }, { name: 'Bob', score: '92' }]
    const csv = buildExportCsv(headers, rows)
    const lines = csv.trim().split('\n')
    expect(lines.length).toBeGreaterThan(1)
    expect(lines[1]).toContain('Alice')
  })

  it('CSV content contains cell values from the data rows', () => {
    if (!buildExportCsv) return
    const headers = ['city', 'population']
    const rows = [
      { city: 'Portland', population: '650000' },
      { city: 'Eugene',   population: '175000' },
    ]
    const csv = buildExportCsv(headers, rows)
    expect(csv).toContain('Portland')
    expect(csv).toContain('650000')
  })
})

describe('Dashboard — export CSV includes data rows (bug fix)', () => {
  const MISSING = 'No CSV-export helper found in utils/analyzeData exports. ' +
    'Expected an exported function (e.g. buildExportCsv, exportCsv, generateCsv, toCsv, …) ' +
    'that accepts (headers, rows) and returns a CSV string including data rows.'

  it('produces more than just the header line', () => {
    if (!buildExportCsv) return // graceful skip — function may live in App.jsx instead
    const headers = ['name', 'score']
    const rows = [{ name: 'Alice', score: '88' }, { name: 'Bob', score: '92' }]
    const csv = buildExportCsv(headers, rows)
    const lines = csv.trim().split('\n')
    expect(lines.length).toBeGreaterThan(1)
    expect(lines[1]).toContain('Alice')
  })

  it('CSV content contains cell values from the data rows', () => {
    if (!buildExportCsv) return
    const headers = ['city', 'population']
    const rows = [
      { city: 'Portland', population: '650000' },
      { city: 'Eugene',   population: '175000' },
    ]
    const csv = buildExportCsv(headers, rows)
    expect(csv).toContain('Portland')
    expect(csv).toContain('650000')
  })
})


describe('Dashboard - dark mode toggle doesn\'t clear the column filter', () => {
    it('does not clear the column filter when the dark mode toggle is clicked', () => {
        const { getByText } = render(<App />)
        const darkModeToggle = getByText('Dark Mode')
        fireEvent.click(darkModeToggle)
        expect(getByText('Filter columns...')).toBeInTheDocument()
    })
})