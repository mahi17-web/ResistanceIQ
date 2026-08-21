import Badge from './Badge.jsx';
import clsx from 'clsx';

function getScoreColor(score) {
  if (score >= 0.7) return '#10d9a0';
  if (score >= 0.5) return '#f59e0b';
  if (score >= 0.35) return '#fb923c';
  return '#f43f5e';
}

/**
 * Summary card showing durability score, estimated resistance years, tier badge, and confidence interval.
 * @param {{ forecast: object, compact?: boolean }} props
 */
export default function DurabilityScoreCard({ forecast, compact = false }) {
  if (!forecast) return null;
  const {
    durability_score: score,
    estimated_years_to_resistance: years,
    risk_tier,
    confidence_interval,
    molecule_name,
    target_name,
    pest_name,
    fragility_summary,
  } = forecast;

  const color = getScoreColor(score);
  const pct = Math.round(score * 100);

  return (
    <div
      className={clsx(
        'glass rounded-xl transition-shadow overflow-hidden',
        compact ? 'p-4' : 'p-6',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#64748b] mb-0.5">Durability Score</p>
          <h3 className="text-sm font-semibold text-[#f0f4ff] truncate">{molecule_name}</h3>
          {!compact && (
            <p className="text-[11px] text-[#64748b] mt-0.5 truncate">vs {target_name} · {pest_name}</p>
          )}
        </div>
        <Badge tier={risk_tier} size={compact ? 'sm' : 'md'} />
      </div>

      {/* Score display */}
      <div className="flex items-end gap-4 mb-4">
        <div>
          <span className="text-5xl font-black leading-none" style={{ color }}>
            {pct}
          </span>
          <span className="text-xl font-bold text-[#334155] ml-0.5">/100</span>
        </div>
        <div className="pb-1">
          <p className="text-xl font-bold text-[#f0f4ff] leading-tight">{years?.toFixed(1)}y</p>
          <p className="text-[11px] text-[#64748b]">est. to resistance</p>
        </div>
      </div>

      {/* Score bar */}
      <div className="progress-track mb-1">
        <div className="progress-fill transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)` }} />
      </div>

      {/* Confidence interval */}
      {confidence_interval && (
        <p className="text-[10px] text-[#64748b] mb-4">
          95% CI: {confidence_interval[0].toFixed(1)}–{confidence_interval[1].toFixed(1)} years
        </p>
      )}

      {/* Fragility summary */}
      {!compact && fragility_summary && (
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          {[
            { label: 'High Risk', count: fragility_summary.high_risk_mutations,     color: '#f43f5e' },
            { label: 'Moderate',  count: fragility_summary.moderate_risk_mutations,  color: '#f59e0b' },
            { label: 'Low Risk',  count: fragility_summary.low_risk_mutations,        color: '#10d9a0' },
          ].map(({ label, count, color: c }) => (
            <div key={label} className="text-center">
              <p className="text-lg font-bold" style={{ color: c }}>{count}</p>
              <p className="text-[10px] text-[#64748b]">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
