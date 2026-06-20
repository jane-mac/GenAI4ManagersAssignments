const STATS_KEY = 'dashboard-stats'
const FILE_KEY = 'dashboard-filename'
const DATA_KEY = 'dashboard-data'

export function loadItems() {
  try {
    const saved = localStorage.getItem(STATS_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function saveItems(items) {
  localStorage.setItem(STATS_KEY, JSON.stringify(items))
  return items
}

export function loadDashboard() {
  try {
    const fileName = localStorage.getItem(FILE_KEY) || null
    const data = localStorage.getItem(DATA_KEY)
    const dashData = data ? JSON.parse(data) : null
    return { fileName, dashData }
  } catch {
    return { fileName: null, dashData: null }
  }
}

export function saveDashboard(fileName, dashData) {
  localStorage.setItem(FILE_KEY, fileName)
  localStorage.setItem(DATA_KEY, JSON.stringify(dashData))
}

export function clearDashboard() {
  localStorage.removeItem(STATS_KEY)
  localStorage.removeItem(FILE_KEY)
  localStorage.removeItem(DATA_KEY)
}
