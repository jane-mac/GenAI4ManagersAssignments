import { useState } from 'react'

function ItemForm({ onAdd }) {
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [quantity, setQuantity] = useState(1)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || value === '') return
    onAdd(name.trim(), Number(value), Number(quantity))
    setName('')
    setValue('')
    setQuantity(1)
  }

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        min="0"
        step="any"
        required
      />
      <input
        type="number"
        placeholder="Qty"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        min="1"
      />
      <button type="submit">Add</button>
    </form>
  )
}

export default ItemForm
