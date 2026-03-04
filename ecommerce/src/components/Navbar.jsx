function Navbar({ cartCount, onCartClick }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-logo">LEVI'S<sup>®</sup></span>
        <div className="navbar-search">
          <input type="text" placeholder="Search jeans, jackets, tees…" readOnly />
          <button>🔍</button>
        </div>
        <div className="navbar-icons">
          <button className="navbar-icon-btn" aria-label="Wishlist">♡</button>
          <button className="navbar-icon-btn" onClick={onCartClick} aria-label="Cart">
            🛒
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
