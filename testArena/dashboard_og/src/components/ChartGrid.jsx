import BarCard     from './charts/BarCard'
import LineCard    from './charts/LineCard'
import PieCard     from './charts/PieCard'
import ScatterCard from './charts/ScatterCard'
import AreaCard    from './charts/AreaCard'

function ChartGrid({ charts }) {
  return (
    <div className="chart-grid">
      <div className="chart-card"><BarCard     config={charts.bar}     /></div>
      <div className="chart-card"><LineCard    config={charts.line}    /></div>
      <div className="chart-card"><PieCard     config={charts.pie}     /></div>
      <div className="chart-card"><ScatterCard config={charts.scatter} /></div>
      <div className="chart-card full-width"><AreaCard config={charts.area} /></div>
    </div>
  )
}

export default ChartGrid
