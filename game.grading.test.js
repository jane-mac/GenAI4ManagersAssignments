// Grading tests — hidden from students.
// Tests check FUNCTIONALITY, not specific function names.
// Standard engine functions (addItem, removeItem, etc.) must keep those names.
// High-score storage functions are discovered by name variants or behavioral probing.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { addItem, removeItem, updateQuantity, getTotal, getItemCount, findItem } from './engine'
import * as storageModule from './storage'
import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

// ─── Discovery helpers ────────────────────────────────────────────────────────

function findFn(mod, ...names) {
  for (const name of names) {
    if (typeof mod[name] === 'function') return mod[name]
  }
  return null
}

// Find the load-scores function: name variants, then behavioral probe.
function detectLoadHighScores() {
  const fn = findFn(
    storageModule,
    'loadHighScores', 'getHighScores', 'getLeaderboard', 'fetchHighScores',
    'readHighScores', 'getScores', 'loadScores', 'loadLeaderboard',
  )
  if (fn) return fn

  // Behavioral: a zero-argument function that returns an array.
  for (const [, candidate] of Object.entries(storageModule)) {
    if (typeof candidate !== 'function') continue
    try {
      const result = candidate()
      if (Array.isArray(result)) return candidate
    } catch {}
  }
  return null
}

// Find the save-score function: name variants, then behavioral probe.
function detectSaveHighScore(loadFn) {
  const fn = findFn(
    storageModule,
    'saveHighScore', 'addHighScore', 'recordHighScore', 'storeHighScore',
    'saveScore', 'addScore', 'recordScore', 'persistHighScore',
  )
  if (fn) return fn

  if (!loadFn) return null

  // Behavioral: a 2-argument function whose call causes loadFn() to return
  // a longer array than before.
  for (const [, candidate] of Object.entries(storageModule)) {
    if (typeof candidate !== 'function' || candidate === loadFn) continue
    try {
      const before = loadFn().length
      candidate('TestPlayer', 999)
      const after = loadFn().length
      if (after > before) return candidate
    } catch {}
  }
  return null
}

const loadHighScores = detectLoadHighScores()
const saveHighScore  = detectSaveHighScore(loadHighScores)

// ─── Engine — edge cases ──────────────────────────────────────────────────────

describe('Game engine — edge cases', () => {
  it('getTotal returns 0 for an empty inventory', () => {
    expect(getTotal([])).toBe(0)
  })

  it('collecting 0 coins results in a score of 0', () => {
    const inv = addItem([], 'coin', 1, 0)
    expect(getTotal(inv)).toBe(0)
  })

  it('collecting a large number of coins accumulates correctly', () => {
    const inv = addItem([], 'coin', 1, 500)
    expect(getTotal(inv)).toBe(500)
  })

  it('collecting coins and stars together scores correctly', () => {
    let inv = addItem([], 'coin', 1, 10)
    inv = addItem(inv, 'star', 5, 3)
    expect(getTotal(inv)).toBe(25) // 10*1 + 3*5
  })

  it('adding the same collectible type twice stacks quantity', () => {
    let inv = addItem([], 'coin', 1, 3)
    inv = addItem(inv, 'coin', 1, 2)
    expect(findItem(inv, 'coin').quantity).toBe(5)
    expect(inv).toHaveLength(1)
  })

  it('findItem returns null for a collectible not yet picked up', () => {
    expect(findItem([], 'star')).toBeNull()
  })

  it('removeItem works for collectibles', () => {
    let inv = addItem([], 'coin', 1, 5)
    inv = removeItem(inv, 'coin')
    expect(inv).toHaveLength(0)
  })

  it('updateQuantity to 0 removes the collectible', () => {
    let inv = addItem([], 'coin', 1, 5)
    inv = updateQuantity(inv, 'coin', 0)
    expect(inv).toHaveLength(0)
  })

  it('updateQuantity to a negative number removes the collectible', () => {
    let inv = addItem([], 'coin', 1, 5)
    inv = updateQuantity(inv, 'coin', -1)
    expect(inv).toHaveLength(0)
  })

  it('getItemCount returns total number of all collectibles', () => {
    let inv = addItem([], 'coin', 1, 7)
    inv = addItem(inv, 'star', 5, 2)
    expect(getItemCount(inv)).toBe(9)
  })

  it('addItem does not mutate the original inventory', () => {
    const original = [{ name: 'coin', value: 1, quantity: 3 }]
    addItem(original, 'star', 5, 1)
    expect(original).toHaveLength(1)
  })
})

// ─── UI grading (RTL) — NEW FEATURES ─────────────────────────────────────────
//
// These tests grade the NEW features by what the user can observe and do.
// Implementation may live anywhere, but the UI must expose accessible DOM
// elements so the grader does not depend on canvas pixels.
//
// Required UI contract for grading:
// - Character select screen appears BEFORE play begins.
// - There are 2+ character options as accessible radios.
// - The game cannot start until a character is selected.
// - While playing, the current score is exposed in the DOM (not only canvas).
// - While the mushroom power-up is active, an indicator is exposed in the DOM.
//
// To keep grading deterministic across implementations, the submission MUST
// include test-only spawn controls while playing:
// - a button: role="button", name /spawn coin/i
// - a button: role="button", name /spawn mushroom/i
// These controls may be hidden in production builds but must exist in tests.

function getScoreElement() {
  // Preferred: a dedicated element for live score updates.
  // Accept any of these patterns to avoid coupling to exact markup.
  const candidates = [
    () => screen.getByTestId('score'),
    () => screen.getByRole('status', { name: /score/i }),
    () => screen.getByLabelText(/score/i),
    () => screen.getByText(/score\s*[:=]/i),
  ]
  for (const get of candidates) {
    try {
      return get()
    } catch {}
  }
  throw new Error(
    'Could not find a DOM score readout. Expose score in the DOM via one of: ' +
    '`data-testid="score"`, `role="status" aria-label="Score"`, or a visible text like "Score: 0".'
  )
}

function readScoreValue() {
  const el = getScoreElement()
  const text = el.textContent ?? ''
  const m = text.match(/(-?\d+)/)
  if (!m) {
    throw new Error(
      `Found a score element but could not parse a number from its text: "${text}". ` +
      'Render something like "Score: 12".'
    )
  }
  return Number(m[1])
}

function expectPowerUpIndicatorPresent() {
  // Prefer testid, otherwise accept several user-visible indicator strings.
  const candidates = [
    () => screen.getByTestId('powerup-indicator'),
    () => screen.getByText(/(×\s*2|2\s*x|double points|score multiplier)/i),
  ]
  for (const get of candidates) {
    try {
      const el = get()
      expect(el).toBeInTheDocument()
      return
    } catch {}
  }
  throw new Error(
    'Could not find a DOM power-up indicator. Expose an indicator while active via ' +
    '`data-testid="powerup-indicator"` or visible text like "×2" / "Double points".'
  )
}

function expectPowerUpIndicatorAbsent() {
  const byTestId = screen.queryByTestId('powerup-indicator')
  const byText = screen.queryByText(/(×\s*2|2\s*x|double points|score multiplier)/i)
  expect(byTestId || byText).toBeNull()
}

describe('Game UI — character selection (new feature)', () => {
  it('shows 2+ character options before play begins', async () => {
    const user = userEvent.setup()
    render(createElement(App))

    // Step 1: Some implementations gate character select behind a "Start Game" click.
    // Navigate there first if character options aren't immediately visible.
    {
      const charCandidates = screen.queryAllByRole('button')
        .filter(b => !/start game|play as/i.test(b.textContent ?? ''))
      if (charCandidates.length < 2) {
        const navBtn = screen.queryByRole('button', { name: /start game/i })
        if (navBtn) await user.click(navBtn)
      }
    }

    // Step 2: Accept radios (preferred) or any non-start/play buttons as character options.
    let options = screen.queryAllByRole('radio')
    if (options.length < 2) {
      options = screen.queryAllByRole('button')
        .filter(b => !/start game|play as/i.test(b.textContent ?? ''))
    }

    if (options.length < 2) {
      throw new Error(
        'Character selection screen missing. Expected 2+ character options BEFORE the game starts as either:\n' +
        '- radio inputs (role="radio"), or\n' +
        '- buttons that are not the Start Game / Play button.\n'
      )
    }

    // Step 3: Select a character and start the game.
    await user.click(options[0])
    const playBtn = screen.getByRole('button', { name: /start game|play as/i })
    await user.click(playBtn)

    // Verify we left the select screen.
    expect(screen.queryByRole('button', { name: /start game/i })).toBeNull()
  })
})

describe('Game UI — mushroom power-up (new feature)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('doubles points for 10 seconds (DOM score + DOM indicator)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(createElement(App))

    // Character select gate.
    let options = []
    try {
      options = screen.getAllByRole('radio')
    } catch {
      throw new Error(
        'Character selection screen missing. Expected 2+ character options exposed as accessible radios ' +
        'BEFORE the game starts (this is required for grading the power-up feature deterministically).'
      )
    }
    await user.click(options[0])
    await user.click(screen.getByRole('button', { name: /start game/i }))

    // Deterministic spawn controls (test-only contract).
    const spawnCoin = screen.getByRole('button', { name: /spawn coin/i })
    const spawnMushroom = screen.getByRole('button', { name: /spawn mushroom/i })

    // Baseline: coin gives +1.
    const before = readScoreValue()
    await user.click(spawnCoin)
    const afterCoin = readScoreValue()
    expect(afterCoin - before).toBe(1)

    // Activate power-up.
    await user.click(spawnMushroom)
    expectPowerUpIndicatorPresent()

    // During window: coin gives +2.
    const beforePowered = readScoreValue()
    await user.click(spawnCoin)
    const afterPoweredCoin = readScoreValue()
    expect(afterPoweredCoin - beforePowered).toBe(2)

    // After 10s: indicator disappears; coin gives +1 again.
    vi.advanceTimersByTime(10_000)
    expectPowerUpIndicatorAbsent()

    const beforeNormalAgain = readScoreValue()
    await user.click(spawnCoin)
    const afterNormalAgain = readScoreValue()
    expect(afterNormalAgain - beforeNormalAgain).toBe(1)
  })
})

