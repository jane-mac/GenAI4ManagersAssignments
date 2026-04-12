// Public smoke tests — these are a subset of what the grader will run.
// Passing these does NOT guarantee a full score; the majority of tests are hidden.

import { describe, it, expect } from 'vitest'
import { addItem, getTotal, getItemCount } from './engine'
import { analyzeColumns } from './utils/analyzeData'

describe('Dashboard — public smoke tests', () => {
  it('analyzeColumns identifies numeric columns', () => {
    const headers = ['name', 'age', 'score']
    const rows = [
      { name: 'Alice', age: '30', score: '88' },
      { name: 'Bob',   age: '25', score: '92' },
    ]
    const result = analyzeColumns(headers, rows)
    const numericNames = result.numericCols.map((c) => c.name)
    expect(numericNames).toContain('age')
    expect(numericNames).toContain('score')
  })

  it('analyzeColumns correctly computes column mean', () => {
    const headers = ['value']
    const rows = [{ value: '10' }, { value: '20' }, { value: '30' }]
    const { numericCols } = analyzeColumns(headers, rows)
    expect(numericCols[0].mean).toBeCloseTo(20)
  })

  it('engine tracks numeric columns as catalog items', () => {
    let stats = []
    stats = addItem(stats, 'age', 27.5, 100)
    stats = addItem(stats, 'score', 90.1, 100)
    expect(getItemCount(stats)).toBe(200)   // 100 rows × 2 columns
    expect(getTotal(stats)).toBeCloseTo(27.5 * 100 + 90.1 * 100)
  })
})
