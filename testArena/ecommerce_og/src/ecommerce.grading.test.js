// Grading tests (RTL-first) for NEW FEATURES.
// Goal: validate user-visible behavior without dictating where implementation lives.

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import App from './App'

function normalizeText(s) {
  return (s ?? '').toString().replace(/\s+/g, ' ').trim()
}

function findCartDrawer() {
  // When open, cart includes an aria-label "Close cart" button.
  const close = screen.getByRole('button', { name: /close cart/i })
  return close.closest('.cart-drawer') ?? close.parentElement ?? document.body
}

function getSubtotalValue(cartDrawer) {
  const subtotalRow = within(cartDrawer).getByText(/subtotal/i).closest('.cart-total-row') ?? cartDrawer
  const text = normalizeText(subtotalRow.textContent)
  const match = text.match(/\$([0-9]+\.[0-9]{2})/)
  if (!match) throw new Error(`Could not parse subtotal from: "${text}"`)
  return Number(match[1])
}

async function addLightWashJeansQty2(user) {
  // Scope interactions to the Product Details panel to avoid collisions
  // with carousel thumbnails (which also use aria-label like "Light Wash").
  const detailsHeading = screen.getAllByRole('heading', { name: /501.*original fit jeans/i })[0]
  const details = detailsHeading.closest('.product-details') ?? detailsHeading.parentElement ?? document.body

  // Color: "Light Wash" swatch has aria-label set in ProductDetails.
  await user.click(within(details).getByRole('button', { name: /light wash/i }))

  // Size gates add-to-cart: pick any waist + length.
  await user.click(within(details).getByRole('button', { name: /^w32$/i }))
  await user.click(within(details).getByRole('button', { name: /^l32$/i }))

  // Qty: bump from 1 → 2 (the qty "+" is a literal "+" button inside product details).
  await user.click(within(details).getByRole('button', { name: '+' }))

  // Add to cart (this should open cart drawer).
  await user.click(within(details).getByRole('button', { name: /add to cart/i }))
}

async function addNonLightWashJeansQty2(user) {
  // with carousel thumbnails (which also use aria-label like "Light Wash").
  const detailsHeading = screen.getAllByRole('heading', { name: /501.*original fit jeans/i })[0]
  const details = detailsHeading.closest('.product-details') ?? detailsHeading.parentElement ?? document.body

  // Color: "Light Wash" swatch has aria-label set in ProductDetails.
  await user.click(within(details).getByRole('button', { name: /black/i }))

  // Size gates add-to-cart: pick any waist + length.
  await user.click(within(details).getByRole('button', { name: /^w32$/i }))
  await user.click(within(details).getByRole('button', { name: /^l32$/i }))

  // Qty: bump from 1 → 2 (the qty "+" is a literal "+" button inside product details).
  await user.click(within(details).getByRole('button', { name: '+' }))

  // Add to cart (this should open cart drawer).
  await user.click(within(details).getByRole('button', { name: /add to cart/i }))
}

function expectBeltPresentInCart() {
  const cart = findCartDrawer()
  const beltLabel = within(cart).getByText(/belt/i)
  expect(beltLabel).toBeInTheDocument()

  const beltRow = beltLabel.closest('.cart-item') ?? cart
  // Belt should be free. Accept either per-item price or line total.
  expect(normalizeText(beltRow.textContent)).toMatch(/\$0\.00\b/)
}

function expectBeltAbsentInCart() {
  const cart = findCartDrawer()
  expect(within(cart).queryByText(/belt/i)).toBeNull()
}

function findZipEstimator() {
  const zipInput =
    screen.queryByRole('textbox', { name: /zip/i }) ??
    screen.queryByPlaceholderText(/zip/i)

  if (!zipInput) {
    throw new Error(
      'Missing shipping estimator UI. Expected a textbox input labeled (or placeholdered) with "zip".',
    )
  }

  const root = zipInput.closest('form') ?? zipInput.closest('section') ?? zipInput.parentElement ?? document.body

  // Button is OPTIONAL: some implementations auto-calculate on input/blur.
  const button =
    within(root).queryByRole('button', {
      name: /(estimate|calculate|get).*(shipping|delivery)|shipping.*(estimate|calculate|get)/i,
    }) ??
    screen.queryByRole('button', {
      name: /(estimate|calculate|get).*(shipping|delivery)|shipping.*(estimate|calculate|get)/i,
    }) ??
    null

  return { zipInput, button, root }
}

beforeEach(() => {
  localStorage.clear()
})

describe('E-Commerce — belt promo feature (RTL)', () => {
  it('adds a free belt when user adds 2+ light wash jeans', async () => {
    const user = userEvent.setup()
    render(createElement(App))

    await addLightWashJeansQty2(user)

    const cart = findCartDrawer()
    const subtotalBefore = getSubtotalValue(cart)

    expectBeltPresentInCart()

    const subtotalAfter = getSubtotalValue(cart)
    // Belt is free; subtotal should not increase.
    expect(subtotalAfter).toBeCloseTo(subtotalBefore)
  })

  it('removes the belt if jeans quantity drops below 2', async () => {
    const user = userEvent.setup()
    render(createElement(App))

    await addLightWashJeansQty2(user)
    expectBeltPresentInCart()

    const cart = findCartDrawer()

    // Find a non-belt cart item row (the jeans line item) and click its "−" button once.
    const itemRows = within(cart).queryAllByText(/\$[0-9]+\.[0-9]{2} each/i)
      .map((el) => el.closest('.cart-item'))
      .filter(Boolean)

    const jeansRow =
      itemRows.find((row) => /501/i.test(normalizeText(row.textContent)) && !/belt/i.test(normalizeText(row.textContent))) ??
      itemRows.find((row) => !/belt/i.test(normalizeText(row.textContent)))

    if (!jeansRow) throw new Error('Could not locate a jeans cart item to decrement quantity.')

    await user.click(within(jeansRow).getByRole('button', { name: '−' }))

    expectBeltAbsentInCart()
  })

  it('does not add a belt when 2 jeans are non-lightwash', async () => {
    const user = userEvent.setup()
    render(createElement(App))

    await addNonLightWashJeansQty2(user)

    expectBeltAbsentInCart()
  })
})

describe('E-Commerce — shipping estimator feature (RTL)', () => {
  async function submitZip(user, zipInput, button, zip) {
    await user.clear(zipInput)
    await user.type(zipInput, zip)
    if (button) {
      await user.click(button)
    } else {
      await user.keyboard('{Enter}')
      await user.tab()
    }
  }

  function getEstimateSignature(root) {
    const estimateNode =
      within(root).queryByText(/\b\d+\s*[-–]\s*\d+\s*(business\s+)?(day|days)\b/i) ??
      within(root).queryByText(/\b\d+\s*(day|days)\b/i) ??
      within(root).queryByText(/\$[0-9]+(\.[0-9]{2})?/) ??
      within(root).queryByText(/\bestimat(e|ed)\b.*\b(shipping|delivery|arrival)\b/i)

    if (!estimateNode) return null

    const text = normalizeText(estimateNode.textContent)
    // Prefer extracting a concrete value from the estimate text if present.
    const range = text.match(/\b(\d+)\s*[-–]\s*(\d+)\s*(business\s+)?(day|days)\b/i)
    if (range) return `range:${range[1]}-${range[2]}`
    const days = text.match(/\b(\d+)\s*(day|days)\b/i)
    if (days) return `days:${days[1]}`
    const dollars = text.match(/\$([0-9]+(?:\.[0-9]{2})?)/)
    if (dollars) return `cost:${dollars[1]}`
    return `text:${text}`
  }

  it('shows a shipping estimate when user enters a valid zip code', async () => {
    const user = userEvent.setup()
    render(createElement(App))

    const { zipInput, button, root } = findZipEstimator()

    await submitZip(user, zipInput, button, '90210')

    // We accept many reasonable, user-visible estimate formats, e.g.
    // - "3 days"
    // - "5-6 business days"
    // - "Estimated delivery: 5–6 business days"
    // - "$7.99"
    const estimate =
      within(root).queryByText(/\b\d+\s*(day|days)\b/i) ??
      within(root).queryByText(/\b\d+\s*[-–]\s*\d+\s*(business\s+)?(day|days)\b/i) ??
      within(root).queryByText(/\bestimat(e|ed)\b.*\b(shipping|delivery|arrival)\b/i) ??
      within(root).queryByText(/\b(shipping|delivery)\b.*\bestimat(e|ed)\b/i) ??
      within(root).queryByText(/\$[0-9]+(\.[0-9]{2})?/)

    if (!estimate) {
      const snapshot = normalizeText(root.textContent).slice(0, 500)
      throw new Error(
        'After submitting zip code, no visible shipping estimate was found. ' +
          'Expected some user-visible estimate text (e.g. "3 days", "5-6 business days", "Estimated delivery: ...", or "$7.99"). ' +
          `Saw: "${snapshot}${snapshot.length >= 500 ? '…' : ''}"`,
      )
    }

    expect(estimate).toBeInTheDocument()
  })

  it('shows different shipping-time estimates for different zip regions', async () => {
    const user = userEvent.setup()
    render(createElement(App))

    const { zipInput, button, root } = findZipEstimator()

    await submitZip(user, zipInput, button, '10001') // Northeast (NYC)
    const eastEstimate = getEstimateSignature(root)

    await submitZip(user, zipInput, button, '90210') // West Coast (LA area)
    const westEstimate = getEstimateSignature(root)

    if (!eastEstimate || !westEstimate) {
      throw new Error(
        'Could not find visible estimate text for both zip codes. ' +
        'Expected estimate output for each submitted zip to compare regional changes.',
      )
    }

    expect(eastEstimate).not.toBe(westEstimate)
  })

  it('handles invalid zip codes without crashing and shows an invalid/error state', async () => {
    const user = userEvent.setup()
    render(createElement(App))

    const { zipInput, button, root } = findZipEstimator()

    await submitZip(user, zipInput, button, 'abc')

    const invalidPatterns = [
      /invalid|enter|zip|required|not found|try again/i,
      /invalid zip code/i,
      /please enter (a )?valid (zip|zip code)/i,
      /\bvalid\b.*\b(zip|zip code)\b/i,
      /\b(zip|zip code)\b.*\bvalid\b/i,
      /zip code is not valid/i,
      /zip code is not valid for shipping/i,
    ]

    const invalid =
      invalidPatterns.map((re) => within(root).queryByText(re)).find(Boolean) ??
      invalidPatterns.map((re) => screen.queryByText(re)).find(Boolean)
    expect(invalid).not.toBeNull()
  })

  it('handles malicious injection-like zip input safely', async () => {
    const user = userEvent.setup()
    render(createElement(App))

    const { zipInput, button, root } = findZipEstimator()
    const payload = "'; DROP TABLE zips; <script>alert(1)</script> --"

    await submitZip(user, zipInput, button, payload)

    // App should not crash and should surface an invalid/error-like response.
    const suspiciousScriptNode = within(root).queryByText(/<script>|alert\(1\)|drop table/i)
    expect(suspiciousScriptNode).toBeNull()

    const invalidPatterns = [
      /invalid|enter|zip|required|not found|try again/i,
      /please enter (a )?valid (zip|zip code)/i,
      /\bvalid\b.*\b(zip|zip code)\b/i,
      /\b(zip|zip code)\b.*\bvalid\b/i,
    ]

    const invalid =
      invalidPatterns.map((re) => within(root).queryByText(re)).find(Boolean) ??
      invalidPatterns.map((re) => screen.queryByText(re)).find(Boolean)
    expect(invalid).not.toBeNull()
  })
})

