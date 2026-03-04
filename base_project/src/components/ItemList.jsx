function ItemList({ items, onRemove, onUpdateQuantity }) {
  if (items.length === 0) {
    return <p className="empty-state">No items yet. Add one above.</p>
  }

  return (
    <ul className="item-list">
      {items.map((item) => (
        <li key={item.name} className="item-row">
          <span className="item-name">{item.name}</span>
          <span className="item-value">{item.value}</span>
          <div className="item-quantity">
            <button onClick={() => onUpdateQuantity(item.name, item.quantity - 1)}>
              −
            </button>
            <span>{item.quantity}</span>
            <button onClick={() => onUpdateQuantity(item.name, item.quantity + 1)}>
              +
            </button>
          </div>
          <button className="remove-btn" onClick={() => onRemove(item.name)}>
            Remove
          </button>
        </li>
      ))}
    </ul>
  )
}

export default ItemList
