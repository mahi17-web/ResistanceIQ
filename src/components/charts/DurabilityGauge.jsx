/**
 * SVG radial arc gauge for durability score (0–1).
 * Color transitions: green > amber > orange > red.
 * Animates on mount via CSS animation.
 */
export default function DurabilityGauge({ score, size = 160 }) {
  const pct = Math.max(0, Math.min(1, score ?? 0));
  const label = Math.round(pct * 100);

  // Arc math
  const cx = size / 2;
  const cy = size / 2;
  const R  = (size / 2) * 0.78;
  // Arc spans 220° (from 200° to 340° going clockwise, i.e. -110° to +110°)
  const START_DEG = 200;
  const SWEEP_DEG = 220;
  const endDeg    = START_DEG + SWEEP_DEG * pct;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const polarX = (deg) => cx + R * Math.cos(toRad(deg));
  const polarY = (deg) => cy + R * Math.sin(toRad(deg));

  const startX = polarX(START_DEG);
  const startY = polarY(START_DEG);
  const endX   = polarX(endDeg);
  const endY   = polarY(endDeg);
  const large  = SWEEP_DEG * pct > 180 ? 1 : 0;

  const trackEndX = polarX(START_DEG + SWEEP_DEG);
  const trackEndY = polarY(START_DEG + SWEEP_DEG);

  const fillColor =
    pct >= 0.7  ? '#10d9a0' :
    pct >= 0.5  ? '#f59e0b' :
    pct >= 0.35 ? '#fb923c' :
                  '#f43f5e';

  const risk =
    pct >= 0.7  ? 'Low Risk'      :
    pct >= 0.5  ? 'Moderate Risk' :
    pct >= 0.35 ? 'High Risk'     :
                  'Critical Risk' ;

  const gradId = `gauge_grad_${Math.round(pct * 100)}`;

  return (
    <div style={{ width: size, height: size }} className="relative mx-auto">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={fillColor} stopOpacity={0.6} />
            <stop offset="100%" stopColor={fillColor} />
          </linearGradient>
        </defs>

        {/* Track */}
        {pct < 1 && (
          <path
            d={`M ${startX} ${startY} A ${R} ${R} 0 1 1 ${trackEndX} ${trackEndY}`}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={size * 0.068}
            strokeLinecap="round"
          />
        )}

        {/* Fill arc (only if score > 0) */}
        {pct > 0 && (
          <path
            d={`M ${startX} ${startY} A ${R} ${R} 0 ${large} 1 ${endX} ${endY}`}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={size * 0.068}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${fillColor}80)` }}
          />
        )}

        {/* Center score */}
        <text
          x={cx} y={cy - size * 0.06}
          textAnchor="middle"
          fill={fillColor}
          fontSize={size * 0.22}
          fontWeight={800}
          fontFamily="Inter, sans-serif"
        >
          {label}
        </text>
        <text
          x={cx} y={cy + size * 0.09}
          textAnchor="middle"
          fill="#64748b"
          fontSize={size * 0.085}
          fontFamily="Inter, sans-serif"
        >
          / 100
        </text>
        <text
          x={cx} y={cy + size * 0.22}
          textAnchor="middle"
          fill={fillColor}
          fontSize={size * 0.075}
          fontWeight={600}
          fontFamily="Inter, sans-serif"
        >
          {risk}
        </text>
      </svg>

      {/* Glow ring */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ boxShadow: `inset 0 0 ${size * 0.15}px ${fillColor}20` }}
      />
    </div>
  );
}
