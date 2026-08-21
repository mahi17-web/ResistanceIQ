import { useState } from 'react';

const RISK_COLORS = {
  critical: '#f43f5e',
  high:     '#fb923c',
  moderate: '#f59e0b',
  low:      '#10d9a0',
};

const BG_COLORS = {
  critical: 'rgba(244,63,94,0.2)',
  high:     'rgba(251,146,60,0.2)',
  moderate: 'rgba(245,158,11,0.2)',
  low:      'rgba(16,217,160,0.15)',
};

/**
 * Residue-level fragility heatmap rendered in SVG.
 * Each cell = one residue. Color encodes risk tier; hover shows ddG + fitness cost.
 * @param {{ hotspots: object[] }} props
 */
export default function MutationHeatmap({ hotspots }) {
  const [hovered, setHovered] = useState(null);

  if (!hotspots?.length) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-[#64748b]">
        No mutation data available
      </div>
    );
  }

  // Layout: fill rows of 8 cells
  const COLS = 8;
  const CELL = 42;
  const GAP  = 6;
  const rows  = Math.ceil(hotspots.length / COLS);
  const W     = COLS * (CELL + GAP) - GAP;
  const H     = rows * (CELL + GAP) - GAP;

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(RISK_COLORS).map(([tier, color]) => (
          <div key={tier} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
            <span className="text-[10px] capitalize text-[#64748b]">{tier}</span>
          </div>
        ))}
        <span className="text-[10px] text-[#334155] ml-auto">Hover cell for details</span>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div className="glass rounded-lg px-4 py-3 text-xs space-y-1 animate-fade-in border border-[rgba(255,255,255,0.12)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: RISK_COLORS[hovered.risk] }} />
            <span className="font-bold text-[#f0f4ff]">{hovered.residue}</span>
            <span className="capitalize text-[#64748b]">· {hovered.risk} risk</span>
          </div>
          <p className="text-[#64748b]">
            ΔΔG: <span className="text-[#f0f4ff] font-semibold">{hovered.ddG?.toFixed(2)} kcal/mol</span>
            &nbsp;·&nbsp;
            Fitness cost: <span className="text-[#f0f4ff] font-semibold">{hovered.fitness_cost?.toFixed(2)}</span>
          </p>
        </div>
      )}

      {/* SVG grid */}
      <div className="overflow-x-auto">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
          {hotspots.map((h, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const x   = col * (CELL + GAP);
            const y   = row * (CELL + GAP);
            const color  = RISK_COLORS[h.risk] ?? '#64748b';
            const bgFill = BG_COLORS[h.risk]   ?? 'rgba(255,255,255,0.06)';
            const isHov  = hovered?.residue === h.residue;

            return (
              <g key={h.residue} onMouseEnter={() => setHovered(h)} onMouseLeave={() => setHovered(null)}>
                <rect
                  x={x} y={y} width={CELL} height={CELL}
                  rx={6} ry={6}
                  fill={isHov ? bgFill : 'rgba(255,255,255,0.04)'}
                  stroke={color}
                  strokeWidth={isHov ? 2 : 1}
                  style={{ transition: 'all 0.15s', cursor: 'pointer' }}
                />
                {/* Risk dot */}
                <circle cx={x + CELL - 7} cy={y + 7} r={3.5} fill={color} />
                {/* Residue label */}
                <text
                  x={x + CELL / 2} y={y + CELL / 2 - 3}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={isHov ? color : '#f0f4ff'}
                  fontSize={9} fontWeight={600}
                  fontFamily="JetBrains Mono, monospace"
                  style={{ pointerEvents: 'none', transition: 'fill 0.15s' }}
                >
                  {h.residue}
                </text>
                {/* ddG value */}
                <text
                  x={x + CELL / 2} y={y + CELL / 2 + 9}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="#64748b" fontSize={8}
                  fontFamily="JetBrains Mono, monospace"
                  style={{ pointerEvents: 'none' }}
                >
                  {h.ddG?.toFixed(1)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
