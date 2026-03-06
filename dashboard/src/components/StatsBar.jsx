import { getItemCount, getTotal, findItem } from '../engine'

// Each numeric column is stored as a catalog item:
//   value    = column mean
//   quantity = non-null row count
// So getItemCount(stats) = total numeric data points
// And getTotal(stats) / getItemCount(stats) = grand mean across all numeric columns

function fmt(n) {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
      <span className="stat-tooltip">{label}: {value}</span>
    </div>
  )
}

function StatsBar({ stats, rowCount, colCount }) {
  const dataPoints = getItemCount(stats)
  const grandMean  = dataPoints > 0 ? getTotal(stats) / dataPoints : 0

  // Find the numeric column with the highest mean using findItem
  const topCol = stats.reduce(
    (best, item) => {
      const found = findItem(stats, item.name)
      return found && found.value > (best?.value ?? -Infinity) ? found : best
    },
    null
  )

  return (
    <div className="stats-bar">
      <StatCard label="Rows Analyzed"     value={fmt(rowCount)}    sub="from your CSV" />
      <StatCard label="Total Columns"     value={colCount}         sub={`${stats.length} numeric`} />
      <StatCard label="Numeric Data Points" value={fmt(dataPoints)} sub="non-null values" />
      <StatCard
        label="Overall Avg Value"
        value={fmt(grandMean)}
        sub={topCol ? `highest col: ${topCol.name}` : undefined}
      />
    </div>
  )
}

export default StatsBar
