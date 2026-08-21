import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { getHistoricalCases, getBacktestAccuracy, ensureAuthenticated } from '../api/client.js';
import BacktestScatter from '../components/charts/BacktestScatter.jsx';

function SortIcon({ col, sortKey, dir }) {
  if (sortKey !== col) return <Minus size={10} style={{ color: 'var(--ink-5)' }} />;
  return dir === 'asc'
    ? <ChevronUp  size={12} style={{ color: 'var(--teal)' }} />
    : <ChevronDown size={12} style={{ color: 'var(--teal)' }} />;
}

export default function Backtest() {
  const [cases, setCases]       = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [sortKey, setSortKey]   = useState('actual_years');
  const [sortDir, setSortDir]   = useState('asc');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        await ensureAuthenticated();
        const [c, a] = await Promise.all([getHistoricalCases(), getBacktestAccuracy()]);
        setCases(c || []);
        setAccuracy(a || null);
      } catch (err) {
        console.error('Failed to load backtests', err);
        setCases([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sorted = [...cases].sort((a, b) => {
    const v = sortDir === 'asc' ? 1 : -1;
    return a[sortKey] > b[sortKey] ? v : -v;
  });
  const toggleSort = (k) => {
    if (sortKey === k) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  };

  return (
    <div className="page-bg" style={{ minHeight: '100vh' }}>
      <div style={{ padding: '80px var(--page-px) 120px', maxWidth: 'var(--content-max)', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 80 }}>
          <p className="section-title" style={{ marginBottom: 12 }}>Validation</p>
          <h1 className="display-lg">Model Validation</h1>
          <p className="body-lg" style={{ maxWidth: 560, marginTop: 20 }}>
            Accuracy assessment against {accuracy?.total_cases ?? '—'} historical resistance cases
            from APRD and IRAC public databases.
          </p>
          <div style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="mono" style={{ fontSize: 12, color: 'var(--ink-4)' }}>{accuracy?.model_version}</span>
            <span style={{ color: 'var(--ink-5)' }}>·</span>
            <span className="status-online">
              <span className="status-dot" />
              Validated
            </span>
          </div>
        </div>

        {/* ── Key stats — editorial, no cards ── */}
        {loading ? (
          <div style={{ padding: '40px 0' }}>
            <p style={{ color: 'var(--ink-4)', fontSize: 14 }}>Loading…</p>
          </div>
        ) : (
          <>
            {/* Large stat row */}
            <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', marginBottom: 80 }}>
              {[
                { value: `${accuracy?.mean_absolute_error ?? '0.0'}y`, label: 'Mean Absolute Error', sub: 'lower is better', color: 'var(--teal)' },
                { value: `${accuracy?.within_1yr_pct ?? '0.0'}%`,  label: 'Within ±1 Year',  sub: 'of all cases', color: 'var(--ink)' },
                { value: `${accuracy?.within_3yr_pct ?? '0.0'}%`,  label: 'Within ±3 Years', sub: 'of all cases', color: 'var(--ink)' },
                { value: `${accuracy?.within_5yr_pct ?? '0.0'}%`,  label: 'Within ±5 Years', sub: 'of all cases', color: 'var(--teal)' },
              ].map((s, i, arr) => (
                <div
                  key={s.label}
                  style={{
                    flex: 1,
                    padding: '48px 0',
                    paddingLeft: i === 0 ? 0 : 32,
                    paddingRight: i === arr.length - 1 ? 0 : 32,
                    borderRight: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none',
                    textAlign: i === 0 ? 'left' : i === arr.length - 1 ? 'right' : 'center',
                  }}
                >
                  <p style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 800, letterSpacing: '-0.04em', color: s.color, lineHeight: 1 }}>
                    {s.value}
                  </p>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--ink-4)', marginTop: 10 }}>
                    {s.label}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--ink-5)', marginTop: 3 }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Scatter + Model history side-by-side ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 64, marginBottom: 96, alignItems: 'start' }}>
              {/* Scatter */}
              <div>
                <p className="section-title" style={{ marginBottom: 16 }}>Predicted vs. Actual</p>
                <p style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 32 }}>
                  Diagonal = perfect prediction. Points above = underestimate; below = overestimate. Shaded band = ±2 year tolerance.
                </p>
                <div className="divider-med" style={{ marginBottom: 1 }} />
                <BacktestScatter cases={cases} height={360} />
                <div className="divider-med" />
              </div>

              {/* Model version history */}
              <div>
                <p className="section-title" style={{ marginBottom: 20 }}>Model History</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  {accuracy.version_history?.map((v) => {
                    const isCurrent = v.version === 'v0.3-mvp';
                    const maxMae    = 2.14;
                    const barWidth  = Math.max(8, (1 - v.mae / maxMae) * 100);
                    return (
                      <div key={v.version}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: isCurrent ? 'var(--teal)' : 'var(--ink-3)' }}>
                              {v.version}
                            </span>
                            {isCurrent && (
                              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--teal)', border: '1px solid rgba(11,223,160,0.25)', borderRadius: 4, padding: '2px 6px' }}>
                                CURRENT
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: isCurrent ? 'var(--teal)' : 'var(--ink-4)' }}>
                            MAE {v.mae}y
                          </span>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${barWidth}%`, background: isCurrent ? 'var(--teal)' : 'var(--ink-5)', animation: 'progressFill 0.8s cubic-bezier(0.16,1,0.3,1) both' }}
                          />
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--ink-5)', marginTop: 6 }}>{v.within_3yr}% within ±3yr</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Historical cases table ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p className="section-title" style={{ marginBottom: 8 }}>Dataset</p>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Historical Cases</h2>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink-4)' }}>{cases.length} records · APRD & IRAC</p>
              </div>

              <div style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Pesticide</th>
                        <th>Pest</th>
                        <th>Target</th>
                        <th className="sortable" onClick={() => toggleSort('deployment_year')}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            Deployed <SortIcon col="deployment_year" sortKey={sortKey} dir={sortDir} />
                          </span>
                        </th>
                        <th className="sortable" onClick={() => toggleSort('actual_years')}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            Actual <SortIcon col="actual_years" sortKey={sortKey} dir={sortDir} />
                          </span>
                        </th>
                        <th className="sortable" onClick={() => toggleSort('predicted_years')}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            Predicted <SortIcon col="predicted_years" sortKey={sortKey} dir={sortDir} />
                          </span>
                        </th>
                        <th>Error</th>
                        <th>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((c) => {
                        const err      = Math.abs(c.error_margin);
                        const errColor = err <= 1 ? 'var(--teal)' : err <= 2 ? 'var(--risk-mod)' : 'var(--risk-critical)';
                        return (
                          <tr key={c.id}>
                            <td>
                              <p style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>{c.pesticide_name}</p>
                              <p className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 2 }}>{c.aprd_id}</p>
                            </td>
                            <td style={{ fontSize: 13, color: 'var(--ink-2)' }}>{c.pest_name}</td>
                            <td style={{ fontSize: 12, color: 'var(--ink-4)', maxWidth: 120 }}>{c.target_name}</td>
                            <td style={{ fontSize: 13, color: 'var(--ink-3)' }}>{c.deployment_year}</td>
                            <td style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{c.actual_years}y</td>
                            <td style={{ fontSize: 14, fontWeight: 700, color: 'var(--violet)' }}>{c.predicted_years}y</td>
                            <td>
                              <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: errColor }}>±{err.toFixed(1)}y</span>
                            </td>
                            <td>
                              <span className={`source-tag ${c.source.toLowerCase()}`}>{c.source}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
