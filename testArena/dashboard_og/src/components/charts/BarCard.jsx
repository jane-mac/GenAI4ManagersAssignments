import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const COLOR = '#4361ee'

function BarCard({ config }) {
  if (!config) return <div className="chart-empty">Not enough data for this chart</div>

  const { data, xKey, yKey, title, yLabel } = config

  return (
    <>
      <p className="chart-title">{title}</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 16, bottom: 40, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11 }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 11 }} label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10 } }} />
          <Tooltip
            formatter={(v) => [v.toLocaleString(), yLabel]}
            cursor={{ fill: 'rgba(67,97,238,0.06)' }}
          />
          {data.map((_, i) => (
            <Cell key={i} fill={COLOR} fillOpacity={0.75 + 0.25 * (1 - i / data.length)} />
          ))}
          <Bar dataKey={yKey} radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLOR} fillOpacity={0.75 + 0.25 * (1 - i / data.length)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </>
  )
}

export default BarCard
