import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = ['#4361ee', '#7209b7', '#f72585', '#06d6a0', '#ffd166', '#118ab2', '#ef476f', '#06d6a0']

const renderLabel = ({ name, percent }) =>
  percent > 0.04 ? `${(percent * 100).toFixed(0)}%` : ''

function PieCard({ config }) {
  if (!config) return <div className="chart-empty">Not enough data for this chart</div>

  const { data, title } = config

  return (
    <>
      <p className="chart-title">{title}</p>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="46%"
            outerRadius={90}
            innerRadius={40}
            label={renderLabel}
            labelLine={false}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v, name) => [v.toLocaleString(), name]} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </>
  )
}

export default PieCard
