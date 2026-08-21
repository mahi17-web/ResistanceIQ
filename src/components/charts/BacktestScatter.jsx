import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Label,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#0f1623] border border-[rgba(255,255,255,0.12)] rounded-lg px-3 py-2.5 shadow-xl text-xs space-y-1">
      <p className="font-bold text-[#f0f4ff]">{d.pesticide_name}</p>
      <p className="text-[#64748b]">Pest: {d.pest_name}</p>
      <p className="text-[#10d9a0]">Predicted: {d.predicted_years}y</p>
      <p className="text-[#6366f1]">Actual: {d.actual_years}y</p>
      <p className={Math.abs(d.error_margin) <= 1 ? 'text-[#10d9a0]' : 'text-[#f59e0b]'}>
        Error: ±{d.error_margin}y
      </p>
    </div>
  );
};

/**
 * Predicted vs. actual resistance years scatter plot.
 * Diagonal reference line = perfect prediction.
 * @param {{ cases: object[], height?: number }} props
 */
export default function BacktestScatter({ cases, height = 300 }) {
  const maxVal = Math.max(...(cases ?? []).flatMap((c) => [c.predicted_years, c.actual_years]), 12);
  const axisMax = Math.ceil(maxVal / 2) * 2 + 2;

  // Reference line data (y = x)
  const refData = [{ x: 0, y: 0 }, { x: axisMax, y: axisMax }];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 8, right: 24, left: -8, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="predicted_years"
          domain={[0, axisMax]}
          tick={{ fill: '#64748b', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          name="Predicted"
        >
          <Label value="Predicted Years" position="insideBottom" offset={-12} fill="#64748b" fontSize={11} />
        </XAxis>
        <YAxis
          type="number"
          dataKey="actual_years"
          domain={[0, axisMax]}
          tick={{ fill: '#64748b', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          name="Actual"
        >
          <Label value="Actual Years" angle={-90} position="insideLeft" offset={16} fill="#64748b" fontSize={11} />
        </YAxis>
        <Tooltip content={<CustomTooltip />} />

        {/* Perfect prediction line (y = x) */}
        <ReferenceLine
          segment={refData}
          stroke="rgba(99,102,241,0.35)"
          strokeDasharray="5 4"
          strokeWidth={1.5}
          label={{ value: 'Perfect', position: 'insideTopLeft', fill: '#6366f1', fontSize: 10 }}
        />

        {/* ±2yr band */}
        <ReferenceLine segment={[{ x: 2, y: 0 }, { x: axisMax, y: axisMax - 2 }]} stroke="rgba(245,158,11,0.15)" strokeDasharray="4 3" />
        <ReferenceLine segment={[{ x: 0, y: 2 }, { x: axisMax - 2, y: axisMax }]} stroke="rgba(245,158,11,0.15)" strokeDasharray="4 3" />

        <Scatter
          data={cases ?? []}
          fill="#10d9a0"
          fillOpacity={0.85}
          stroke="rgba(16,217,160,0.4)"
          strokeWidth={1}
          r={6}
          animationDuration={800}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
