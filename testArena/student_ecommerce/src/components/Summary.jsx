function Summary({ total, count }) {
  return (
    <footer className="summary">
      <span>{count} {count === 1 ? 'item' : 'items'}</span>
      <span className="summary-total">Total: {total}</span>
    </footer>
  )
}

export default Summary
