import { useState } from 'react'

const REVIEWS = [
  {
    author: 'Marcus T.',
    date: 'February 12, 2025',
    rating: 5,
    title: 'The perfect pair of jeans',
    body: "I've been wearing 501s for 20 years and these are just as good as ever. The medium stonewash is exactly what I wanted — not too light, not too dark. Fits true to size, broke in perfectly after the first wash.",
    tag: 'Verified Purchase',
  },
  {
    author: 'Priya S.',
    date: 'January 28, 2025',
    rating: 5,
    title: 'Classic for a reason',
    body: "Ordered W29 L30 and they fit perfectly right out of the box. The denim is thick and high-quality — you can tell these will last for years. The straight leg hits exactly right. Already ordered a second pair in dark rinse.",
    tag: 'Verified Purchase',
  },
  {
    author: 'Devon K.',
    date: 'December 5, 2024',
    rating: 4,
    title: 'Great jeans, size up on the waist',
    body: "Really love these but I'd recommend sizing up one waist size if you're in between — I'm usually a 32 but the 33 fits me much more comfortably. Denim quality is excellent and the wash looks great after several washes.",
    tag: 'Verified Purchase',
  },
  {
    author: 'Jordan A.',
    date: 'November 18, 2024',
    rating: 5,
    title: 'Timeless and built to last',
    body: "Bought these on a whim and I'm so glad I did. Been wearing them almost every day for two months and they're just getting better. The break-in period is worth it — they mold to you perfectly.",
    tag: 'Verified Purchase',
  },
]

const BREAKDOWN = [
  { stars: 5, pct: 74 },
  { stars: 4, pct: 16 },
  { stars: 3, pct: 6 },
  { stars: 2, pct: 3 },
  { stars: 1, pct: 1 },
]

function Stars({ n }) {
  return (
    <span className="stars">
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  )
}

function Reviews() {
  const [activeTab, setActiveTab] = useState('description')

  return (
    <div className="tabs-section">
      <div className="tab-bar">
        {[
          { id: 'description', label: 'Description' },
          { id: 'details',     label: 'Details & Care' },
          { id: 'reviews',     label: 'Reviews (247)' },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'description' && (
          <>
            <p>
              The 501® is the original blue jean — the one that started it all in 1873. An American
              icon with a straight leg and a button fly, it's the jean that defined what denim
              looks like. These are made to be worn, washed, and loved — built from heavyweight
              denim that only gets better with time.
            </p>
            <p>
              The Medium Stonewash gets its worn-in look the old-fashioned way: washed with actual
              stones for an authentic, lived-in finish. Styled high on the waist with a regular
              fit through the hip and thigh, straight leg all the way down.
            </p>
            <p>
              <strong>Fit:</strong> Regular waist, regular hip and thigh, straight leg.
              Sits at the natural waist.
            </p>
          </>
        )}

        {activeTab === 'details' && (
          <ul className="details-list">
            <li><strong>Fabric</strong><span>100% Cotton</span></li>
            <li><strong>Weight</strong><span>12 oz. denim</span></li>
            <li><strong>Fit</strong><span>Regular straight</span></li>
            <li><strong>Rise</strong><span>High rise</span></li>
            <li><strong>Closure</strong><span>Button fly</span></li>
            <li><strong>Pockets</strong><span>5-pocket styling</span></li>
            <li><strong>Wash</strong><span>Medium Stonewash</span></li>
            <li><strong>Made in</strong><span>Mexico</span></li>
            <li><strong>Wash care</strong><span>Machine wash cold</span></li>
            <li><strong>SKU</strong><span>0050100-0012</span></li>
          </ul>
        )}

        {activeTab === 'reviews' && (
          <>
            <div className="reviews-summary">
              <div>
                <div className="reviews-big-score">4.8</div>
                <Stars n={5} />
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                  247 reviews
                </div>
              </div>
              <div className="reviews-breakdown" style={{ flex: 1 }}>
                {BREAKDOWN.map((row) => (
                  <div className="rating-bar-row" key={row.stars}>
                    <span style={{ width: '12px' }}>{row.stars}</span>
                    <div className="rating-bar">
                      <div className="rating-bar-fill" style={{ width: `${row.pct}%` }} />
                    </div>
                    <span style={{ width: '28px', color: '#666' }}>{row.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {REVIEWS.map((r) => (
              <div className="review-card" key={r.author}>
                <div className="review-header">
                  <span className="review-author">{r.author}</span>
                  <span className="review-date">{r.date}</span>
                </div>
                <Stars n={r.rating} />
                <p className="review-title">{r.title}</p>
                <p className="review-body">{r.body}</p>
                <span className="review-tag">{r.tag}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default Reviews
