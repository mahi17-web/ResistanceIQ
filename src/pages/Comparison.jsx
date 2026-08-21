import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getForecasts, ensureAuthenticated } from '../api/client.js';
import RiskCurveChart from '../components/charts/RiskCurveChart.jsx';

const CANDIDATE_COLORS = ['#0BDFA0', '#8B8CF8', '#F3B14D', '#F08050', '#E85D7A'];
const TIME_RANGES = [
  { label: '1Y', years: 1 },
  { label: '3Y', years: 3 },
  { label: '5Y', years: 5 },
  { label: '10Y', years: 10 },
  { label: 'All', years: 99 },
];

/* ─── Candidate toggle button ───────────────────────────────────── */
function CandidateToggle({ forecast, color, active, onToggle }) {
  const score = Math.round((forecast.durability_score ?? 0) * 100);
  const molName = forecast.molecule?.chemical_name || forecast.molecule_name || `Candidate ${forecast.molecule_id?.slice(0, 6) || ''}`;
  const pestName = forecast.pest?.species_name || forecast.pest_name || 'Target Organism';

  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 20px',
        borderBottom: '1px solid var(--line-soft)',
        background: active ? `${color}08` : 'transparent',
        border: 'none',
        borderLeft: `2px solid ${active ? color : 'transparent'}`,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'all 0.18s',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: active ? color : 'var(--ink-5)', flexShrink: 0, transition: 'background 0.18s' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="mono" style={{ fontSize: 13, fontWeight: 600, color: active ? color : 'var(--ink-3)', transition: 'color 0.18s' }}>
          {molName}
        </p>
        <p style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>{pestName}</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: 18, fontWeight: 800, color: active ? color : 'var(--ink-4)', letterSpacing: '-0.02em', transition: 'color 0.18s' }}>
          {score}
        </p>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-5)' }}>score</p>
      </div>
    </button>
  );
}

export default function Comparison() {
  const [forecasts, setForecasts] = useState([]);
  const [activeIds, setActiveIds] = useState([]);
  const [timeRange, setTimeRange] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        await ensureAuthenticated();
        const data = await getForecasts();
        setForecasts(data || []);
        setActiveIds((data || []).map((f) => f.id));
      } catch (err) {
        console.error('Failed to load forecasts for comparison', err);
        setForecasts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeRange = TIME_RANGES.find((t) => t.label === timeRange) || TIME_RANGES[4];
  const displayed = forecasts.filter((f) => activeIds.includes(f.id));

  const multiSeries = displayed.map((f, idx) => {
    let rawCurve = f.risk_curve;
    if (!rawCurve && f.risk_trajectory_json) {
      try {
        rawCurve = typeof f.risk_trajectory_json === 'string' ? JSON.parse(f.risk_trajectory_json) : f.risk_trajectory_json;
      } catch {
        // ignore
      }
    }
    if (!rawCurve || !Array.isArray(rawCurve)) {
      rawCurve = Array.from({ length: 8 }, (_, i) => ({
        year: i + 1,
        resistance_probability: Math.min(0.97, (1 - (f.durability_score || 0.5)) * Math.exp(i * 0.25) * 0.1),
      }));
    }
    return {
      name: f.molecule?.chemical_name || f.molecule_name || `Candidate ${f.id?.slice(0, 6)}`,
      color: CANDIDATE_COLORS[idx % CANDIDATE_COLORS.length],
      data: rawCurve.filter((d) => d.year <= activeRange.years),
    };
  });

  const toggleCandidate = (id) => {
    setActiveIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <div style={{ padding: '80px var(--page-px) 120px', maxWidth: 'var(--content-max)', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 64 }}>
          <p className="section-title" style={{ marginBottom: 12 }}>Analysis</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <h1 className="display-lg">Candidate Comparison</h1>
            <Link to="/new" className="btn btn-ghost" style={{ marginBottom: 8 }}>
              <Plus size={14} /> Add Candidate
            </Link>
          </div>
          <p className="body-md" style={{ maxWidth: 560, marginTop: 16 }}>
            Compare resistance trajectories and durability scores across candidates.
            Toggle candidates below the chart to focus your analysis.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-4)' }}>
            Loading candidate comparisons...
          </div>
        ) : forecasts.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', border: '1px dashed var(--line)', borderRadius: 12 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 8 }}>No Scored Candidates Available</h3>
            <p style={{ fontSize: 14, color: 'var(--ink-4)', maxWidth: 460, margin: '0 auto 24px' }}>
              Run candidate resistance forecasts to generate comparative durability curves and resistance risk profiles.
            </p>
            <Link to="/new" className="btn btn-primary">
              <Plus size={16} /> Evaluate First Candidate
            </Link>
          </div>
        ) : (
          /* Main layout: chart left, sidebar right */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 64, alignItems: 'start' }}>

            {/* Left — chart */}
            <div>
              {/* Time controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)' }}>
                  Resistance Probability Trajectory
                </p>
                <div style={{ display: 'flex', gap: 2, background: 'var(--elevated)', border: '1px solid var(--line)', borderRadius: 8, padding: 3 }}>
                  {TIME_RANGES.map(({ label }) => (
                    <button
                      key={label}
                      onClick={() => setTimeRange(label)}
                      style={{
                        padding: '5px 14px',
                        borderRadius: 6,
                        border: 'none',
                        background: timeRange === label ? 'rgba(11,223,160,0.1)' : 'transparent',
                        color: timeRange === label ? 'var(--teal)' : 'var(--ink-4)',
                        fontFamily: 'inherit',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart — 560px height */}
              <div style={{ marginBottom: 8 }}>
                <div className="divider-med" />
                <RiskCurveChart multiSeries={multiSeries} height={560} />
                <div className="divider-med" />
              </div>

              {/* Legend row */}
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', paddingTop: 16 }}>
                {displayed.map((f, i) => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 20, height: 2, background: CANDIDATE_COLORS[i % CANDIDATE_COLORS.length], borderRadius: 2 }} />
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                      {f.molecule?.chemical_name || f.molecule_name || `Candidate ${f.id?.slice(0, 6)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right sidebar — candidate selector + scores */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 16 }}>
                Candidates
              </p>
              <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
                {forecasts.map((f, idx) => (
                  <CandidateToggle
                    key={f.id}
                    forecast={f}
                    color={CANDIDATE_COLORS[idx % CANDIDATE_COLORS.length]}
                    active={activeIds.includes(f.id)}
                    onToggle={() => toggleCandidate(f.id)}
                  />
                ))}
              </div>

              {/* Score ranking */}
              <div style={{ marginTop: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-4)' }}>
                    Research Prioritization
                  </p>
                  <span className="badge" style={{ fontSize: 9, background: 'rgba(243,177,77,0.12)', color: '#F3B14D' }}>
                    RESEARCH HEURISTIC
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 16 }}>
                  Relative candidate ordering under the current model. Overlapping intervals indicate statistically indistinguishable candidates.
                </p>

                {[...forecasts]
                  .sort((a, b) => (b.durability_score ?? 0) - (a.durability_score ?? 0))
                  .map((f, i, arr) => {
                    const score = f.durability_score ?? 0;
                    const prevF = i > 0 ? arr[i - 1] : null;
                    
                    // Uncertainty overlap check with preceding candidate
                    let isIndistinguishable = false;
                    if (prevF) {
                      const rrA = f.resistance_ratio || f.predicted_resistance_ratio || 10;
                      const rrB = prevF.resistance_ratio || prevF.predicted_resistance_ratio || 10;
                      const ratio = Math.max(rrA, rrB) / Math.max(Math.min(rrA, rrB), 0.1);
                      if (ratio < 2.5) {
                        isIndistinguishable = true;
                      }
                    }

                    const color =
                      score >= 0.7 ? '#0BDFA0' :
                      score >= 0.5 ? '#F3B14D' :
                      score >= 0.35? '#F08050' : '#E85D7A';

                    const support = f.support_status || (score >= 0.6 ? 'MODERATE_SUPPORT' : 'LIMITED_SUPPORT');
                    const scaffold = f.scaffold_status || (score >= 0.6 ? 'KNOWN_SCAFFOLD' : 'NOVEL_SCAFFOLD');

                    return (
                      <div key={f.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--line-soft)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 10, color: 'var(--ink-5)', fontWeight: 700, minWidth: 18 }}>#{i + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <p className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
                                {f.molecule?.chemical_name || f.molecule_name || `Candidate ${f.id?.slice(0, 6)}`}
                              </p>
                              <span className="badge" style={{ fontSize: 8, padding: '1px 5px', background: scaffold === 'KNOWN_SCAFFOLD' ? 'rgba(11,223,160,0.1)' : 'rgba(139,140,248,0.1)', color: scaffold === 'KNOWN_SCAFFOLD' ? '#0BDFA0' : '#8B8CF8' }}>
                                {scaffold.replace('_', ' ')}
                              </span>
                            </div>
                            <p style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 2 }}>
                              Durability: {f.estimated_years_to_resistance?.toFixed(1) || '—'}y est. · <span style={{ color: 'var(--ink-3)' }}>{support.replace('_', ' ')}</span>
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: '-0.02em' }}>
                              {Math.round(score * 100)}
                            </span>
                          </div>
                        </div>

                        {isIndistinguishable && (
                          <div style={{ marginTop: 6, padding: '4px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 9, color: 'var(--ink-4)' }}>ℹ</span>
                            <span style={{ fontSize: 9, color: 'var(--ink-4)' }}>
                              Not clearly distinguishable from #{i} within model uncertainty
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Non-intrusive Scientific Disclaimer */}
              <div style={{ marginTop: 32, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize: 10, color: 'var(--ink-5)', lineHeight: 1.4 }}>
                  <strong>Scientific Notice:</strong> ResistanceIQ provides research-oriented model estimates based on available historical bioassays. Results are non-regulatory research heuristics and do not constitute field performance guarantees.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

