import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const COLOR = '#06d6a0'

function LineCard({ config }) {
  if (!config) return <div className="chart-empty">Not enough data for this chart</div>

  const { data, xKey, yKey, title, yLabel, xLabel } = config
  const avg = data.reduce((s, d) => s + d[yKey], 0) / data.length

  return (
    <>
      <p className="chart-title">{title}</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} label={{ value: xLabel, position: 'insideBottomRight', offset: -4, style: { fontSize: 10 } }} />
          <YAxis tick={{ fontSize: 11 }} label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10 } }} />
          <Tooltip formatter={(v) => [v.toLocaleString(), yLabel]} />
          <ReferenceLine y={avg} stroke="#ccc" strokeDasharray="4 4" label={{ value: `avg ${avg.toFixed(1)}`, position: 'right', style: { fontSize: 10, fill: '#aaa' } }} />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  )
}

export default LineCard
