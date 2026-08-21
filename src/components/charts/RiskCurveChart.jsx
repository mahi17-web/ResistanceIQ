import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

const COLORS = ['#10d9a0', '#6366f1', '#fb923c', '#f43f5e'];

function pct(val) { return `${Math.round(val * 100)}%`; }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1623] border border-[rgba(255,255,255,0.12)] rounded-lg px-3 py-2.5 shadow-xl">
      <p className="text-xs font-semibold text-[#64748b] mb-1">Year {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs font-bold" style={{ color: p.color }}>
          {p.name}: {pct(p.value)}
        </p>
      ))}
    </div>
  );
};

/**
 * Resistance probability over time — single or multi-series area chart.
 * @param {{ data: object[]|null, multiSeries?: {name: string, data: object[]}[], height?: number }} props
 */
export default function RiskCurveChart({ data, multiSeries, height = 260 }) {
  // Merge multi-series into single array keyed by year
  const chartData = multiSeries
    ? (() => {
        const yearMap = {};
        multiSeries.forEach(({ name, data: d }) => {
          d.forEach((pt) => {
            if (!yearMap[pt.year]) yearMap[pt.year] = { year: pt.year };
            yearMap[pt.year][name] = pt.resistance_probability;
          });
        });
        return Object.values(yearMap).sort((a, b) => a.year - b.year);
      })()
    : (data ?? []);

  const seriesKeys = multiSeries ? multiSeries.map((s) => s.name) : ['resistance_probability'];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <defs>
          {seriesKeys.map((key, i) => (
            <linearGradient key={key} id={`grad_${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={COLORS[i % COLORS.length]} stopOpacity={0.25} />
              <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.01} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="year"
          tick={{ fill: '#64748b', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          label={{ value: 'Years', position: 'insideBottomRight', offset: -4, fill: '#64748b', fontSize: 11 }}
        />
        <YAxis
          tickFormatter={pct}
          tick={{ fill: '#64748b', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          domain={[0, 1]}
        />
        <Tooltip content={<CustomTooltip />} />
        {multiSeries && <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />}
        {/* 50% threshold reference line */}
        <ReferenceLine
          y={0.5}
          stroke="rgba(245,158,11,0.5)"
          strokeDasharray="4 4"
          label={{ value: '50% threshold', position: 'right', fill: '#f59e0b', fontSize: 10 }}
        />
        {seriesKeys.map((key, i) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            name={key === 'resistance_probability' ? 'Resistance Probability' : key}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            fill={`url(#grad_${i})`}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
            animationDuration={900}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
