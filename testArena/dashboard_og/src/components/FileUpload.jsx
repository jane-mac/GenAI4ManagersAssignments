import { useRef, useState } from 'react'

function FileUpload({ onFile }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (file) => {
    if (file && file.name.endsWith('.csv')) onFile(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div
      className={`upload-zone${dragOver ? ' drag-over' : ''}`}
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <span className="upload-icon">📊</span>
      <h2>Upload your CSV file</h2>
      <p>
        Drop any CSV here and the dashboard will automatically detect your columns
        and generate 5 interactive charts.
      </p>
      <button className="btn-browse" onClick={(e) => { e.stopPropagation(); inputRef.current.click() }}>
        Browse files
      </button>
      <p className="upload-hint">Supports .csv files up to any size · first 500 rows visualized</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  )
}

export default FileUpload
