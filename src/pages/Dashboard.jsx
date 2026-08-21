import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { getProjects, getForecasts, ensureAuthenticated } from '../api/client.js';

/* ─── Molecular network SVG decoration ──────────────────────────── */
function MolecularViz() {
  return (
    <svg
      width="340"
      height="260"
      viewBox="0 0 340 260"
      fill="none"
      aria-hidden="true"
      style={{ opacity: 0.5 }}
    >
      <defs>
        <radialGradient id="grd1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0BDFA0" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0BDFA0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="grd2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8B8CF8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#8B8CF8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Edges */}
      {[
        [170,130, 80,60],  [170,130, 260,55], [170,130, 80,200],
        [170,130, 260,200],[170,130, 170,30],
        [80,60,  40,110],  [260,55, 310,100],
        [80,200, 40,150],  [260,200,305,155],
      ].map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(255,255,255,0.07)" strokeWidth="1"
          style={{ animation: `drawLine 2s ${i*0.15}s ease both` }}
        />
      ))}

      {/* Center node */}
      <circle cx="170" cy="130" r="18" fill="url(#grd1)" />
      <circle cx="170" cy="130" r="10" fill="rgba(11,223,160,0.18)" stroke="#0BDFA0" strokeWidth="1.5" />

      {/* Outer nodes */}
      {[
        [80,60,'#0BDFA0',8],
        [260,55,'#8B8CF8',7],
        [80,200,'#8B8CF8',6],
        [260,200,'#0BDFA0',9],
        [170,30,'rgba(255,255,255,0.4)',5],
        [40,110,'rgba(255,255,255,0.25)',4],
        [310,100,'rgba(255,255,255,0.25)',4],
        [40,150,'rgba(255,255,255,0.2)',3],
        [305,155,'rgba(255,255,255,0.2)',3],
      ].map(([cx,cy,color,r],i) => (
        <circle key={i} cx={cx} cy={cy} r={r}
          fill={color}
          style={{ animation: `fadeIn 0.5s ${0.3 + i*0.08}s ease both`, opacity: 0 }}
        />
      ))}

      {/* Floating ring */}
      <circle cx="170" cy="130" r="50"
        stroke="rgba(11,223,160,0.08)"
        strokeWidth="1"
        strokeDasharray="4 8"
        style={{ animation: 'rotate-slow 25s linear infinite', transformOrigin: '170px 130px' }}
      />
      <circle cx="170" cy="130" r="90"
        stroke="rgba(139,140,248,0.05)"
        strokeWidth="1"
        strokeDasharray="3 12"
        style={{ animation: 'rotate-slow 40s linear infinite reverse', transformOrigin: '170px 130px' }}
      />
    </svg>
  );
}

/* ─── Research row ───────────────────────────────────────────────── */
function ResearchRow({ project, forecasts, index }) {
  const navigate = useNavigate();
  const topForecast = forecasts?.[0];
  const riskTier    = topForecast?.risk_tier ?? 'moderate';
  const score       = Math.round((project.avg_durability ?? topForecast?.durability_score ?? 0.5) * 100);
  const riskClass   = `risk-${riskTier.toLowerCase() === 'moderate' ? 'moderate' : riskTier.toLowerCase()}`;
  const targetLabel = topForecast?.target?.name || topForecast?.target_name || 'AChE1';

  return (
    <div
      className="research-row"
      onClick={() => navigate('/comparison')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate('/comparison')}
    >
      {/* Number */}
      <div>
        <span className="research-number">{String(index + 1).padStart(2, '0')}</span>
      </div>

      {/* Main content */}
      <div style={{ minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 700, color: 'var(--ink-4)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          marginBottom: 10,
        }}>
          {project.status === 'active' ? 'Active' : 'Complete'}
        </p>
        <h3 style={{ fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 10 }}>
          {project.name}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6, maxWidth: 520 }}>
          {project.description}
        </p>
        <div style={{ marginTop: 20, display: 'flex', gap: 24, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-5)', marginBottom: 2 }}>Candidates</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-2)' }}>{String(project.candidate_count || forecasts?.length || 0).padStart(2, '0')}</p>
          </div>
          <div style={{ width: 1, height: 32, background: 'var(--line-soft)' }} />
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-5)', marginBottom: 2 }}>Target</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace' }}>
              {targetLabel.split(' ')[0]}
            </p>
          </div>
        </div>
      </div>

      {/* Right — score + risk */}
      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }} className="research-score">
        <div>
          <p style={{ fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {score}
            <span style={{ fontSize: '0.3em', fontWeight: 600, color: 'var(--ink-4)', marginLeft: 4 }}>/100</span>
          </p>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginTop: 4 }}>
            Durability
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`risk-label ${riskClass}`}>{riskTier} risk</span>
          <span className="research-arrow" style={{ color: 'var(--teal)' }}>
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Recent intel item ──────────────────────────────────── */
function IntelItem({ text, time, type }) {
  const dotColor = type === 'success' ? 'var(--teal)' : type === 'warning' ? 'var(--risk-high)' : 'var(--ink-4)';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 0', borderBottom: '1px solid var(--line-soft)' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: 7 }} />
      <p style={{ fontSize: 14, color: 'var(--ink-2)', flex: 1, lineHeight: 1.55 }}>{text}</p>
      <p style={{ fontSize: 11, color: 'var(--ink-4)', flexShrink: 0, marginTop: 2 }}>{time}</p>
    </div>
  );
}

const CURVE_COLORS = ['#0BDFA0', '#8B8CF8', '#F3B14D', '#E85D7A'];

function pct(v) { return `${Math.round((v || 0) * 100)}%`; }

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--elevated)', border: '1px solid var(--line-med)',
      borderRadius: 10, padding: '10px 14px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Year {label}
      </p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ fontSize: 12, fontWeight: 600, color: p.color, margin: '2px 0' }}>
          {p.name}: {pct(p.value)}
        </p>
      ))}
    </div>
  );
};

function TrajectoryChart({ forecasts }) {
  if (!forecasts || !Array.isArray(forecasts) || forecasts.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-4)', fontSize: 14 }}>
        No resistance trajectory data available yet.
      </div>
    );
  }

  // Merge all forecast risk curves into one dataset
  const yearMap = {};
  const namedSeries = forecasts.slice(0, 4).map((f) => {
    let curve = f.risk_curve;
    if (!curve && f.risk_trajectory_json) {
      try {
        curve = typeof f.risk_trajectory_json === 'string' ? JSON.parse(f.risk_trajectory_json) : f.risk_trajectory_json;
      } catch {
        curve = null;
      }
    }
    if (!curve || !Array.isArray(curve)) {
      const dScore = f.durability_score ?? 0.5;
      curve = Array.from({ length: 8 }, (_, i) => ({
        year: i + 1,
        resistance_probability: Math.min(0.97, (1 - dScore) * Math.exp(i * 0.25) * 0.1),
      }));
    }
    const name = f.molecule?.chemical_name || f.molecule_name || `Candidate ${f.id?.slice(0, 6) || ''}`;
    return { name, data: curve };
  });

  namedSeries.forEach(({ name, data }) => {
    if (Array.isArray(data)) {
      data.forEach((pt) => {
        if (pt && pt.year !== undefined) {
          if (!yearMap[pt.year]) yearMap[pt.year] = { year: pt.year };
          yearMap[pt.year][name] = pt.resistance_probability;
        }
      });
    }
  });

  const chartData = Object.values(yearMap).sort((a, b) => a.year - b.year);

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
        {namedSeries.map((s, i) => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 2, background: CURVE_COLORS[i % CURVE_COLORS.length], borderRadius: 2 }} />
            <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>{s.name}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <div style={{ width: 24, height: 1, borderTop: '1px dashed rgba(243,177,77,0.6)' }} />
          <span style={{ fontSize: 11, color: 'var(--risk-mod)', fontWeight: 500 }}>50% threshold</span>
        </div>
      </div>

      <div className="divider-strong" style={{ marginBottom: 1 }} />
      <ResponsiveContainer width="100%" height={480}>
        <AreaChart data={chartData} margin={{ top: 24, right: 0, left: -8, bottom: 0 }}>
          <defs>
            {namedSeries.map((s, i) => (
              <linearGradient key={s.name} id={`tgrad_${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={CURVE_COLORS[i % CURVE_COLORS.length]} stopOpacity={0.18} />
                <stop offset="100%" stopColor={CURVE_COLORS[i % CURVE_COLORS.length]} stopOpacity={0.01} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="1 0" stroke="rgba(255,255,255,0.035)" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: 'var(--ink-4)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Years after deployment', position: 'insideBottomRight', offset: -8, fill: 'var(--ink-4)', fontSize: 11 }}
          />
          <YAxis
            tickFormatter={pct}
            tick={{ fill: 'var(--ink-4)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={[0, 1]}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
          <ReferenceLine y={0.5} stroke="rgba(243,177,77,0.4)" strokeDasharray="6 4" />
          {namedSeries.map((s, i) => (
            <Area
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={CURVE_COLORS[i % CURVE_COLORS.length]}
              strokeWidth={1.5}
              fill={`url(#tgrad_${i})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              animationDuration={1200}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <div className="divider-strong" />
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────── */
export default function Dashboard() {
  const [projects, setProjects]     = useState([]);
  const [forecasts, setForecasts]   = useState({});
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const ps = await getProjects();
        setProjects(ps || []);
        const fm = {};
        if (ps && ps.length > 0) {
          await Promise.all(
            ps.map(async (p) => {
              try {
                fm[p.id] = await getForecasts(p.id);
              } catch {
                fm[p.id] = [];
              }
            })
          );
        }
        setForecasts(fm);
      } catch (err) {
        console.error('Dashboard load error:', err);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const allForecasts = Object.values(forecasts).flat();
  const avgDurability = allForecasts.length
    ? Math.round(allForecasts.reduce((s, f) => s + (f.durability_score || 0), 0) / allForecasts.length * 100)
    : 0;

  const topCandidate = allForecasts.length
    ? [...allForecasts].sort((a, b) => (b.durability_score || 0) - (a.durability_score || 0))[0]
    : null;

  const INTEL = [
    { text: 'Forecast complete — BW-4477A vs. AChE1. Durability: 81/100. Low risk.', time: '2h ago',    type: 'success' },
    { text: 'Mutation scan queued for BW-9921X against GluCl-α (51 variants).', time: '5h ago',    type: 'default' },
    { text: 'Backtest calibration passed — v0.3-mvp, MAE 0.77y, 87.5% within ±3yr.', time: '1d ago',    type: 'success' },
    { text: 'High-risk mutation G119S flagged in AChE1 binding scan for BW-2241.', time: '5d ago',    type: 'warning' },
    { text: 'Pyrethroid Replacement project marked complete. 4 candidates evaluated.', time: '4d ago',    type: 'default' },
  ];

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>

      {/* ══════════════════════════════════════════════
          HERO — full-width editorial opening
          ══════════════════════════════════════════════ */}
      <section style={{ padding: '80px var(--page-px) 0', maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 48 }}>
          {/* Left — text */}
          <div className="animate-fade-up">
            <p className="section-title" style={{ marginBottom: 28 }}>
              ResistanceIQ · Intelligence Platform
            </p>
            <h1 className="display-xl" style={{ marginBottom: 20 }}>
              Forecast resistance<br />
              <span className="text-gradient">before the field does.</span>
            </h1>
            <p className="body-lg" style={{ maxWidth: 520, marginBottom: 40 }}>
              Predictive intelligence for pesticide durability and resistance research.
              Analyze molecules, targets, and resistance trajectories before deployment.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link to="/new" className="btn btn-primary btn-cta">
                <Plus size={16} />
                Start Analysis
              </Link>
              <Link to="/comparison" className="btn btn-ghost btn-cta">
                View Research <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Right — molecular viz */}
          <div className="animate-fade-up delay-2" style={{ opacity: 0 }}>
            <MolecularViz />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATS STRIP — not cards, just numbers
          ══════════════════════════════════════════════ */}
      <section style={{ padding: '0 var(--page-px)', maxWidth: 'var(--content-max)', margin: '0 auto', marginTop: 96 }}>
        <div className="divider-med" />
        <div className="stat-strip">
          <div className="stat-strip-item">
            <p className="stat-number animate-fade-up delay-1">
              {loading ? '—' : avgDurability}
              <span className="stat-unit">/100</span>
            </p>
            <p className="stat-label">avg. durability</p>
          </div>
          <div className="stat-strip-item">
            <p className="stat-number animate-fade-up delay-2">{loading ? '—' : projects.length}</p>
            <p className="stat-label">projects</p>
          </div>
          <div className="stat-strip-item">
            <p className="stat-number animate-fade-up delay-3">{loading ? '—' : allForecasts.length}</p>
            <p className="stat-label">forecasts run</p>
          </div>
          <div className="stat-strip-item">
            <p className="stat-number animate-fade-up delay-4">8</p>
            <p className="stat-label">validated cases</p>
          </div>
        </div>
        <div className="divider-med" />
      </section>

      {/* ══════════════════════════════════════════════
          ACTIVE RESEARCH
          ══════════════════════════════════════════════ */}
      <section style={{ padding: '0 var(--page-px)', maxWidth: 'var(--content-max)', margin: '96px auto 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p className="section-title" style={{ marginBottom: 12 }}>Portfolio</p>
            <h2 className="display-md">Active Research</h2>
          </div>
          <Link to="/new" className="btn btn-ghost" style={{ marginBottom: 6 }}>
            <Plus size={14} /> New Project
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '64px 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--ink-4)', fontSize: 14 }}>Loading projects…</p>
          </div>
        ) : projects.length === 0 ? (
          <div style={{ padding: '64px 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--ink-4)', fontSize: 16, marginBottom: 16 }}>No projects yet.</p>
            <Link to="/new" className="btn btn-primary">Start First Analysis</Link>
          </div>
        ) : (
          projects.map((p, i) => (
            <ResearchRow key={p.id} project={p} forecasts={forecasts[p.id]} index={i} />
          ))
        )}
      </section>

      {/* ══════════════════════════════════════════════
          RESISTANCE TRAJECTORY — full width chart
          ══════════════════════════════════════════════ */}
      <section style={{ padding: '0 var(--page-px)', maxWidth: 'var(--content-max)', margin: '120px auto 0' }}>
        <div style={{ marginBottom: 40 }}>
          <p className="section-title" style={{ marginBottom: 12 }}>Platform Overview</p>
          <h2 className="display-md">Resistance Trajectory</h2>
          <p className="body-md" style={{ marginTop: 12 }}>
            Probability of resistance over time — all active candidates.
          </p>
        </div>

        <TrajectoryChart forecasts={allForecasts} />
      </section>

      {/* ══════════════════════════════════════════════
          BOTTOM — Intel + Top Candidate
          ══════════════════════════════════════════════ */}
      <section style={{
        padding: '120px var(--page-px)',
        maxWidth: 'var(--content-max)',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: 80,
        alignItems: 'start',
      }}>
        {/* Recent intelligence */}
        <div>
          <p className="section-title" style={{ marginBottom: 24 }}>Recent Intelligence</p>
          {INTEL.map((item, i) => <IntelItem key={i} {...item} />)}
        </div>

        {/* Top candidate */}
        <div>
          <p className="section-title" style={{ marginBottom: 24 }}>Top Candidate</p>
          {topCandidate ? (
            <Link
              to={`/forecast/${topCandidate.id}`}
              style={{ display: 'block', textDecoration: 'none' }}
            >
              <div
                className="card"
                style={{ cursor: 'pointer', transition: 'border-color 0.18s' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(11,223,160,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
              >
                <div style={{ marginBottom: 24 }}>
                  <p className="mono" style={{ fontSize: 12, color: 'var(--teal)', marginBottom: 6 }}>
                    {topCandidate.molecule?.chemical_name || topCandidate.molecule_name || 'Candidate'}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>{topCandidate.pest?.species_name || topCandidate.pest_name || 'Organism'}</p>
                </div>
                <div className="divider-med" style={{ marginBottom: 24 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-5)', marginBottom: 4 }}>Durability</p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--teal)', letterSpacing: '-0.03em' }}>
                      {Math.round((topCandidate.durability_score || 0.5) * 100)}
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-4)' }}>/100</span>
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-5)', marginBottom: 4 }}>Years</p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em' }}>
                      {topCandidate.estimated_years_to_resistance?.toFixed(1) || '—'}
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-4)' }}>y</span>
                    </p>
                  </div>
                </div>
                <div className="divider-med" style={{ marginBottom: 20 }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className={`risk-label risk-${(topCandidate.risk_tier || 'moderate').toLowerCase() === 'moderate' ? 'moderate' : (topCandidate.risk_tier || 'moderate').toLowerCase()}`}>
                    {topCandidate.risk_tier || 'Analysis'} risk
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Open Report <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <div style={{ color: 'var(--ink-4)', fontSize: 14 }}>No candidates yet.</div>
          )}
        </div>
      </section>

    </div>
  );
}
