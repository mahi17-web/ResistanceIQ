export default function AuthBackground({ children }) {
  return (
    <div
      className="min-h-screen flex flex-col relative overflow-x-hidden selection:bg-[#0BDFA0]/30 selection:text-white"
      style={{
        backgroundColor: '#030609',
        backgroundImage: `
          radial-gradient(ellipse 70% 50% at 12% 10%, rgba(11,223,160,0.045) 0%, transparent 60%),
          radial-gradient(ellipse 65% 45% at 88% 90%, rgba(139,140,248,0.035) 0%, transparent 60%),
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: 'auto, auto, 40px 40px, 40px 40px',
        color: '#F1F5F9',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Extremely subtle layered ambient depth */}
      <div
        className="absolute top-16 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none blur-[120px] opacity-15 -z-10"
        style={{ background: 'radial-gradient(circle, #0BDFA0 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-16 right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none blur-[140px] opacity-10 -z-10"
        style={{ background: 'radial-gradient(circle, #8B8CF8 0%, #38BDF8 40%, transparent 70%)' }}
      />

      {children}
    </div>
  );
}

export function AmbientMolecularNetwork({ className = '' }) {
  return (
    <svg
      width="360"
      height="180"
      viewBox="0 0 360 180"
      fill="none"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      style={{ opacity: 0.22 }}
    >
      <defs>
        <radialGradient id="amb-node-teal" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0BDFA0" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0BDFA0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="amb-node-violet" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8B8CF8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#8B8CF8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Thin live telemetry bonds */}
      {[
        [180, 90, 85, 45],
        [180, 90, 275, 40],
        [180, 90, 90, 140],
        [180, 90, 270, 135],
        [180, 90, 180, 20],
        [85, 45, 30, 80],
        [275, 40, 330, 75],
        [90, 140, 30, 115],
        [270, 135, 330, 115],
      ].map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}

      {/* Central telemetry core */}
      <circle cx="180" cy="90" r="16" fill="url(#amb-node-teal)" />
      <circle cx="180" cy="90" r="5" fill="rgba(11,223,160,0.3)" stroke="#0BDFA0" strokeWidth="1.2" />

      {/* Orbiting nodes with minimal chemical notation */}
      {[
        [85, 45, '#0BDFA0', 4, 'C₁₂'],
        [275, 40, '#8B8CF8', 3.5, 'N₄'],
        [90, 140, '#38BDF8', 3.5, 'O₂'],
        [270, 135, '#0BDFA0', 4, 'P₁'],
        [180, 20, 'rgba(255,255,255,0.4)', 2.5, 'S'],
        [30, 80, 'rgba(255,255,255,0.2)', 2, ''],
        [330, 75, 'rgba(255,255,255,0.2)', 2, ''],
        [30, 115, 'rgba(255,255,255,0.15)', 2, ''],
        [330, 115, 'rgba(255,255,255,0.15)', 2, ''],
      ].map(([cx, cy, color, r, label], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r} fill={color} />
          {label && (
            <text
              x={cx + r + 3}
              y={cy + 3}
              fill="rgba(255,255,255,0.35)"
              fontSize="7.5"
              fontFamily="'JetBrains Mono', monospace"
            >
              {label}
            </text>
          )}
        </g>
      ))}

      {/* Thin orbital traces */}
      <circle
        cx="180"
        cy="90"
        r="48"
        stroke="rgba(11,223,160,0.08)"
        strokeWidth="1"
        strokeDasharray="3 7"
        style={{ animation: 'rotate-slow 45s linear infinite', transformOrigin: '180px 90px' }}
      />
      <circle
        cx="180"
        cy="90"
        r="80"
        stroke="rgba(139,140,248,0.05)"
        strokeWidth="1"
        strokeDasharray="2 10"
        style={{ animation: 'rotate-slow 60s linear infinite reverse', transformOrigin: '180px 90px' }}
      />
    </svg>
  );
}
