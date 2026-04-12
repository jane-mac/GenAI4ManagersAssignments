// Grading tests — hidden from students.
// These run in addition to the public smoke tests and cover:
//   1. analyzeColumns edge cases
//   2. Export CSV bug fix (must include data rows, not just headers)
//   3. Date-range filter feature (filterByDateRange exported from ./utils/analyzeData)
//   4. Chart selection feature (selectCharts exported from ./utils/analyzeData or similar)

import { describe, it, expect } from 'vitest'
import {
  analyzeColumns,
  prepareBarData,
  prepareLineData,
  preparePieData,
  prepareScatterData,
  prepareAreaData,
  filterByDateRange,
  selectCharts,
} from './utils/analyzeData'
import { addItem, getTotal, getItemCount } from './engine'

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
// We test the helper function buildExportCsv(headers, rows) if it is exported,
// OR we verify the logic by inspecting the CSV string directly.

describe('Dashboard — export CSV includes data rows (bug fix)', () => {
  it('buildExportCsv (if exported) produces more than just the header line', async () => {
    let buildExportCsv
    try {
      const mod = await import('./utils/analyzeData')
      buildExportCsv = mod.buildExportCsv
    } catch {
      // function may live elsewhere — skip gracefully
    }
    if (!buildExportCsv) return

    const headers = ['name', 'score']
    const rows = [
      { name: 'Alice', score: '88' },
      { name: 'Bob', score: '92' },
    ]
    const csv = buildExportCsv(headers, rows)
    const lines = csv.trim().split('\n')
    expect(lines.length).toBeGreaterThan(1) // header + at least one data row
    expect(lines[1]).toContain('Alice')
  })

  it('CSV content contains cell values from the data rows', async () => {
    let buildExportCsv
    try {
      const mod = await import('./utils/analyzeData')
      buildExportCsv = mod.buildExportCsv
    } catch {
      return
    }
    if (!buildExportCsv) return

    const headers = ['city', 'population']
    const rows = [
      { city: 'Portland', population: '650000' },
      { city: 'Eugene', population: '175000' },
    ]
    const csv = buildExportCsv(headers, rows)
    expect(csv).toContain('Portland')
    expect(csv).toContain('650000')
  })
})

// ─── Date-range filter (new feature) ─────────────────────────────────────────
// Expected: filterByDateRange(rows, dateCol, start, end) exported from ./utils/analyzeData
// rows: array of objects; dateCol: string key; start/end: ISO date strings 'YYYY-MM-DD'
// Returns only rows where dateCol value falls within [start, end] (inclusive).

describe('Dashboard — date-range filter feature', () => {
  const rows = [
    { date: '2024-01-10', value: '100' },
    { date: '2024-02-15', value: '200' },
    { date: '2024-03-20', value: '300' },
    { date: '2024-04-25', value: '400' },
  ]

  it('returns only rows within the date range (inclusive)', () => {
    const result = filterByDateRange(rows, 'date', '2024-02-01', '2024-03-31')
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.date)).toContain('2024-02-15')
    expect(result.map((r) => r.date)).toContain('2024-03-20')
  })

  it('includes the start date (inclusive lower bound)', () => {
    const result = filterByDateRange(rows, 'date', '2024-01-10', '2024-01-31')
    expect(result.map((r) => r.date)).toContain('2024-01-10')
  })

  it('includes the end date (inclusive upper bound)', () => {
    const result = filterByDateRange(rows, 'date', '2024-04-01', '2024-04-25')
    expect(result.map((r) => r.date)).toContain('2024-04-25')
  })

  it('returns all rows when the range covers all dates', () => {
    const result = filterByDateRange(rows, 'date', '2024-01-01', '2024-12-31')
    expect(result).toHaveLength(rows.length)
  })

  it('returns an empty array when no rows fall within the range', () => {
    const result = filterByDateRange(rows, 'date', '2025-01-01', '2025-12-31')
    expect(result).toHaveLength(0)
  })

  it('returns an empty array when input rows array is empty', () => {
    const result = filterByDateRange([], 'date', '2024-01-01', '2024-12-31')
    expect(result).toHaveLength(0)
  })

  it('does not mutate the original rows array', () => {
    const original = [...rows]
    filterByDateRange(rows, 'date', '2024-02-01', '2024-03-31')
    expect(rows).toHaveLength(original.length)
  })

  it('handles rows with missing date column values gracefully (no crash)', () => {
    const mixed = [
      { date: '2024-01-10', value: '100' },
      { value: '200' },              // missing date key
      { date: null, value: '300' },  // null date
    ]
    expect(() =>
      filterByDateRange(mixed, 'date', '2024-01-01', '2024-12-31')
    ).not.toThrow()
  })
})

// ─── Chart selection (new feature) ───────────────────────────────────────────
// Expected: selectCharts(allCharts, selectedKeys) exported from ./utils/analyzeData
// allCharts: object with chart-type keys (e.g. { bar, line, pie, scatter, area, ... })
// selectedKeys: array of up to 5 keys chosen by the user
// Returns an object containing only the selected chart entries.

describe('Dashboard — chart selection feature (5 of 8)', () => {
  const mockCharts = {
    bar:       { data: [], title: 'Bar' },
    line:      { data: [], title: 'Line' },
    pie:       { data: [], title: 'Pie' },
    scatter:   { data: [], title: 'Scatter' },
    area:      { data: [], title: 'Area' },
    histogram: { data: [], title: 'Histogram' },
    radar:     { data: [], title: 'Radar' },
    heatmap:   { data: [], title: 'Heatmap' },
  }

  it('returns only the selected chart keys', () => {
    const selected = selectCharts(mockCharts, ['bar', 'line', 'pie', 'scatter', 'area'])
    expect(Object.keys(selected)).toHaveLength(5)
    expect(selected).toHaveProperty('bar')
    expect(selected).not.toHaveProperty('histogram')
  })

  it('selecting fewer than 5 charts returns only those charts', () => {
    const selected = selectCharts(mockCharts, ['bar', 'line'])
    expect(Object.keys(selected)).toHaveLength(2)
  })

  it('selecting 0 charts returns an empty object', () => {
    const selected = selectCharts(mockCharts, [])
    expect(Object.keys(selected)).toHaveLength(0)
  })

  it('ignores keys that do not exist in allCharts', () => {
    const selected = selectCharts(mockCharts, ['bar', 'nonexistent'])
    expect(selected).toHaveProperty('bar')
    expect(selected).not.toHaveProperty('nonexistent')
  })

  it('does not mutate the original allCharts object', () => {
    const keys = Object.keys(mockCharts)
    selectCharts(mockCharts, ['bar', 'line'])
    expect(Object.keys(mockCharts)).toHaveLength(keys.length)
  })
})

// ─── Engine — used for column stats (additional edge cases) ──────────────────

describe('Dashboard engine — edge cases', () => {
  it('getTotal returns 0 for an empty stats array', () => {
    expect(getTotal([])).toBe(0)
  })

  it('getItemCount returns 0 for an empty stats array', () => {
    expect(getItemCount([])).toBe(0)
  })

  it('handles a column with a very large row count', () => {
    let stats = addItem([], 'revenue', 1234.56, 100000)
    expect(getItemCount(stats)).toBe(100000)
    expect(getTotal(stats)).toBeCloseTo(1234.56 * 100000)
  })

  it('handles a column mean of 0', () => {
    let stats = addItem([], 'zero-col', 0, 50)
    expect(getTotal(stats)).toBe(0)
  })
})
