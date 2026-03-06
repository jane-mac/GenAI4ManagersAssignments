import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import { addItem, getTotal, getItemCount, findItem } from './engine'
import { loadItems, saveItems, loadDashboard, saveDashboard, clearDashboard } from './storage'
import { analyzeColumns, prepareBarData, prepareLineData, preparePieData, prepareScatterData, prepareAreaData } from './utils/analyzeData'
import FileUpload from './components/FileUpload'
import StatsBar from './components/StatsBar'
import ChartGrid from './components/ChartGrid'
import './App.css'

function App() {
  const { fileName: savedFileName, dashData: savedDashData } = loadDashboard()
  const [fileName, setFileName] = useState(savedFileName)
  const [dashData, setDashData] = useState(savedDashData) // { analysis, charts }
  const [stats, setStats] = useState(loadItems)            // engine-managed column stats
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [columnFilter, setColumnFilter] = useState('')

  const handleFile = useCallback((file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        const headers = meta.fields || []
        const analysis = analyzeColumns(headers, data)
        console.log("HIIIIIIIIIII!!!!!!!!")

        // Register each numeric column as a catalog item:
        //   name     = column name
        //   value    = column mean (to 2 dp)
        //   quantity = number of non-null rows
        // This lets us use getItemCount() for total data points and
        // getTotal() / getItemCount() for the grand mean across all numeric data.
        let newStats = []
        for (const col of analysis.numericCols) {
          newStats = addItem(newStats, col.name, parseFloat(col.mean.toFixed(2)), col.count)
        }
        saveItems(newStats)
        setStats(newStats)

        const nextDashData = {
          headers,
          rowCount: analysis.rows.length,
          analysis,
          charts: {
            bar:     prepareBarData(analysis),
            line:    prepareLineData(analysis),
            pie:     preparePieData(analysis),
            scatter: prepareScatterData(analysis),
            area:    prepareAreaData(analysis),
          },
        }
        saveDashboard(file.name, nextDashData)
        setFileName(file.name)
        setDashData(nextDashData)
      },
    })
  }, [])

  const reset = () => {
    clearDashboard()
    setDashData(null)
    setFileName(null)
    setStats([])
  }

  // BUG: toggling dark mode also clears the column filter
  const toggleDarkMode = () => {
    setIsDarkMode((d) => !d)
    setColumnFilter('')
  }

  const handleExport = () => {
    if (!dashData) return
    // BUG: exports only the header names, not the actual data rows
    const csv = dashData.headers.join(',')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (fileName || 'data').replace('.csv', '_export.csv')
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredStats = columnFilter
    ? stats.filter((item) =>
        item.name.toLowerCase().includes(columnFilter.toLowerCase())
      )
    : stats

  return (
    <div className={`app${isDarkMode ? ' dark' : ''}`}>
      <header className="app-header">
        <div className="header-left">
          <h1>Data Dashboard</h1>
          {fileName && <span className="file-chip">{fileName}</span>}
        </div>
        <div className="header-actions">
          {dashData && (
            <button className="btn-export" onClick={handleExport}>
              Export CSV
            </button>
          )}
          <button className="btn-dark-mode" onClick={toggleDarkMode}>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          {dashData && (
            <button className="btn-reset" onClick={reset}>
              Upload New File
            </button>
          )}
        </div>
      </header>

      {!dashData ? (
        <div className="upload-page">
          <FileUpload onFile={handleFile} />
        </div>
      ) : (
        <main className="dashboard">
          <div className="filter-bar">
            <input
              className="column-filter"
              type="text"
              placeholder="Filter columns..."
              value={columnFilter}
              onChange={(e) => setColumnFilter(e.target.value)}
            />
          </div>
          {/* StatsBar uses engine: getItemCount, getTotal, findItem */}
          <StatsBar
            stats={filteredStats}
            rowCount={dashData.rowCount}
            colCount={dashData.headers.length}
          />
          <ChartGrid charts={dashData.charts} />
        </main>
      )}
    </div>
  )
}

export default App
