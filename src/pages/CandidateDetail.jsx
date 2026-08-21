import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Plus, Loader2 } from 'lucide-react';
import { getForecast, exportForecast } from '../api/client.js';
import DurabilityGauge from '../components/charts/DurabilityGauge.jsx';
import RiskCurveChart from '../components/charts/RiskCurveChart.jsx';
import MutationHeatmap from '../components/charts/MutationHeatmap.jsx';
import DurabilityScoreCard from '../components/ui/DurabilityScoreCard.jsx';
import Badge from '../components/ui/Badge.jsx';
import useProjectStore from '../store/projectStore.js';

/** 2-D binding site SVG schematic */
function BindingSiteSchematic({ hotspots }) {
  const cx = 160; const cy = 110; const rx = 120; const ry = 80;
  const list = hotspots || [
    { residue: 'G119S', delta_delta_g: 3.42, risk: 'critical' },
    { residue: 'F331W', delta_delta_g: 1.85, risk: 'moderate' },
    { residue: 'F290V', delta_delta_g: 2.15, risk: 'high' },
    { residue: 'W86A', delta_delta_g: 0.45, risk: 'low' },
    { residue: 'Y133F', delta_delta_g: 0.90, risk: 'low' },
  ];
  const placed = list.map((h, i) => {
    const angle = (i / list.length) * 2 * Math.PI - Math.PI / 2;
    const x = cx + (rx * 0.85) * Math.cos(angle);
    const y = cy + (ry * 0.85) * Math.sin(angle);
    return { ...h, x, y };
  });
  const riskColor = { critical: '#f43f5e', high: '#fb923c', moderate: '#f59e0b', low: '#10d9a0' };

  return (
    <svg viewBox="0 0 320 220" className="w-full max-w-sm mx-auto">
      <defs>
        <radialGradient id="pocket-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(16,217,160,0.08)" />
          <stop offset="100%" stopColor="rgba(16,217,160,0.01)" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#pocket-fill)" stroke="rgba(16,217,160,0.2)" strokeWidth={1.5} strokeDasharray="6 4" />
      <text x={cx} y={cy + 5} textAnchor="middle" fill="rgba(16,217,160,0.3)" fontSize={10} fontWeight={600} fontFamily="Inter">Binding Pocket</text>
      <circle cx={cx} cy={cy} r={14} fill="rgba(99,102,241,0.2)" stroke="rgba(99,102,241,0.5)" strokeWidth={1.5} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#6366f1" fontSize={8} fontWeight={700} fontFamily="Inter">MOL</text>
      {placed.map((h) => (
        <g key={h.residue}>
          <line x1={cx} y1={cy} x2={h.x} y2={h.y} stroke={`${riskColor[h.risk] || '#10d9a0'}30`} strokeWidth={1} />
          <circle cx={h.x} cy={h.y} r={10} fill={`${riskColor[h.risk] || '#10d9a0'}25`} stroke={riskColor[h.risk] || '#10d9a0'} strokeWidth={1.5} />
          <text x={h.x} y={h.y + 3.5} textAnchor="middle" fill={riskColor[h.risk] || '#10d9a0'} fontSize={7} fontWeight={700} fontFamily="JetBrains Mono, monospace">
            {h.residue.replace(/[0-9]/g, '')}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToComparison = useProjectStore((s) => s.addToComparison);
  const addNotification = useProjectStore((s) => s.addNotification);

  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [tab, setTab] = useState('risk');

  useEffect(() => {
    async function load() {
      try {
        const data = await getForecast(id);
        setForecast(data);
      } catch (err) {
        console.error('Failed to load forecast', err);
        setForecast(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleExport(format = 'pdf') {
    if (!forecast?.id) return;
    try {
      setExporting(true);
      addNotification({ type: 'info', message: 'Generating export dossier...', detail: `${forecast.molecule?.chemical_name || 'Candidate'} (${format.toUpperCase()})` });
      const result = await exportForecast(forecast.id, format);
      addNotification({ type: 'success', message: 'Dossier downloaded', detail: result.filename });
    } catch (err) {
      console.error('Export failed:', err);
      addNotification({ type: 'error', message: 'Export failed', detail: err.message });
    } finally {
      setExporting(false);
    }
  }

  if (loading) return (
    <div className="flex-1 p-8 space-y-6">
      <div className="skeleton h-8 w-48 rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-64 rounded-xl" />)}
      </div>
    </div>
  );

  if (!forecast) {
    return (
      <div className="flex-1 p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#f0f4ff]">Candidate Forecast Not Found</h2>
        <p className="text-sm text-[#64748b]">The requested candidate forecast record does not exist or has been removed.</p>
        <Link to="/comparison" className="btn btn-primary inline-flex">
          Back to Comparison
        </Link>
      </div>
    );
  }

  const molName = forecast.molecule?.chemical_name || forecast.molecule_name || `Candidate ${forecast.id?.slice(0, 6)}`;
  const targetName = forecast.target?.name || forecast.target_name || 'Target Protein';
  const pestName = forecast.pest?.species_name || forecast.pest_name || 'Pest Organism';
  
  let riskCurve = forecast.risk_curve;
  if (!riskCurve && forecast.risk_trajectory_json) {
    try {
      riskCurve = typeof forecast.risk_trajectory_json === 'string'
        ? JSON.parse(forecast.risk_trajectory_json)
        : forecast.risk_trajectory_json;
    } catch {
      // ignore
    }
  }
  if (!riskCurve || !Array.isArray(riskCurve)) {
    riskCurve = Array.from({ length: 8 }, (_, i) => ({
      year: i + 1,
      resistance_probability: Math.min(0.97, (1 - (forecast.durability_score || 0.5)) * Math.exp(i * 0.25) * 0.1),
    }));
  }

  let hotspots = forecast.mutation_hotspots;
  if (!hotspots && forecast.mutagenesis_hotspots_json) {
    try {
      hotspots = typeof forecast.mutagenesis_hotspots_json === 'string'
        ? JSON.parse(forecast.mutagenesis_hotspots_json)
        : forecast.mutagenesis_hotspots_json;
    } catch {
      // ignore
    }
  }

  const isOOD = forecast.status === 'OUT_OF_DOMAIN';

  return (
    <div className="flex-1 p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn btn-ghost p-2">
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#f0f4ff]">{molName}</h1>
              <Badge tier={forecast.risk_tier || 'moderate'} />
            </div>
            <p className="text-xs text-[#64748b] mt-0.5">
              {targetName} · {pestName} · {forecast.created_at ? new Date(forecast.created_at).toLocaleDateString() : 'Recent'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => addToComparison(forecast.id)}>
            <Plus size={14} /> Compare
          </button>
          <button id="export-report-btn" className="btn btn-primary" onClick={() => handleExport('pdf')} disabled={exporting}>
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {isOOD && (
        <div style={{ padding: '16px 20px', background: 'rgba(243,177,77,0.08)', border: '1px solid rgba(243,177,77,0.3)', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ color: '#F3B14D', fontWeight: 'bold' }}>⚠</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#F3B14D' }}>Insufficient model support for this candidate</p>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.5 }}>
              Candidate scaffold is novel and outside the verified applicability domain of the resistance forecasting model. Conformal uncertainty bounds reflect out-of-domain baseline bounds.
            </p>
          </div>
        </div>
      )}

      {/* Top row: Gauge + Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-6 flex flex-col items-center justify-center gap-3 animate-fade-up">
          <DurabilityGauge score={forecast.durability_score ?? 0.5} size={160} />
          <p className="text-xs text-[#64748b] text-center">
            Estimated Durability: <span className="text-[#f0f4ff] font-mono">{forecast.estimated_years_to_resistance?.toFixed(1) || '—'} Years</span>
          </p>
        </div>
        <div className="md:col-span-2 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <DurabilityScoreCard forecast={{ ...forecast, molecule_name: molName, target_name: targetName, pest_name: pestName }} />
        </div>
      </div>

      {/* Tabbed charts */}
      <div className="glass rounded-xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex border-b border-[rgba(255,255,255,0.07)] px-2 pt-2">
          {[
            { key: 'risk', label: 'Risk Curve' },
            { key: 'heatmap', label: 'Mutation Heatmap' },
            { key: 'binding', label: 'Binding Site' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${tab === key
                  ? 'border-[#10d9a0] text-[#10d9a0]'
                  : 'border-transparent text-[#64748b] hover:text-[#f0f4ff]'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'risk' && (
            <div>
              <p className="text-xs text-[#64748b] mb-4">
                Probability of resistance fixation in population by year.
                Dashed line = 50% threshold (typically observed field resistance).
              </p>
              <RiskCurveChart data={riskCurve} height={280} />
            </div>
          )}
          {tab === 'heatmap' && (
            <div>
              <p className="text-xs text-[#64748b] mb-4">
                In-silico mutagenesis scan of binding site residues.
                Color = risk tier; hover for ΔΔG and fitness cost.
              </p>
              <MutationHeatmap hotspots={hotspots} />
            </div>
          )}
          {tab === 'binding' && (
            <div>
              <p className="text-xs text-[#64748b] mb-4">
                2D schematic of binding pocket residues. Molecule shown centrally; residues colored by resistance risk.
              </p>
              <BindingSiteSchematic hotspots={hotspots} />
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div className="glass rounded-lg px-4 py-3 space-y-1">
                  <p className="text-[#64748b] font-semibold">Binding Site Fragility</p>
                  <p className="text-lg font-black capitalize" style={{
                    color: (forecast.fragility_summary?.binding_site_fragility === 'critical' || forecast.risk_tier === 'CRITICAL') ? '#f43f5e' :
                      (forecast.fragility_summary?.binding_site_fragility === 'high' || forecast.risk_tier === 'HIGH') ? '#fb923c' :
                        '#10d9a0'
                  }}>
                    {forecast.fragility_summary?.binding_site_fragility || forecast.risk_tier?.toLowerCase() || 'moderate'}
                  </p>
                </div>
                <div className="glass rounded-lg px-4 py-3 space-y-1">
                  <p className="text-[#64748b] font-semibold">Model Version</p>
                  <p className="text-[#f0f4ff] font-mono font-bold">{forecast.model_version || 'v1.0.0-ridge-ecfp4'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <Link to="/comparison" className="btn btn-secondary text-xs">
          View Comparison Across All Candidates →
        </Link>
      </div>
    </div>
  );
}
