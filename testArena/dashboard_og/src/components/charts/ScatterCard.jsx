import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis,
} from 'recharts'

const COLOR = '#f72585'

function ScatterCard({ config }) {
  if (!config) return <div className="chart-empty">Need at least 2 numeric columns for scatter plot</div>

  const { data, title, xLabel, yLabel } = config

  return (
    <>
      <p className="chart-title">{title}</p>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 4, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="x"
            type="number"
            name={xLabel}
            tick={{ fontSize: 11 }}
            label={{ value: xLabel, position: 'insideBottom', offset: -4, style: { fontSize: 10 } }}
          />
          <YAxis
            dataKey="y"
            type="number"
            name={yLabel}
            tick={{ fontSize: 11 }}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10 } }}
          />
          <ZAxis range={[20, 20]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(v, name) => [v.toLocaleString(), name]}
          />
          <Scatter data={data} fill={COLOR} fillOpacity={0.55} />
        </ScatterChart>
      </ResponsiveContainer>
    </>
  )
}

export default ScatterCard
