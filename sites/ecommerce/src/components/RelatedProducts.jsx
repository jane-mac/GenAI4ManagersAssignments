const RELATED = [
  {
    name: "511™ Slim Fit Jeans",
    desc: "Slim through hip and thigh",
    price: 59.50,
    rating: "★★★★★",
    bg: "linear-gradient(160deg, #1e4a9e 0%, #3461c4 100%)",
    icon: "👖",
  },
  {
    name: "Trucker Jacket",
    desc: "The iconic denim jacket",
    price: 98.00,
    rating: "★★★★★",
    bg: "linear-gradient(160deg, #163580 0%, #2a5cad 100%)",
    icon: "🧥",
  },
  {
    name: "512™ Slim Taper Jeans",
    desc: "Slim hip, tapered leg",
    price: 69.50,
    rating: "★★★★☆",
    bg: "linear-gradient(160deg, #12285c 0%, #1e4491 100%)",
    icon: "👖",
  },
  {
    name: "Workwear Crewneck Tee",
    desc: "Heavyweight cotton essential",
    price: 34.50,
    rating: "★★★★★",
    bg: "linear-gradient(160deg, #2a2a2a 0%, #4a4a4a 100%)",
    icon: "👕",
  },
]

function RelatedProducts({ onAddToCart }) {
  return (
    <section className="related-section">
      <h2>Customers Also Liked</h2>
      <div className="related-grid">
        {RELATED.map((product) => (
          <div className="related-card" key={product.name}>
            <div className="related-img" style={{ background: product.bg }}>
              <span style={{ fontSize: '3.5rem' }}>{product.icon}</span>
            </div>
            <div className="related-info">
              <p className="related-name">{product.name}</p>
              <p className="related-desc">{product.desc}</p>
              <div className="related-stars">{product.rating}</div>
              <p className="related-price">${product.price.toFixed(2)}</p>
              <button
                className="btn-quick-add"
                onClick={() => onAddToCart(product.name, product.price, 1)}
              >
                Quick Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default RelatedProducts
