

const MAX_ROWS = 500
const CHART_POINTS = 80   
const SCATTER_POINTS = 150


export function analyzeColumns(headers, rows) {
  const limited = rows.slice(0, MAX_ROWS)

  const cols = headers.map((header) => {
    const rawValues = limited.map((r) => r[header])
    const values = rawValues.filter((v) => v !== '' && v != null)
    const nums = values
      .map((v) => parseFloat(String(v).replace(/[$,%]/g, '').replace(/,/g, '')))
      .filter((v) => !isNaN(v))

    const isNumeric = nums.length > 0 && nums.length / values.length > 0.7
    const unique = [...new Set(values)]
    const mean = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0

    return {
      name: header,
      isNumeric,
      values,
      nums,
      unique,
      mean,
      sum: nums.reduce((a, b) => a + b, 0),
      min: nums.length > 0 ? Math.min(...nums) : 0,
      max: nums.length > 0 ? Math.max(...nums) : 0,
      count: values.length,
    }
  })

  const numericCols = cols.filter((c) => c.isNumeric)
  const catCols = cols.filter(
    (c) => !c.isNumeric && c.unique.length >= 2 && c.unique.length <= 20
  )

  return { cols, numericCols, catCols, rows: limited }
}


export function prepareBarData(analysis) {
  const { catCols, numericCols, rows } = analysis

  if (catCols.length > 0 && numericCols.length > 0) {
    const catCol = catCols[0]
    const numCol = numericCols[0]

    const groups = {}
    rows.forEach((row) => {
      const cat = row[catCol.name]
      const num = parseFloat(String(row[numCol.name]).replace(/[$,%,]/g, ''))
      if (cat && !isNaN(num)) {
        if (!groups[cat]) groups[cat] = { sum: 0, count: 0 }
        groups[cat].sum += num
        groups[cat].count++
      }
    })

    return {
      data: Object.entries(groups)
        .map(([name, { sum, count }]) => ({
          name,
          value: parseFloat((sum / count).toFixed(2)),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 12),
      xKey: 'name',
      yKey: 'value',
      title: `${numCol.name} by ${catCol.name}`,
      yLabel: `Avg ${numCol.name}`,
    }
  }

  if (numericCols.length > 0) {
    const col = numericCols[0]
    return {
      data: rows.slice(0, 15).map((row, i) => ({
        name: `#${i + 1}`,
        value: parseFloat(String(row[col.name]).replace(/[$,%,]/g, '')) || 0,
      })),
      xKey: 'name',
      yKey: 'value',
      title: col.name,
      yLabel: col.name,
    }
  }
  return null
}

export function prepareLineData(analysis) {
  const { numericCols, rows } = analysis
  if (numericCols.length === 0) return null

  const col = numericCols[0]
  const step = Math.max(1, Math.floor(rows.length / CHART_POINTS))

  return {
    data: rows
      .filter((_, i) => i % step === 0)
      .map((row, i) => ({
        index: i * step + 1,
        value: parseFloat(String(row[col.name]).replace(/[$,%,]/g, '')) || 0,
      })),
    xKey: 'index',
    yKey: 'value',
    title: `${col.name} — Row Trend`,
    yLabel: col.name,
    xLabel: 'Row',
  }
}

export function preparePieData(analysis) {
  const { catCols, numericCols, rows } = analysis

  const goodCat =
    catCols.find((c) => c.unique.length >= 2 && c.unique.length <= 8) || catCols[0]

  if (goodCat) {
    const counts = {}
    rows.forEach((row) => {
      const val = row[goodCat.name]
      if (val != null && val !== '') counts[val] = (counts[val] || 0) + 1
    })
    return {
      data: Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
      title: `${goodCat.name} Breakdown`,
    }
  }

  if (numericCols.length > 0) {
    const col = numericCols[0]
    const sorted = [...col.nums].sort((a, b) => a - b)
    const q = Math.floor(sorted.length / 4)
    return {
      data: [
        { name: 'Bottom 25%', value: q },
        { name: 'Q2',         value: q },
        { name: 'Q3',         value: q },
        { name: 'Top 25%',    value: sorted.length - 3 * q },
      ],
      title: `${col.name} — Quartiles`,
    }
  }
  return null
}

export function prepareScatterData(analysis) {
  const { numericCols, rows } = analysis
  if (numericCols.length < 2) return null

  const colX = numericCols[0]
  const colY = numericCols[1]
  const step = Math.max(1, Math.floor(rows.length / SCATTER_POINTS))

  return {
    data: rows
      .filter((_, i) => i % step === 0)
      .map((row) => ({
        x: parseFloat(String(row[colX.name]).replace(/[$,%,]/g, '')) || 0,
        y: parseFloat(String(row[colY.name]).replace(/[$,%,]/g, '')) || 0,
      }))
      .filter((p) => !isNaN(p.x) && !isNaN(p.y)),
    title: `${colX.name} vs ${colY.name}`,
    xLabel: colX.name,
    yLabel: colY.name,
  }
}

export function prepareAreaData(analysis) {
  const { numericCols } = analysis
  const col = numericCols.length >= 2 ? numericCols[1] : numericCols[0]
  if (!col) return null

  const BIN_COUNT = 14
  const range = col.max - col.min || 1
  const binSize = range / BIN_COUNT

  const bins = Array.from({ length: BIN_COUNT }, (_, i) => {
    const lo = col.min + i * binSize
    const hi = lo + binSize
    return { range: `${lo.toFixed(1)}`, count: 0 }
  })

  col.nums.forEach((v) => {
    const idx = Math.min(Math.floor((v - col.min) / binSize), BIN_COUNT - 1)
    if (idx >= 0) bins[idx].count++
  })

  return {
    data: bins,
    xKey: 'range',
    yKey: 'count',
    title: `${col.name} — Distribution`,
    yLabel: 'Count',
    xLabel: col.name,
  }
}
