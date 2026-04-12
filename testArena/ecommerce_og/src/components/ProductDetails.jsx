import { useState } from 'react'

const PRICE = 79.50

const COLORS = [
  { name: 'Medium Stonewash', hex: '#4a7fc1', imageIdx: 0 },
  { name: 'Dark Rinse',       hex: '#1a2f5a', imageIdx: 4 },
  { name: 'Light Wash',       hex: '#8ab0d4', imageIdx: 5 },
  { name: 'Black',            hex: '#1a1a1a', imageIdx: 0 },
]

const WAIST_SIZES  = [28, 29, 30, 31, 32, 33, 34, 36, 38]
const LENGTH_SIZES = [28, 30, 32, 34]

function ProductDetails({ onAddToCart, onColorChange }) {
  const [selectedColor,  setSelectedColor]  = useState(0)
  const [selectedWaist,  setSelectedWaist]  = useState(null)
  const [selectedLength, setSelectedLength] = useState(null)
  const [qty,            setQty]            = useState(1)
  const [sizeError,      setSizeError]      = useState(false)

  const handleAddToCart = () => {
    if (selectedWaist === null || selectedLength === null) {
      setSizeError(true)
      return
    }
    setSizeError(false)
    onAddToCart('501 Original Fit', PRICE, qty, selectedWaist, selectedLength)
    setSelectedWaist(null)
    setSelectedLength(null)
  }

  return (
    <div className="product-details">
      <p className="product-brand">Levi's®</p>
      <h1 className="product-name">501® Original Fit Jeans</h1>

      <div className="product-rating">
        <span className="stars">★★★★★</span>
        <span>4.8</span>
        <span className="rating-count">247 reviews</span>
      </div>

      <p className="product-price">${PRICE.toFixed(2)}</p>
      <p className="product-price-note">
        or 4 interest-free payments of ${(PRICE / 4).toFixed(2)} with{' '}
        <a href="#">Afterpay</a>
      </p>

      <hr className="divider" />

      {/* Color */}
      <p className="option-label">
        Color: <span>{COLORS[selectedColor].name}</span>
      </p>
      <div className="color-swatches">
        {COLORS.map((c, i) => (
          <button
            key={c.name}
            className={`color-swatch${i === selectedColor ? ' selected' : ''}`}
            style={{ background: c.hex }}
            onClick={() => { setSelectedColor(i); onColorChange(c.imageIdx) }}
            aria-label={c.name}
            title={c.name}
          />
        ))}
      </div>

      {/* Waist */}
      <p className="option-label">
        Waist: <span>{selectedWaist ? `W${selectedWaist}` : 'Select'}</span>
        <button className="size-guide-link">Size Guide</button>
      </p>
      <div className="size-grid">
        {WAIST_SIZES.map((w) => (
          <button
            key={w}
            className={`size-btn${selectedWaist === w ? ' selected' : ''}`}
            onClick={() => { setSelectedWaist(w); setSizeError(false) }}
          >
            W{w}
          </button>
        ))}
      </div>

      {/* Length */}
      <p className="option-label">
        Length: <span>{selectedLength ? `L${selectedLength}` : 'Select'}</span>
      </p>
      <div className="size-grid">
        {LENGTH_SIZES.map((l) => (
          <button
            key={l}
            className={`size-btn${selectedLength === l ? ' selected' : ''}`}
            onClick={() => { setSelectedLength(l); setSizeError(false) }}
          >
            L{l}
          </button>
        ))}
      </div>

      {sizeError && (
        <p className="size-error">Please select a waist and length before adding to cart.</p>
      )}

      {/* Quantity */}
      <div className="qty-row">
        <p className="option-label" style={{ margin: 0 }}>Qty:</p>
        <div className="qty-control">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span>{qty}</span>
          <button onClick={() => setQty((q) => q + 1)}>+</button>
        </div>
      </div>

      <button className="btn-add-to-cart" onClick={handleAddToCart}>
        Add to Cart
      </button>
      <button className="btn-wishlist">♡ Add to Wishlist</button>

      <div className="product-badges">
        <div className="badge-item"><span className="badge-icon">🚚</span> Free shipping over $50</div>
        <div className="badge-item"><span className="badge-icon">↩️</span> Free returns</div>
        <div className="badge-item"><span className="badge-icon">🔒</span> Secure checkout</div>
      </div>
    </div>
  )
}

export default ProductDetails
