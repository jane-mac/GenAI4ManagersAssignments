function OrderConfirmation({ order, total, onClose }) {
  const orderNumber = Math.floor(Math.random() * 9000000 + 1000000)

  return (
    <div className="confirm-overlay">
      <div className="confirm-modal">
        <span className="confirm-icon">✅</span>
        <h2>Order Confirmed!</h2>
        <p>
          Thanks for your purchase. Order #{orderNumber} has been placed and will
          ship within 1–3 business days.
        </p>

        <div className="confirm-order-list">
          {order.map((item) => (
            <div className="confirm-order-item" key={item.name}>
              <span>
                {item.name}
                {(item.waist || item.length) && ` (W${item.waist} × L${item.length})`}
                {item.quantity > 1 && ` × ${item.quantity}`}
              </span>
              <span>${(item.value * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="confirm-total-row">
          <span>Total charged</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <button className="btn-continue" onClick={onClose}>
          Continue Shopping
        </button>
      </div>
    </div>
  )
}

export default OrderConfirmation
