// Dashboard grading tests — hidden from students.
// Tests check FUNCTIONALITY, not specific function names.
// analyzeColumns must keep its name (base spec requirement).
// New feature functions are discovered by name variants or behavioral probing.
// Bug fixes are tested through rendered UI (RTL) so implementation details don't matter.

import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import App from './App'
import Papa from 'papaparse'
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


// ─── Chart-navigation helpers ─────────────────────────────────────────────────

const CONTINUE_PATTERN = /continue|view dashboard|dashboard|\bgo\b|confirm|apply|done|show charts/i

function isOnDashboard() {
  return (
    document.querySelector('.chart-grid') != null ||
    screen.queryAllByPlaceholderText(/filter columns/i).find(Boolean) != null
  )
}

function hasChartSelectionUI() {
  const checkboxes    = screen.queryAllByRole('checkbox')
  const options       = screen.queryAllByRole('option')
  const listbox       = screen.queryAllByRole('listbox').find(Boolean)
  const buttons       = screen.queryAllByRole('button')
  const gridcells     = screen.queryAllByRole('gridcell')
  const pickerOptions = document.querySelectorAll('.picker-option')
  // Filter out "continue/confirm" buttons — those aren't chart-type selectors.
  const chartButtons  = buttons.filter(b => !CONTINUE_PATTERN.test(b.textContent))
  return (
    checkboxes.length > 0 || options.length > 0 || listbox != null ||
    chartButtons.length > 1 || gridcells.length > 0 || pickerOptions.length > 0
  )
}

async function navigateChartSelection(user) {
  const checkboxes    = screen.queryAllByRole('checkbox')
  const options       = screen.queryAllByRole('option')
  const buttons       = screen.queryAllByRole('button')
  const gridcells     = screen.queryAllByRole('gridcell')
  const pickerOptions = document.querySelectorAll('.picker-option')

  if (checkboxes.length > 0) {
    const unchecked = checkboxes.filter(cb => !cb.checked).slice(0, 5)
    for (const cb of unchecked) await user.click(cb)
  } else if (options.length > 0) {
    const unselected = options.filter(o => !o.selected).slice(0, 5)
    for (const o of unselected) await user.click(o)
  } else if (pickerOptions.length > 0) {
    const unselected = [...pickerOptions].filter(opt => !opt.classList.contains('selected') && !opt.disabled)
    for (const opt of unselected.slice(0, 5)) await user.click(opt)
  } else if (gridcells.length > 0) {
    for (const cell of gridcells.slice(0, 5)) await user.click(cell)
  } else {
    const chartButtons = buttons.filter(b => !CONTINUE_PATTERN.test(b.textContent)).slice(0, 5)
    for (const b of chartButtons) await user.click(b)
  }

  const continueBtn = screen.queryAllByRole('button', { name: CONTINUE_PATTERN }).find(Boolean)
  if (continueBtn) await user.click(continueBtn)
}

// ─── Dark mode bug fix (RTL) ──────────────────────────────────────────────────
// Bug: toggleDarkMode() also called setColumnFilter(''), wiping the filter value.
// Fix: toggling dark mode must NOT reset the column filter.
async function getToDashboard() {
    const user = userEvent.setup()
    render(createElement(App))

    // Mock PapaParse so the upload completes immediately with predictable data,
    // avoiding FileReader async behaviour in jsdom.
    vi.spyOn(Papa, 'parse').mockImplementation((_file, options) => {
      options.complete({
        data: [
          { food: 'Apple',  calories: '95',  protein: '0.5', fat: '0.3' },
          { food: 'Banana', calories: '105', protein: '1.3', fat: '0.4' },
          { food: 'Carrot', calories: '41',  protein: '0.9', fat: '0.2' },
        ],
        meta: { fields: ['food', 'calories', 'protein', 'fat'] },
      })
    })

    // Upload the CSV via the hidden file input.
    const fileInput = document.querySelector('input[type="file"]')
    const csvFile = new File(
      ['food,calories,protein,fat\nApple,95,0.5,0.3'],
      'calorie_efficiency_dataset.csv',
      { type: 'text/csv' },
    )
    await user.upload(fileInput, csvFile)

    // Wait for the app to react: either a chart-selection UI appears first,
    // or the app goes directly to the dashboard (preset charts + change button).
    await waitFor(() => {
      if (!isOnDashboard() && !hasChartSelectionUI()) {
        throw new Error('Expected dashboard view or chart-selection UI after CSV upload')
      }
    })

    // If a chart-selection step appeared, complete it to reach the dashboard.
    if (!isOnDashboard()) {
      await navigateChartSelection(user)
      await waitFor(() => { expect(isOnDashboard()).toBe(true) })
    }

    return user
}



describe('Dashboard — dark mode does not clear column filter (bug fix)', () => {
  it('preserves the filter value when dark mode is toggled on', async () => {
    const user = await getToDashboard()

    // Filter input is visible once dashboard data is loaded from localStorage.
    const filterInput = screen.getByPlaceholderText(/filter columns/i)
    await user.type(filterInput, 'score')
    expect(filterInput.value).toBe('score')

    const darkModeBtn = screen.getByRole('button', { name: /dark mode/i })
    await user.click(darkModeBtn)

    // Buggy code resets this to ''; fixed code leaves it as 'score'.
    expect(filterInput.value).toBe('score')
  })
})


describe('Dashboard — Chart selections', () => {
  it('after importing a CSV, user can select or change the 5 charts displayed', async () => {
    const user = userEvent.setup()
    render(createElement(App))

    vi.spyOn(Papa, 'parse').mockImplementation((_file, options) => {
      options.complete({
        data: [
          { food: 'Apple',  calories: '95',  protein: '0.5', fat: '0.3' },
          { food: 'Banana', calories: '105', protein: '1.3', fat: '0.4' },
          { food: 'Carrot', calories: '41',  protein: '0.9', fat: '0.2' },
        ],
        meta: { fields: ['food', 'calories', 'protein', 'fat'] },
      })
    })

    const fileInput = document.querySelector('input[type="file"]')
    const csvFile = new File(
      ['food,calories,protein,fat\nApple,95,0.5,0.3'],
      'calorie_efficiency_dataset.csv',
      { type: 'text/csv' },
    )
    await user.upload(fileInput, csvFile)

    // Two valid implementations:
    // A) A chart-selection screen appears before the dashboard (user picks then confirms).
    // B) The dashboard appears immediately with preset charts and a button to change them.
    await waitFor(() => {
      if (!isOnDashboard() && !hasChartSelectionUI()) {
        throw new Error(
          'After uploading a CSV, expected either a chart-selection UI ' +
          '(checkboxes, listbox, toggle buttons, picker grid, etc.) or the dashboard ' +
          'with a button to choose/change charts. Neither was found.',
        )
      }
    })

    if (isOnDashboard()) {
      // Implementation B: dashboard shown immediately — verify a change-charts button exists.
      const changeChartsBtn = screen.queryAllByRole('button').find(b => {
        const text = (b.textContent + ' ' + (b.getAttribute('aria-label') || '')).toLowerCase()
        return /chart/i.test(text) && /change|select|choose|customize|edit|settings|configure|picker/i.test(text)
      })
      expect(
        changeChartsBtn,
        'Dashboard shown directly after CSV upload — expected a button to choose or change charts (e.g. "Change Charts", "Select Charts", "Chart Settings")',
      ).toBeTruthy()
    } else {
      // Implementation A: chart-selection screen appeared — that satisfies the requirement.
      expect(hasChartSelectionUI()).toBe(true)
    }
  })
})


// ─── Export CSV bug fix ───────────────────────────────────────────────────────
// Bug: handleExport only exported dashData.headers.join(',') — no data rows.
// Fix: the export must include actual data row values, not just column headers.
// Tests both the UI behaviour (click Export → what's in the blob) and any
// separately-exported helper function in utils/analyzeData.

describe('Dashboard — export CSV includes data rows (bug fix)', () => {
  it('clicking Export CSV produces a blob that contains data row values', async () => {
      let capturedBlob = null

  // Must stub BEFORE rendering so the component closes over the stubbed version.
  // Use Object.defineProperty because jsdom may make these non-writable, causing
  // direct assignment to silently fail and produce an unhandled error.
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true, configurable: true,
    value: vi.fn((blob) => { capturedBlob = blob; return 'blob:fake' }),
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true, configurable: true,
    value: vi.fn(),
  })

  const user = await getToDashboard() // render happens AFTER stubs are in place

  const exportBtn = screen.getByRole('button', { name: /export csv/i })
  await user.click(exportBtn)

  expect(capturedBlob).not.toBeNull()

  const text = await capturedBlob.text()

  const rows = text.trim().split('\n')

  expect(rows[0]).toBe('food,calories,protein,fat')
  expect(rows[1]).toBe('Apple,95,0.5,0.3')
  })

})


describe('Dashboard engine — data range filter', () => {
  it('Filter by column should exist and work', async () => {
    const user = await getToDashboard()

    // Filter input is visible once dashboard data is loaded from localStorage.
    const filterInput = screen.getByPlaceholderText(/filter columns/i)
    await user.type(filterInput, 'calories')
    expect(filterInput.value).toBe('calories')

    // The 'Overall Avg Value' stat card should now reflect only the calories column.
    // Mock data: [95, 105, 41] → mean = 80.33
    const avgCard = screen.getByText('Overall Avg Value').closest('.stat-card')
    expect(within(avgCard).getByText('80.33')).toBeInTheDocument()
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
