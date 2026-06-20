// Grading tests (RTL-first) for NEW FEATURES.
// Goal: validate user-visible behavior without dictating where implementation lives.

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import App from './App'


// Grading tests — hidden from students.
// Tests check FUNCTIONALITY, not specific function names.
// Standard engine functions (addItem, removeItem, etc.) must keep those names.
// New feature functions are discovered by name variants or behavioral probing.

import { describe, it, expect } from 'vitest'
import { addItem, getTotal, updateQuantity, getItemCount, findItem, removeItem } from './engine'

// ─── Engine — bug-fix confirmation ───────────────────────────────────────────

describe('E-Commerce engine — getTotal bug fix', () => {
  it('multiplies price × quantity (not price + quantity)', () => {
    const cart = addItem([], '501 Original Fit', 79.5, 3)
    expect(getTotal(cart)).toBe(238.5)
  })

  it('returns 0 for an empty cart', () => {
    expect(getTotal([])).toBe(0)
  })

  it('handles floating-point prices across multiple items', () => {
    let cart = addItem([], '501 Original Fit', 59.99, 2)
    cart = addItem(cart, '505 Regular Fit', 69.99, 1)
    expect(getTotal(cart)).toBeCloseTo(189.97)
  })
})


// ─── Engine — edge cases ──────────────────────────────────────────────────────

describe('E-Commerce engine — edge cases', () => {
  it('updateQuantity to 0 removes the item from the cart', () => {
    let cart = addItem([], '501 Original Fit', 79.5, 2)
    cart = updateQuantity(cart, '501 Original Fit', 0)
    expect(cart).toHaveLength(0)
  })

  it('updateQuantity with a negative number removes the item', () => {
    let cart = addItem([], '501 Original Fit', 79.5, 2)
    cart = updateQuantity(cart, '501 Original Fit', -5)
    expect(cart).toHaveLength(0)
  })

  it('updateQuantity on a non-existent item leaves the cart unchanged', () => {
    const cart = addItem([], '501 Original Fit', 79.5, 1)
    const result = updateQuantity(cart, 'Phantom Item', 3)
    expect(result).toHaveLength(1)
  })

  it('addItem stacks quantity when the same product is added twice', () => {
    let cart = addItem([], '501 Original Fit', 79.5, 1)
    cart = addItem(cart, '501 Original Fit', 79.5, 1)
    expect(cart).toHaveLength(1)
    expect(cart[0].quantity).toBe(2)
  })

  it('addItem is case-insensitive when matching existing items', () => {
    let cart = addItem([], '501 Original Fit', 79.5, 1)
    cart = addItem(cart, '501 original fit', 79.5, 1)
    expect(cart).toHaveLength(1)
    expect(cart[0].quantity).toBe(2)
  })

  it('removeItem is case-insensitive', () => {
    let cart = addItem([], '501 Original Fit', 79.5, 2)
    cart = removeItem(cart, '501 original fit')
    expect(cart).toHaveLength(0)
  })

  it('findItem returns null for a missing item', () => {
    const cart = addItem([], '501 Original Fit', 79.5, 1)
    expect(findItem(cart, 'does not exist')).toBeNull()
  })

  it('findItem is case-insensitive', () => {
    const cart = addItem([], '501 Original Fit', 79.5, 1)
    expect(findItem(cart, '501 ORIGINAL FIT')).not.toBeNull()
  })

  it('getItemCount sums quantities across all items', () => {
    let cart = addItem([], '501 Original Fit', 79.5, 2)
    cart = addItem(cart, '505 Regular Fit', 69.5, 3)
    expect(getItemCount(cart)).toBe(5)
  })

  it('getItemCount returns 0 for an empty cart', () => {
    expect(getItemCount([])).toBe(0)
  })

  it('handles very large quantities without incorrect overflow', () => {
    const cart = addItem([], '501 Original Fit', 79.5, 10000)
    expect(getItemCount(cart)).toBe(10000)
    expect(getTotal(cart)).toBeCloseTo(795000)
  })

  it('stores a malicious HTML string as a name without crashing', () => {
    const xss = '<script>alert("xss")</script>'
    const cart = addItem([], xss, 10, 1)
    expect(cart).toHaveLength(1)
    expect(getTotal(cart)).toBe(10)
  })

  it('addItem does not mutate the original cart array', () => {
    const original = [{ name: '501 Original Fit', value: 79.5, quantity: 1 }]
    addItem(original, '505 Regular Fit', 69.5, 1)
    expect(original).toHaveLength(1)
  })

  it('removeItem does not mutate the original cart array', () => {
    const original = [{ name: '501 Original Fit', value: 79.5, quantity: 1 }]
    removeItem(original, '501 Original Fit')
    expect(original).toHaveLength(1)
  })
})



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
}

function expectBeltAbsentInCart() {
  const cart = findCartDrawer()
  expect(within(cart).queryAllByText(/belt/i).find(Boolean) ?? null).toBeNull()
}

 const invalidPatterns = [
    /invalid|enter|zip|required|not found|try again/i,
    /invalid zip code/i,
    /please enter (a )?valid (zip|zip code)/i,
    /\bvalid\b.*\b(zip|zip code)\b/i,
    /\b(zip|zip code)\b.*\bvalid\b/i,
    /zip code is not valid/i,
    /zip code is not valid for shipping/i,
  ]

async function navigateToZipPage(user) {
  // If the zip input is already visible, no navigation needed.
  const existingZip =
    screen.queryByRole('textbox', { name: /zip/i }) ??
    screen.queryByPlaceholderText(/zip/i)
  if (existingZip) return

  // Some students put the estimator on a second "page" of the cart drawer
  // behind a proceed/next/continue/checkout button. Click it if present.
  const cart = findCartDrawer()
  const proceedBtn =
    within(cart).queryByRole('button', {
      name: /proceed|next|continue|checkout/i,
    }) ??
    screen.queryByRole('button', {
      name: /proceed|next|continue|checkout/i,
    }) ??
    null

  if (proceedBtn) {
    await user.click(proceedBtn)
  }
  // findZipEstimator() will throw its own error if still not found.
}

function findZipEstimator() {
  // 1. Try explicit zip-labeled input.
  let zipInput =
    screen.queryByRole('textbox', { name: /zip/i }) ??
    screen.queryByPlaceholderText(/zip|postal/i)

  // 2. Broaden to placeholders like "e.g. 10001" or any 5-digit hint.
  if (!zipInput) {
    zipInput = screen.queryByPlaceholderText(/e\.g\.|postal|\d{5}/i)
  }

  // 3. Broadest fallback: find any textbox inside a container whose heading
  //    or label contains "shipping" or "estimate".
  if (!zipInput) {
    const shippingHeading = screen.queryAllByText(
      /shipping estimate|estimate.*shipping|estimate.*delivery|delivery.*estimate/i,
    ).find(Boolean)
    if (shippingHeading) {
      const container =
        shippingHeading.closest('.cart-drawer') ??
        shippingHeading.closest('section') ??
        shippingHeading.parentElement
      if (container) {
        zipInput = container.querySelector('input[type="text"], input:not([type])') ?? null
      }
    }
  }

  if (!zipInput) {
    throw new Error(
      'Missing shipping estimator UI. Expected a textbox input for zip/postal code ' +
      '(labeled "zip", placeholder containing "zip" / "e.g." / 5-digit hint, or ' +
      'inside a container headed "Shipping Estimate").',
    )
  }

  const root = zipInput.closest('form') ?? zipInput.closest('section') ?? zipInput.closest('.cart-drawer') ?? zipInput.parentElement ?? document.body

  // Button is OPTIONAL: some implementations auto-calculate on input/blur.
  // Accept standalone "Estimate" / "Calculate" buttons scoped to root, in
  // addition to compound phrases like "Estimate Shipping".
  const button =
    within(root).queryByRole('button', {
      name: /(estimate|calculate|get).*(shipping|delivery|zip)|shipping.*(estimate|calculate|get)|\bestimate\b|\bcalculate\b/i,
    }) ??
    screen.queryByRole('button', {
      name: /(estimate|calculate|get).*(shipping|delivery|zip)|shipping.*(estimate|calculate|get)/i,
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
      within(root).queryAllByText(/\b\d+\s*[-–]\s*\d+\s*(business\s+)?(day|days)\b/i).find(Boolean) ??
      within(root).queryAllByText(/\b\d+\s*(day|days)\b/i).find(Boolean) ??
      within(root).queryAllByText(/\$[0-9]+(\.[0-9]{2})?/).find(Boolean) ??
      within(root).queryAllByText(/\bestimat(e|ed)\b.*\b(shipping|delivery|arrival)\b/i).find(Boolean)

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
    await addLightWashJeansQty2(user)
    const cart = findCartDrawer()

    await navigateToZipPage(user)
    const { zipInput, button, root } = findZipEstimator()

    await submitZip(user, zipInput, button, '90210')

    // We accept many reasonable, user-visible estimate formats, e.g.
    // - "3 days"
    // - "5-6 business days"
    // - "Estimated delivery: 5–6 business days"
    // - "$7.99"
    const estimate =
      within(root).queryAllByText(/\b\d+\s*(day|days)\b/i).find(Boolean) ??
      within(root).queryAllByText(/\b\d+\s*[-–]\s*\d+\s*(business\s+)?(day|days)\b/i).find(Boolean) ??
      within(root).queryAllByText(/\bestimat(e|ed)\b.*\b(shipping|delivery|arrival)\b/i).find(Boolean) ??
      within(root).queryAllByText(/\b(shipping|delivery)\b.*\bestimat(e|ed)\b/i).find(Boolean) ??
      within(root).queryAllByText(/\$[0-9]+(\.[0-9]{2})?/).find(Boolean)

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
    await addLightWashJeansQty2(user)
    const cart = findCartDrawer()

    await navigateToZipPage(user)
    const { zipInput, button, root } = findZipEstimator()

    await submitZip(user, zipInput, button, '10001') // Northeast (NYC)
    const eastEstimate = getEstimateSignature(root)

    await submitZip(user, zipInput, button, '00001')
    const estimate1 = getEstimateSignature(root)

    await submitZip(user, zipInput, button, '99999')
    const estimate2 = getEstimateSignature(root)

    await submitZip(user, zipInput, button, '22222')
    const estimate3 = getEstimateSignature(root)

    await submitZip(user, zipInput, button, '02139') // Cambridge
    const estimate4 = getEstimateSignature(root)

    await submitZip(user, zipInput, button, '90210') // West Coast (LA area)
    const westEstimate = getEstimateSignature(root)

    if (!eastEstimate || !westEstimate || !estimate1 || !estimate2 || !estimate3 || !estimate4) {
      throw new Error(
        'Could not find visible estimate text for all zip codes. ' +
        'Expected estimate output for each submitted zip to compare regional changes.',
      )
    }

    expect(new Set([eastEstimate, estimate1, estimate2, estimate3, estimate4, westEstimate]).size).not.toBe(1);

    // allSame = if (eastEstimate === estimate1 && estimate1 === estimate2 && estimate2 === estimate3 && estimate3 === estimate4 && estimate4 == westEstimate) {
    //   true
    // } else {false}
    // expect(allSame).toBe(false)
  })

  it('handles invalid zip codes without crashing and shows an invalid/error state', async () => {
    const user = userEvent.setup()

    render(createElement(App))
    await addLightWashJeansQty2(user)
    const cart = findCartDrawer()

    await navigateToZipPage(user)
    const { zipInput, button, root } = findZipEstimator()

    await submitZip(user, zipInput, button, 'abcde')

    const invalid =
      invalidPatterns.flatMap((re) => within(root).queryAllByText(re)).find(Boolean) ??
      invalidPatterns.flatMap((re) => screen.queryAllByText(re)).find(Boolean)
    expect(invalid).not.toBeNull()
  })

  it('handles malicious injection-like zip input safely', async () => {
    const user = userEvent.setup()
    render(createElement(App))
    await addLightWashJeansQty2(user)
    const cart = findCartDrawer()

    await navigateToZipPage(user)
    const { zipInput, button, root } = findZipEstimator()
    const payload = "'; DROP TABLE zips; <script>alert(1)</script> --"

    await submitZip(user, zipInput, button, payload)

    // App should not crash and should surface an invalid/error-like response.
    const suspiciousScriptNode = within(root).queryAllByText(/<script>|alert\(1\)|drop table/i).find(Boolean) ?? null
    expect(suspiciousScriptNode).toBeNull()

    const invalid =
      invalidPatterns.flatMap((re) => within(root).queryAllByText(re)).find(Boolean) ??
      invalidPatterns.flatMap((re) => screen.queryAllByText(re)).find(Boolean)
    expect(invalid).not.toBeNull()
  })
})

