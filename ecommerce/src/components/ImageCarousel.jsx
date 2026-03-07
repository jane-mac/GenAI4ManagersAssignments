import { useState, useEffect } from 'react'

const IMAGES = [
  { bg: 'linear-gradient(160deg, #1a3a7c 0%, #2d5bb9 60%, #3d6ebf 100%)', label: 'Front View',       icon: '👖', badge: 'BESTSELLER' },
  { bg: 'linear-gradient(160deg, #12285c 0%, #1e4491 60%, #2a5cad 100%)', label: 'Back View',        icon: '👖', badge: null },
  { bg: 'linear-gradient(160deg, #0d1f4a 0%, #163580 60%, #1e4a9e 100%)', label: 'Button Fly Detail',icon: '🔍', badge: null },
  { bg: 'linear-gradient(160deg, #243b8c 0%, #3461c4 60%, #4278d4 100%)', label: 'Side Profile',     icon: '👖', badge: null },
  { bg: 'linear-gradient(160deg, #0a1a40 0%, #0f2860 60%, #163a80 100%)', label: 'Dark Rinse',       icon: '👖', badge: null },
  { bg: 'linear-gradient(160deg, #5a8fc4 0%, #7aadd8 60%, #9ec4e8 100%)', label: 'Light Wash',       icon: '👖', badge: null },
  { bg: 'linear-gradient(160deg, #2c4a8c 0%, #3d64b8 60%, #5580d0 100%)', label: 'Lifestyle Shot',   icon: '✨', badge: 'NEW' },
]

const VISIBLE = 3 

function ImageCarousel({ colorImageIdx = 0 }) {
  const [activeIdx,   setActiveIdx]   = useState(0)
  const [thumbOffset, setThumbOffset] = useState(0)

  const selectImage = (idx) => {
    setActiveIdx(idx)
    if (idx < thumbOffset) {
      setThumbOffset(idx)
    } else if (idx >= thumbOffset + VISIBLE) {
      setThumbOffset(idx - VISIBLE + 1)
    }
  }

  useEffect(() => { selectImage(colorImageIdx) }, [colorImageIdx])

  const prevMain  = () => selectImage((activeIdx - 1 + IMAGES.length) % IMAGES.length)
  const nextMain  = () => selectImage((activeIdx + 1) % IMAGES.length)
  const prevThumb = () => setThumbOffset((o) => Math.max(0, o - 1))
  const nextThumb = () => setThumbOffset((o) => Math.min(IMAGES.length - VISIBLE, o + 1))

  const canGoPrev = thumbOffset > 0
  const canGoNext = thumbOffset < IMAGES.length - VISIBLE

  return (
    <div className="carousel">
      {/* ── Main image ── */}
      <div className="carousel-main">
        <div
          style={{
            width: '100%', height: '100%',
            background: IMAGES[activeIdx].bg,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '1rem',
          }}
        >
          <span style={{ fontSize: '6rem' }}>{IMAGES[activeIdx].icon}</span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {IMAGES[activeIdx].label}
          </span>
        </div>

        {IMAGES[activeIdx].badge && (
          <span className="carousel-badge">{IMAGES[activeIdx].badge}</span>
        )}

        <button className="carousel-arrow prev" onClick={prevMain} aria-label="Previous image">‹</button>
        <button className="carousel-arrow next" onClick={nextMain} aria-label="Next image">›</button>

        <div className="carousel-dots">
          {IMAGES.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot${i === activeIdx ? ' active' : ''}`}
              onClick={() => selectImage(i)}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="carousel-thumb-row">
        <button
          className="carousel-thumb-arrow"
          onClick={prevThumb}
          disabled={!canGoPrev}
          aria-label="Previous thumbnails"
        >
          ‹
        </button>

        <div className="carousel-thumbs">
          {IMAGES.slice(thumbOffset, thumbOffset + VISIBLE).map((img, i) => {
            const realIdx = thumbOffset + i
            return (
              <button
                key={realIdx}
                className={`carousel-thumb${realIdx === activeIdx ? ' active' : ''}`}
                onClick={() => selectImage(realIdx)}
                aria-label={img.label}
              >
                <div style={{ width: '100%', height: '100%', background: img.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  {img.icon}
                </div>
              </button>
            )
          })}
        </div>

        <button
          className="carousel-thumb-arrow"
          onClick={nextThumb}
          disabled={!canGoNext}
          aria-label="Next thumbnails"
        >
          ›
        </button>
      </div>
    </div>
  )
}

export default ImageCarousel
