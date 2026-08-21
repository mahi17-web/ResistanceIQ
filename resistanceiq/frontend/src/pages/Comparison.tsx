import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Layers, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client.ts';

export const ComparisonPage: React.FC = () => {
  const { data: forecasts, isLoading } = useQuery({
    queryKey: ['forecasts-comparison'],
    queryFn: () => api.getForecasts(),
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Automatically select the first 2-3 candidates when loaded
  React.useEffect(() => {
    if (forecasts && forecasts.length > 0 && selectedIds.length === 0) {
      setSelectedIds(forecasts.slice(0, 3).map((f) => f.id));
    }
  }, [forecasts]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Build chart dataset
  const chartData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((year) => {
    const point: Record<string, any> = { year: `Yr ${year}` };
    forecasts?.forEach((fc) => {
      if (selectedIds.includes(fc.id) && fc.risk_trajectory_json) {
        try {
          const arr = JSON.parse(fc.risk_trajectory_json);
          const match = arr.find((p: any) => p.year === year);
          point[fc.id] = match ? match.resistance_probability * 100 : 0;
        } catch {
          point[fc.id] = 0;
        }
      }
    });
    return point;
  });

  const colors = ['#0BDFA0', '#8B8CF8', '#F3B14D', '#E85D7A', '#38BDF8'];

  return (
    <div className="page-wrap py-12">
      <div className="mb-12">
        <span className="section-title">Comparative Analysis</span>
        <h1 className="display-md mt-2">Candidate Durability Comparison</h1>
        <p className="text-sm text-[#9AACBE] mt-1 max-w-xl">
          Superimpose multi-year resistance evolution trajectories across chemical candidate pipelines.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-[#7C8A9A] font-mono">
          Loading comparison data...
        </div>
      ) : forecasts && forecasts.length > 0 ? (
        <div className="space-y-8">
          {/* Candidate Filter Pills */}
          <div className="flex flex-wrap gap-3">
            {forecasts.map((fc, idx) => {
              const isSelected = selectedIds.includes(fc.id);
              const color = colors[idx % colors.length];
              return (
                <button
                  key={fc.id}
                  onClick={() => toggleSelect(fc.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-mono flex items-center gap-2 border transition-colors ${
                    isSelected
                      ? 'bg-white/[0.06] border-white/[0.2] text-[#F1F5F9]'
                      : 'bg-transparent border-white/[0.06] text-[#7C8A9A]'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: isSelected ? color : '#4E6078' }}
                  />
                  <span>Forecast #{fc.id.slice(0, 8)}</span>
                  {isSelected && <CheckCircle2 size={13} className="text-[#0BDFA0]" />}
                </button>
              );
            })}
          </div>

          {/* Chart Viewport */}
          <div className="p-8 rounded-xl bg-[#0B1017] border border-white/[0.06]">
            <h3 className="text-sm font-semibold mb-6 uppercase tracking-wider text-[#7C8A9A]">
              10-Year Resistance Probability Trajectory (%)
            </h3>
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" stroke="#4E6078" fontSize={12} tickLine={false} />
                  <YAxis stroke="#4E6078" fontSize={12} tickLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1017',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  {forecasts
                    .filter((fc) => selectedIds.includes(fc.id))
                    .map((fc, idx) => (
                      <Line
                        key={fc.id}
                        type="monotone"
                        dataKey={fc.id}
                        name={`Forecast #${fc.id.slice(0, 8)}`}
                        stroke={colors[idx % colors.length]}
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <Layers className="mx-auto mb-3 text-[#4E6078]" size={32} />
          <p className="text-[#9AACBE]">No candidate forecasts available for comparison.</p>
        </div>
      )}
    </div>
  );
};
