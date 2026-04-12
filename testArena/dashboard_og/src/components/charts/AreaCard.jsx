import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const COLOR = '#ffd166'

function AreaCard({ config }) {
  if (!config) return <div className="chart-empty">Not enough data for this chart</div>

  const { data, xKey, yKey, title, yLabel, xLabel } = config

  return (
    <>
      <p className="chart-title">{title}</p>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 24, bottom: 32, left: 8 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLOR} stopOpacity={0.6} />
              <stop offset="95%" stopColor={COLOR} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 10 }}
            angle={-30}
            textAnchor="end"
            interval={1}
            label={{ value: xLabel, position: 'insideBottomRight', offset: -4, style: { fontSize: 10 } }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10 } }}
          />
          <Tooltip formatter={(v) => [v.toLocaleString(), yLabel]} />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={COLOR}
            strokeWidth={2}
            fill="url(#areaGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </>
  )
}

export default AreaCard
