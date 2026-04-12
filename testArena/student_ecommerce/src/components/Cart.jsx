import { useState } from 'react'

function ShippingEstimator() {
  const [zip, setZip] = useState('')
  const getEstimate = (z) => {
    if (!/^\d{5}$/.test(z)) return null
    const first = parseInt(z[0])
    if (first <= 2) return '2-3 business days'
    if (first <= 5) return '3-4 business days'
    if (first <= 7) return '4-5 business days'
    return '5-6 business days'
  }
  const estimate = getEstimate(zip)
  return (
    <div className="shipping-estimator">
      <p><strong>Estimate Shipping</strong></p>
      <input
        type="text"
        placeholder="Enter zip code"
        value={zip}
        onChange={(e) => setZip(e.target.value)}
        maxLength={5}
      />
      {estimate && <p>Estimated delivery: {estimate}</p>}
      {zip.length === 5 && !estimate && <p>Please enter a valid zip code.</p>}
    </div>
  )
}

function Cart({ cart, total, onClose, onRemove, onUpdateQty, onCheckout }) {
  return (
    <div className="cart-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cart-drawer">
        <div className="cart-header">
          <h2>Your Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})</h2>
          <button className="cart-close" onClick={onClose} aria-label="Close cart">×</button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <p className="cart-empty">Your cart is empty.</p>
          ) : (
            cart.map((item) => (
              <div className="cart-item" key={item.name}>
                <div
                  className="cart-item-thumb"
                  style={{
                    background: 'linear-gradient(160deg, #1a3a7c 0%, #2d5bb9 100%)',
                    color: 'white',
                    fontSize: '2rem',
                  }}
                >
                  {item.name.includes('Jacket') ? '🧥' : item.name.includes('Tee') ? '👕' : '👖'}
                </div>
                <div className="cart-item-info">
                  <p className="cart-item-name">{item.name}</p>
                  {(item.waist || item.length) && (
                    <p className="cart-item-size">
                      Size: W{item.waist} × L{item.length}
                    </p>
                  )}
                  <p className="cart-item-price">${item.value.toFixed(2)} each</p>
                  <div className="cart-item-controls">
                    <div className="cart-qty-control">
                      <button onClick={() => onUpdateQty(item.name, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.name, item.quantity + 1)}>+</button>
                    </div>
                    <button className="cart-remove" onClick={() => onRemove(item.name)}>
                      Remove
                    </button>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                  ${(item.value * item.quantity).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
<ShippingEstimator />

        <div className="cart-footer">
          <div className="cart-total-row">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <p className="cart-subtotal-note">Shipping and taxes calculated at checkout</p>
          <button
            className="btn-checkout"
            onClick={onCheckout}
            disabled={cart.length === 0}
          >
            Checkout — ${total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Cart
