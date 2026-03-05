import { useState } from 'react'
import { addItem, removeItem, updateQuantity, getTotal, getItemCount } from './engine'
import { loadItems, saveItems } from './storage'
import ItemForm from './components/ItemForm'
import ItemList from './components/ItemList'
import Summary from './components/Summary'
import './App.css'

function App() {
  const [items, setItems] = useState(loadItems)

  const handleAdd = (name, value, quantity) => {
    setItems((prev) => saveItems(addItem(prev, name, value, quantity)))
  }

  const handleRemove = (name) => {
    setItems((prev) => saveItems(removeItem(prev, name)))
  }

  const handleUpdateQuantity = (name, quantity) => {
    setItems((prev) => saveItems(updateQuantity(prev, name, quantity)))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>The Catalog</h1>
      </header>
      <main className="app-main">
        <ItemForm onAdd={handleAdd} />
        <ItemList
          items={items}
          onRemove={handleRemove}
          onUpdateQuantity={handleUpdateQuantity}
        />
      </main>
      <Summary total={getTotal(items)} count={getItemCount(items)} />
    </div>
  )
}

export default App
