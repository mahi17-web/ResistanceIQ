import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import Badge from './Badge.jsx';

function parseRiskCurve(f) {
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
  return curve;
}

function Sparkline({ data, color }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.resistance_probability || 0.1));
  const pts = data.map((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * 60;
    const y = 18 - ((d.resistance_probability || 0) / (max || 1)) * 16;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="62" height="20" viewBox="0 0 62 20" className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const COLS = [
  { key: 'molecule_name',                    label: 'Molecule'       },
  { key: 'target_name',                      label: 'Target'         },
  { key: 'pest_name',                        label: 'Pest'           },
  { key: 'durability_score',                 label: 'Score'          },
  { key: 'estimated_years_to_resistance',    label: 'Est. Years'     },
  { key: 'risk_tier',                        label: 'Risk Tier'      },
  { key: 'risk_curve',                       label: 'Risk Curve'     },
];

function getSortValue(row, key) {
  return row[key] ?? '';
}

/**
 * Sortable comparison table for multiple forecast results.
 * @param {{ forecasts: object[] }} props
 */
export default function ComparisonTable({ forecasts }) {
  const [sortKey, setSortKey] = useState('durability_score');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...(forecasts ?? [])].sort((a, b) => {
    const av = getSortValue(a, sortKey);
    const bv = getSortValue(b, sortKey);
    if (typeof av === 'number' && typeof bv === 'number')
      return sortDir === 'asc' ? av - bv : bv - av;
    return sortDir === 'asc'
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  const scoreColor = (score) => {
    if (score >= 0.7) return '#10d9a0';
    if (score >= 0.5) return '#f59e0b';
    if (score >= 0.35) return '#fb923c';
    return '#f43f5e';
  };

  if (!forecasts?.length) {
    return (
      <div className="glass rounded-xl p-10 flex flex-col items-center gap-3 text-center">
        <p className="text-base font-semibold text-[#f0f4ff]">No candidates to compare yet</p>
        <p className="text-sm text-[#64748b]">Add candidates from the New Candidate page to see them here.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              {COLS.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => key !== 'risk_curve' && handleSort(key)}
                  className={key !== 'risk_curve' ? 'cursor-pointer select-none group' : ''}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    {key === sortKey && (
                      sortDir === 'desc'
                        ? <ChevronDown size={12} className="text-[#10d9a0]" />
                        : <ChevronUp   size={12} className="text-[#10d9a0]" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((f, i) => {
              const color = scoreColor(f.durability_score);
              return (
                <tr key={f.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <td>
                    <p className="text-sm font-semibold text-[#f0f4ff]">{f.molecule_name}</p>
                    <p className="text-[10px] text-[#64748b] font-mono">{f.id}</p>
                  </td>
                  <td>
                    <p className="text-sm text-[#f0f4ff] max-w-[140px] truncate">{f.target_name}</p>
                  </td>
                  <td>
                    <p className="text-sm text-[#f0f4ff]">{f.pest_name}</p>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold" style={{ color }}>
                        {Math.round(f.durability_score * 100)}
                      </span>
                      <div className="w-16 progress-track">
                        <div className="progress-fill" style={{ width: `${Math.round(f.durability_score * 100)}%`, background: color }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm font-semibold text-[#f0f4ff]">
                      {f.estimated_years_to_resistance?.toFixed(1)}y
                    </span>
                  </td>
                  <td>
                    <Badge tier={f.risk_tier} size="sm" />
                  </td>
                  <td>
                    <Sparkline data={parseRiskCurve(f)} color={color} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
