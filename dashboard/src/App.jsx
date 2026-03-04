import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import { addItem, getTotal, getItemCount, findItem } from './engine'
import { analyzeColumns, prepareBarData, prepareLineData, preparePieData, prepareScatterData, prepareAreaData } from './utils/analyzeData'
import FileUpload from './components/FileUpload'
import StatsBar from './components/StatsBar'
import ChartGrid from './components/ChartGrid'
import './App.css'

function App() {
  const [fileName, setFileName] = useState(null)
  const [dashData, setDashData] = useState(null) // { analysis, charts }
  const [stats, setStats] = useState([])          // engine-managed column stats

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
        setStats(newStats)

        setFileName(file.name)
        setDashData({
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
        })
      },
    })
  }, [])

  const reset = () => {
    setDashData(null)
    setFileName(null)
    setStats([])
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Data Dashboard</h1>
          {fileName && <span className="file-chip">{fileName}</span>}
        </div>
        {dashData && (
          <button className="btn-reset" onClick={reset}>
            ↑ Upload New File
          </button>
        )}
      </header>

      {!dashData ? (
        <div className="upload-page">
          <FileUpload onFile={handleFile} />
        </div>
      ) : (
        <main className="dashboard">
          {/* StatsBar uses engine: getItemCount, getTotal, findItem */}
          <StatsBar
            stats={stats}
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
