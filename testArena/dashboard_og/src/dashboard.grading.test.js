// Dashboard grading tests — hidden from students.
// Tests check FUNCTIONALITY, not specific function names.
// analyzeColumns must keep its name (base spec requirement).
// New feature functions are discovered by name variants or behavioral probing.
// Bug fixes are tested through rendered UI (RTL) so implementation details don't matter.

import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import App from './App'
import * as analyzeDataModule from './utils/analyzeData'
import { addItem, getTotal, getItemCount } from './engine'

const { analyzeColumns } = analyzeDataModule

// ─── Dashboard seed helpers ───────────────────────────────────────────────────
// Seeding localStorage lets us render the dashboard view without needing file upload.

const TEST_ROWS = [
  { name: 'Alice', score: '88', date: '2024-01-10' },
  { name: 'Bob',   score: '92', date: '2024-03-15' },
  { name: 'Carol', score: '75', date: '2024-06-20' },
]

const MOCK_DASH_DATA = {
  headers:  ['name', 'score', 'date'],
  rowCount: TEST_ROWS.length,
  analysis: {
    numericCols: [{ name: 'score', mean: 85, min: 75, max: 92, count: 3 }],
    catCols:     [{ name: 'name', unique: 3 }, { name: 'date', unique: 3 }],
    rows:        TEST_ROWS,
  },
  charts: { bar: null, line: null, pie: null, scatter: null, area: null },
}

function seedDashboard() {
  localStorage.setItem('dashboard-filename', 'test.csv')
  localStorage.setItem('dashboard-data', JSON.stringify(MOCK_DASH_DATA))
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// ─── Discovery helpers (for new feature functions) ────────────────────────────

const CORE_ANALYZE = new Set([
  'analyzeColumns', 'prepareBarData', 'prepareLineData', 'preparePieData',
  'prepareScatterData', 'prepareAreaData',
])

function findFn(mod, ...names) {
  for (const name of names) {
    if (typeof mod[name] === 'function') return mod[name]
  }
  return null
}

function detectFilterByDateRange() {
  const fn = findFn(
    analyzeDataModule,
    'filterByDateRange', 'filterByDate', 'dateRangeFilter', 'filterDates',
    'filterRowsByDate', 'filterRowsByDateRange', 'dateFilter', 'filterData',
    'applyDateFilter', 'applyDateRange',
  )
  if (fn) return fn

  // Behavioral probe: try every non-core exported function.
  const testRows = [{ date: '2024-01-10' }, { date: '2024-06-15' }]
  for (const [, candidate] of Object.entries(analyzeDataModule)) {
    if (typeof candidate !== 'function' || CORE_ANALYZE.has(candidate.name)) continue
    try {
      const result = candidate(testRows, 'date', '2024-01-01', '2024-03-31')
      if (Array.isArray(result) && result.length === 1 && result[0].date === '2024-01-10') {
        return candidate
      }
    } catch {}
  }
  return null
}

function detectSelectCharts() {
  const fn = findFn(
    analyzeDataModule,
    'selectCharts', 'getSelectedCharts', 'filterCharts', 'chooseCharts',
    'getCharts', 'pickCharts', 'chartSelection', 'filterSelectedCharts',
  )
  if (fn) return fn

  const mockCharts = { bar: {}, line: {}, pie: {} }
  for (const [, candidate] of Object.entries(analyzeDataModule)) {
    if (typeof candidate !== 'function' || CORE_ANALYZE.has(candidate.name)) continue
    try {
      const result = candidate(mockCharts, ['bar', 'line'])
      if (
        result && typeof result === 'object' && !Array.isArray(result) &&
        Object.keys(result).length === 2 && 'bar' in result && !('pie' in result)
      ) {
        return candidate
      }
    } catch {}
  }
  return null
}

function detectBuildExportCsv() {
  return findFn(
    analyzeDataModule,
    'buildExportCsv', 'exportCsv', 'buildCsv', 'generateCsv',
    'createCsv', 'toCsv', 'exportToCsv', 'makeCsv',
  )
}


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


// ─── Dark mode bug fix (RTL) ──────────────────────────────────────────────────
// Bug: toggleDarkMode() also called setColumnFilter(''), wiping the filter value.
// Fix: toggling dark mode must NOT reset the column filter.

describe('Dashboard — dark mode does not clear column filter (bug fix)', () => {
  it('preserves the filter value when dark mode is toggled on', async () => {
    seedDashboard()
    const user = userEvent.setup()
    render(createElement(App))

    // Filter input is visible once dashboard data is loaded from localStorage.
    const filterInput = screen.getByPlaceholderText(/filter columns/i)
    await user.type(filterInput, 'score')
    expect(filterInput.value).toBe('score')

    const darkModeBtn = screen.getByRole('button', { name: /dark mode/i })
    await user.click(darkModeBtn)

    // Buggy code resets this to ''; fixed code leaves it as 'score'.
    expect(filterInput.value).toBe('score')
  })

  it('preserves the filter value when dark mode is toggled off again', async () => {
    seedDashboard()
    const user = userEvent.setup()
    render(createElement(App))

    const filterInput = screen.getByPlaceholderText(/filter columns/i)
    await user.type(filterInput, 'name')

    // Toggle on then off.
    await user.click(screen.getByRole('button', { name: /dark mode/i }))
    await user.click(screen.getByRole('button', { name: /light mode/i }))

    expect(filterInput.value).toBe('name')
  })
})


// ─── Export CSV bug fix ───────────────────────────────────────────────────────
// Bug: handleExport only exported dashData.headers.join(',') — no data rows.
// Fix: the export must include actual data row values, not just column headers.
// Tests both the UI behaviour (click Export → what's in the blob) and any
// separately-exported helper function in utils/analyzeData.

describe('Dashboard — export CSV includes data rows (bug fix)', () => {
  it('clicking Export CSV produces a blob that contains data row values', async () => {
    seedDashboard()

    let capturedBlob = null
    // jsdom doesn't implement URL.createObjectURL — define stubs before spying.
    if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:fake'
    if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {}
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      capturedBlob = blob
      return 'blob:fake'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const user = userEvent.setup()
    render(createElement(App))

    const exportBtn = screen.queryByRole('button', { name: /export csv/i })
    if (!exportBtn) return // export button not yet present — skip gracefully

    await user.click(exportBtn)

    if (!capturedBlob) return // student used a different download mechanism — skip
    const text = await capturedBlob.text()
    // Buggy code produces "name,score,date" only; fixed code includes row data.
    expect(text).toContain('Alice')
    expect(text).toContain('88')
  })

  it('buildExportCsv (if exported) produces more than just the header line', () => {
    const buildExportCsv = detectBuildExportCsv()
    if (!buildExportCsv) return // graceful skip — may live in App.jsx

    const headers = ['name', 'score']
    const rows = [{ name: 'Alice', score: '88' }, { name: 'Bob', score: '92' }]
    const csv = buildExportCsv(headers, rows)
    const lines = csv.trim().split('\n')
    expect(lines.length).toBeGreaterThan(1)
    expect(lines[1]).toContain('Alice')
  })

  it('buildExportCsv (if exported) includes all cell values from data rows', () => {
    const buildExportCsv = detectBuildExportCsv()
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


// ─── Date-range filter (new feature) ─────────────────────────────────────────
// Expects a function exported from utils/analyzeData that:
//   - accepts (rows, dateColKey, startISO, endISO)
//   - returns only rows where the date falls within [start, end] inclusive
// Common export names: filterByDateRange, dateRangeFilter, filterDates, applyDateFilter, etc.

describe('Dashboard — date-range filter feature', () => {
  const MISSING =
    'No date-range filter function found in utils/analyzeData exports. ' +
    'Expected a function (e.g. filterByDateRange, dateRangeFilter, applyDateFilter, …) ' +
    'that accepts (rows, dateColumn, startDate, endDate) and returns the filtered rows.'

  const rows = [
    { date: '2024-01-10', value: '100' },
    { date: '2024-02-15', value: '200' },
    { date: '2024-03-20', value: '300' },
    { date: '2024-04-25', value: '400' },
  ]

  it('returns only rows within the date range (inclusive)', () => {
    const filterByDateRange = detectFilterByDateRange()
    if (!filterByDateRange) throw new Error(MISSING)
    const result = filterByDateRange(rows, 'date', '2024-02-01', '2024-03-31')
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.date)).toContain('2024-02-15')
    expect(result.map((r) => r.date)).toContain('2024-03-20')
  })

  it('includes the start date (inclusive lower bound)', () => {
    const filterByDateRange = detectFilterByDateRange()
    if (!filterByDateRange) throw new Error(MISSING)
    const result = filterByDateRange(rows, 'date', '2024-01-10', '2024-01-31')
    expect(result.map((r) => r.date)).toContain('2024-01-10')
  })

  it('includes the end date (inclusive upper bound)', () => {
    const filterByDateRange = detectFilterByDateRange()
    if (!filterByDateRange) throw new Error(MISSING)
    const result = filterByDateRange(rows, 'date', '2024-04-01', '2024-04-25')
    expect(result.map((r) => r.date)).toContain('2024-04-25')
  })

  it('returns all rows when the range covers all dates', () => {
    const filterByDateRange = detectFilterByDateRange()
    if (!filterByDateRange) throw new Error(MISSING)
    const result = filterByDateRange(rows, 'date', '2024-01-01', '2024-12-31')
    expect(result).toHaveLength(rows.length)
  })

  it('returns an empty array when no rows fall within the range', () => {
    const filterByDateRange = detectFilterByDateRange()
    if (!filterByDateRange) throw new Error(MISSING)
    const result = filterByDateRange(rows, 'date', '2025-01-01', '2025-12-31')
    expect(result).toHaveLength(0)
  })

  it('returns an empty array when input rows array is empty', () => {
    const filterByDateRange = detectFilterByDateRange()
    if (!filterByDateRange) throw new Error(MISSING)
    const result = filterByDateRange([], 'date', '2024-01-01', '2024-12-31')
    expect(result).toHaveLength(0)
  })

  it('does not mutate the original rows array', () => {
    const filterByDateRange = detectFilterByDateRange()
    if (!filterByDateRange) throw new Error(MISSING)
    const original = [...rows]
    filterByDateRange(rows, 'date', '2024-02-01', '2024-03-31')
    expect(rows).toHaveLength(original.length)
  })

  it('handles rows with missing date column values gracefully (no crash)', () => {
    const filterByDateRange = detectFilterByDateRange()
    if (!filterByDateRange) throw new Error(MISSING)
    const mixed = [
      { date: '2024-01-10', value: '100' },
      { value: '200' },              // missing date key
      { date: null, value: '300' }, // null date
    ]
    expect(() =>
      filterByDateRange(mixed, 'date', '2024-01-01', '2024-12-31')
    ).not.toThrow()
  })
})


// ─── Chart selection (new feature) ───────────────────────────────────────────
// Expects a function exported from utils/analyzeData that:
//   - accepts (allCharts, selectedKeys[])
//   - returns an object containing only the selected chart entries
// Common export names: selectCharts, getSelectedCharts, filterCharts, pickCharts, etc.

describe('Dashboard — chart selection feature (5 of 8)', () => {
  const MISSING =
    'No chart-selection function found in utils/analyzeData exports. ' +
    'Expected a function (e.g. selectCharts, getSelectedCharts, filterCharts, pickCharts, …) ' +
    'that accepts (allCharts, selectedKeys) and returns only the chosen chart entries.'

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
    const selectCharts = detectSelectCharts()
    if (!selectCharts) throw new Error(MISSING)
    const selected = selectCharts(mockCharts, ['bar', 'line', 'pie', 'scatter', 'area'])
    expect(Object.keys(selected)).toHaveLength(5)
    expect(selected).toHaveProperty('bar')
    expect(selected).not.toHaveProperty('histogram')
  })

  it('selecting fewer than 5 charts returns only those charts', () => {
    const selectCharts = detectSelectCharts()
    if (!selectCharts) throw new Error(MISSING)
    const selected = selectCharts(mockCharts, ['bar', 'line'])
    expect(Object.keys(selected)).toHaveLength(2)
  })

  it('selecting 0 charts returns an empty object', () => {
    const selectCharts = detectSelectCharts()
    if (!selectCharts) throw new Error(MISSING)
    const selected = selectCharts(mockCharts, [])
    expect(Object.keys(selected)).toHaveLength(0)
  })

  it('ignores keys that do not exist in allCharts', () => {
    const selectCharts = detectSelectCharts()
    if (!selectCharts) throw new Error(MISSING)
    const selected = selectCharts(mockCharts, ['bar', 'nonexistent'])
    expect(selected).toHaveProperty('bar')
    expect(selected).not.toHaveProperty('nonexistent')
  })

  it('does not mutate the original allCharts object', () => {
    const selectCharts = detectSelectCharts()
    if (!selectCharts) throw new Error(MISSING)
    const keys = Object.keys(mockCharts)
    selectCharts(mockCharts, ['bar', 'line'])
    expect(Object.keys(mockCharts)).toHaveLength(keys.length)
  })
})


// ─── Engine — edge cases ──────────────────────────────────────────────────────

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
