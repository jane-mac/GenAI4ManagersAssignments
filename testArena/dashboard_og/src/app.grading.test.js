// Grading tests — hidden from students.
// Tests check FUNCTIONALITY, not specific function names.
// analyzeColumns and prepareXData must keep their names (they are in the base spec).
// New feature functions are discovered by name variants or behavioral probing.

import { describe, it, expect } from 'vitest'
import * as analyzeDataModule from './utils/analyzeData'
import { addItem, getTotal, getItemCount } from './engine'

const { analyzeColumns } = analyzeDataModule

// ─── Discovery helpers ────────────────────────────────────────────────────────

function findFn(mod, ...names) {
  for (const name of names) {
    if (typeof mod[name] === 'function') return mod[name]
  }
  return null
}

const CORE_ANALYZE = new Set([
  'analyzeColumns', 'prepareBarData', 'prepareLineData', 'preparePieData',
  'prepareScatterData', 'prepareAreaData',
])

// Find the date-range filter function: name variants, then behavioral probe.
function detectFilterByDateRange() {
  const fn = findFn(
    analyzeDataModule,
    'filterByDateRange', 'filterByDate', 'dateRangeFilter', 'filterDates',
    'filterRowsByDate', 'filterRowsByDateRange', 'dateFilter', 'filterData',
    'applyDateFilter', 'applyDateRange',
  )
  if (fn) return fn

  // Behavioral: a function that filters an array of rows to a date window.
  // Probe: 2-row dataset, filter to a range that should return exactly 1 row.
  const testRows = [{ date: '2024-01-10' }, { date: '2024-06-15' }]
  for (const [name, candidate] of Object.entries(analyzeDataModule)) {
    if (typeof candidate !== 'function' || CORE_ANALYZE.has(name)) continue
    try {
      const result = candidate(testRows, 'date', '2024-01-01', '2024-03-31')
      if (Array.isArray(result) && result.length === 1 && result[0].date === '2024-01-10') {
        return candidate
      }
    } catch {}
  }
  return null
}

// Find the chart-selection function: name variants, then behavioral probe.
function detectSelectCharts() {
  const fn = findFn(
    analyzeDataModule,
    'selectCharts', 'getSelectedCharts', 'filterCharts', 'chooseCharts',
    'getCharts', 'pickCharts', 'chartSelection', 'filterSelectedCharts',
  )
  if (fn) return fn

  // Behavioral: a function that takes (object, array-of-keys) and returns
  // a subset object containing only the requested keys.
  const mockCharts = { bar: {}, line: {}, pie: {} }
  for (const [name, candidate] of Object.entries(analyzeDataModule)) {
    if (typeof candidate !== 'function' || CORE_ANALYZE.has(name)) continue
    try {
      const result = candidate(mockCharts, ['bar', 'line'])
      if (
        result &&
        typeof result === 'object' &&
        !Array.isArray(result) &&
        Object.keys(result).length === 2 &&
        'bar' in result &&
        'line' in result &&
        !('pie' in result)
      ) {
        return candidate
      }
    } catch {}
  }
  return null
}

// Find the CSV-export builder function: name variants only (behavioral probe is fragile).
function detectBuildExportCsv() {
  return findFn(
    analyzeDataModule,
    'buildExportCsv', 'exportCsv', 'buildCsv', 'generateCsv',
    'createCsv', 'toCsv', 'exportToCsv', 'makeCsv',
  )
}

const filterByDateRange = detectFilterByDateRange()
const selectCharts      = detectSelectCharts()
const buildExportCsv    = detectBuildExportCsv()


// ─── Date-range filter (new feature) ─────────────────────────────────────────
// Expects a function exported from utils/analyzeData that:
//   - accepts (rows, dateColKey, startISO, endISO)
//   - returns only rows where the date falls within [start, end] inclusive
// Common export names: filterByDateRange, dateRangeFilter, filterDates, applyDateFilter, etc.

describe('Dashboard — date-range filter feature', () => {
  const MISSING = 'No date-range filter function found in utils/analyzeData exports. ' +
    'Expected an exported function (e.g. filterByDateRange, dateRangeFilter, filterDates, applyDateFilter, …) ' +
    'that accepts (rows, dateColumn, startDate, endDate) and returns the filtered rows.'

  const rows = [
    { date: '2024-01-10', value: '100' },
    { date: '2024-02-15', value: '200' },
    { date: '2024-03-20', value: '300' },
    { date: '2024-04-25', value: '400' },
  ]

  it('returns only rows within the date range (inclusive)', () => {
    if (!filterByDateRange) throw new Error(MISSING)
    const result = filterByDateRange(rows, 'date', '2024-02-01', '2024-03-31')
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.date)).toContain('2024-02-15')
    expect(result.map((r) => r.date)).toContain('2024-03-20')
  })

  it('includes the start date (inclusive lower bound)', () => {
    if (!filterByDateRange) throw new Error(MISSING)
    const result = filterByDateRange(rows, 'date', '2024-01-10', '2024-01-31')
    expect(result.map((r) => r.date)).toContain('2024-01-10')
  })

  it('includes the end date (inclusive upper bound)', () => {
    if (!filterByDateRange) throw new Error(MISSING)
    const result = filterByDateRange(rows, 'date', '2024-04-01', '2024-04-25')
    expect(result.map((r) => r.date)).toContain('2024-04-25')
  })

  it('returns all rows when the range covers all dates', () => {
    if (!filterByDateRange) throw new Error(MISSING)
    const result = filterByDateRange(rows, 'date', '2024-01-01', '2024-12-31')
    expect(result).toHaveLength(rows.length)
  })

  it('returns an empty array when no rows fall within the range', () => {
    if (!filterByDateRange) throw new Error(MISSING)
    const result = filterByDateRange(rows, 'date', '2025-01-01', '2025-12-31')
    expect(result).toHaveLength(0)
  })

  it('returns an empty array when input rows array is empty', () => {
    if (!filterByDateRange) throw new Error(MISSING)
    const result = filterByDateRange([], 'date', '2024-01-01', '2024-12-31')
    expect(result).toHaveLength(0)
  })

  it('does not mutate the original rows array', () => {
    if (!filterByDateRange) throw new Error(MISSING)
    const original = [...rows]
    filterByDateRange(rows, 'date', '2024-02-01', '2024-03-31')
    expect(rows).toHaveLength(original.length)
  })

  it('handles rows with missing date column values gracefully (no crash)', () => {
    if (!filterByDateRange) throw new Error(MISSING)
    const mixed = [
      { date: '2024-01-10', value: '100' },
      { value: '200' },             // missing date key
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
  const MISSING = 'No chart-selection function found in utils/analyzeData exports. ' +
    'Expected an exported function (e.g. selectCharts, getSelectedCharts, filterCharts, pickCharts, …) ' +
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
    if (!selectCharts) throw new Error(MISSING)
    const selected = selectCharts(mockCharts, ['bar', 'line', 'pie', 'scatter', 'area'])
    expect(Object.keys(selected)).toHaveLength(5)
    expect(selected).toHaveProperty('bar')
    expect(selected).not.toHaveProperty('histogram')
  })

  it('selecting fewer than 5 charts returns only those charts', () => {
    if (!selectCharts) throw new Error(MISSING)
    const selected = selectCharts(mockCharts, ['bar', 'line'])
    expect(Object.keys(selected)).toHaveLength(2)
  })

  it('selecting 0 charts returns an empty object', () => {
    if (!selectCharts) throw new Error(MISSING)
    const selected = selectCharts(mockCharts, [])
    expect(Object.keys(selected)).toHaveLength(0)
  })

  it('ignores keys that do not exist in allCharts', () => {
    if (!selectCharts) throw new Error(MISSING)
    const selected = selectCharts(mockCharts, ['bar', 'nonexistent'])
    expect(selected).toHaveProperty('bar')
    expect(selected).not.toHaveProperty('nonexistent')
  })

  it('does not mutate the original allCharts object', () => {
    if (!selectCharts) throw new Error(MISSING)
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
