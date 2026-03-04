import { useState } from 'react'
import { addItem, removeItem, updateQuantity, getTotal, getItemCount } from './engine'
import Navbar from './components/Navbar'
import ImageCarousel from './components/ImageCarousel'
import ProductDetails from './components/ProductDetails'
import Reviews from './components/Reviews'
import RelatedProducts from './components/RelatedProducts'
import Cart from './components/Cart'
import OrderConfirmation from './components/OrderConfirmation'
import './App.css'

function App() {
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState([])
  const [colorImageIdx, setColorImageIdx] = useState(0)

  const handleAddToCart = (name, price, qty, waist, length) => {
    setCart((prev) => addItem(prev, name, price, qty, waist, length))
    setCartOpen(true)
  }

  const handleRemove = (name) => {
    setCart((prev) => removeItem(prev, name))
  }

  const handleUpdateQty = (name, qty) => {
    setCart((prev) => updateQuantity(prev, name, qty))
  }

  const handleCheckout = () => {
    setConfirmedOrder([...cart])
    setCart([])
    setCartOpen(false)
    setConfirmed(true)
  }

  return (
    <div className="page">
      <Navbar
        cartCount={getItemCount(cart)}
        onCartClick={() => setCartOpen(true)}
      />

      <main className="product-page">
        <div className="product-grid">
          <ImageCarousel colorImageIdx={colorImageIdx} />
          <ProductDetails onAddToCart={handleAddToCart} onColorChange={setColorImageIdx} />
        </div>
        <Reviews />
        <RelatedProducts onAddToCart={handleAddToCart} />
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span>© 2025 Levi Strauss &amp; Co. All rights reserved.</span>
          <span>Free shipping on orders over $50 · Free returns</span>
        </div>
      </footer>

      {cartOpen && (
        <Cart
          cart={cart}
          total={getTotal(cart)}
          onClose={() => setCartOpen(false)}
          onRemove={handleRemove}
          onUpdateQty={handleUpdateQty}
          onCheckout={handleCheckout}
        />
      )}

      {confirmed && (
        <OrderConfirmation
          order={confirmedOrder}
          total={getTotal(confirmedOrder)}
          onClose={() => setConfirmed(false)}
        />
      )}
    </div>
  )
}

export default App
