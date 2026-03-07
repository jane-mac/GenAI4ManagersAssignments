// Public smoke tests — these are a subset of what the grader will run.
// Passing these does NOT guarantee a full score; the majority of tests are hidden.

import { describe, it, expect } from 'vitest'
import { addItem, getTotal, getItemCount, findItem } from './engine'

describe('Game — public smoke tests', () => {
  it('collecting a coin adds 1 point to the score', () => {
    const inventory = addItem([], 'coin', 1, 1)
    expect(getTotal(inventory)).toBe(1)
  })

  it('collecting a star adds 5 points to the score', () => {
    const inventory = addItem([], 'star', 5, 1)
    expect(getTotal(inventory)).toBe(5)
  })

  it('collecting multiple coins accumulates correctly', () => {
    let inv = addItem([], 'coin', 1, 1)
    inv = addItem(inv, 'coin', 1, 1)
    inv = addItem(inv, 'coin', 1, 1)
    expect(getTotal(inv)).toBe(3)
    expect(findItem(inv, 'coin').quantity).toBe(3)
  })

  it('mixed coins and stars total correctly', () => {
    let inv = addItem([], 'coin', 1, 3)
    inv = addItem(inv, 'star', 5, 2)
    expect(getTotal(inv)).toBe(13)
  })

  it('getItemCount returns total number of collectibles', () => {
    let inv = addItem([], 'coin', 1, 4)
    inv = addItem(inv, 'star', 5, 1)
    expect(getItemCount(inv)).toBe(5)
  })
})
