import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, CheckCircle, Database } from 'lucide-react';
import { api } from '../api/client.ts';

export const BacktestPage: React.FC = () => {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['backtest-summary'],
    queryFn: api.getBacktestSummary,
  });

  return (
    <div className="page-wrap py-12">
      <div className="mb-12">
        <span className="section-title">Empirical Benchmark Lab</span>
        <h1 className="display-md mt-2">Historical Backtest Calibration</h1>
        <p className="text-sm text-[#9AACBE] mt-1 max-w-xl">
          Validation of computational resistance forecasting models against Arthropod Pesticide
          Resistance Database (APRD) and IRAC ground truth field records.
        </p>
      </div>

      {/* Metric Strip */}
      <section className="border-y border-white/[0.08] py-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="text-3xl font-extrabold font-mono text-[#0BDFA0] mb-1">
              {isLoading ? '...' : `${summary?.mean_absolute_error ?? 0} yrs`}
            </div>
            <div className="text-xs text-[#7C8A9A] uppercase tracking-wider font-medium">
              Mean Absolute Error (MAE)
            </div>
          </div>

          <div>
            <div className="text-3xl font-extrabold font-mono text-[#F1F5F9] mb-1">
              {isLoading ? '...' : `${summary?.within_1yr_pct ?? 0}%`}
            </div>
            <div className="text-xs text-[#7C8A9A] uppercase tracking-wider font-medium">
              Within ±1.0 Year Accuracy
            </div>
          </div>

          <div>
            <div className="text-3xl font-extrabold font-mono text-[#8B8CF8] mb-1">
              {isLoading ? '...' : `${summary?.within_3yr_pct ?? 0}%`}
            </div>
            <div className="text-xs text-[#7C8A9A] uppercase tracking-wider font-medium">
              Within ±3.0 Years Accuracy
            </div>
          </div>

          <div>
            <div className="text-3xl font-extrabold font-mono text-[#F1F5F9] mb-1">
              {isLoading ? '...' : (summary?.total_cases ?? 0)}
            </div>
            <div className="text-xs text-[#7C8A9A] uppercase tracking-wider font-medium">
              Validated APRD Cases
            </div>
          </div>
        </div>
      </section>

      {/* Historical Cases Table */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-[#F1F5F9]">Historical Validation Cases</h2>
        {isLoading ? (
          <div className="py-12 text-center text-[#7C8A9A] font-mono">
            Loading APRD benchmark dataset...
          </div>
        ) : summary?.cases && summary.cases.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-[#0B1017]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[#7C8A9A] font-mono uppercase">
                  <th className="py-3 px-4">Pesticide</th>
                  <th className="py-3 px-4">APRD ID</th>
                  <th className="py-3 px-4">Pest Species</th>
                  <th className="py-3 px-4">Target Receptor</th>
                  <th className="py-3 px-4">Deployment</th>
                  <th className="py-3 px-4">Actual (yrs)</th>
                  <th className="py-3 px-4">Predicted (yrs)</th>
                  <th className="py-3 px-4 text-right">Error Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono">
                {summary.cases.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-[#F1F5F9]">
                      {c.pesticide_name}
                    </td>
                    <td className="py-3 px-4 text-[#7C8A9A]">{c.aprd_id}</td>
                    <td className="py-3 px-4 font-sans text-[#9AACBE]">{c.pest_name}</td>
                    <td className="py-3 px-4 text-[#7C8A9A]">{c.target_name}</td>
                    <td className="py-3 px-4 text-[#7C8A9A]">{c.deployment_year}</td>
                    <td className="py-3 px-4 text-[#F1F5F9] font-bold">{c.actual_years}</td>
                    <td className="py-3 px-4 text-[#0BDFA0] font-bold">{c.predicted_years}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        Math.abs(c.error_margin) <= 0.6
                          ? 'bg-[#0BDFA0]/10 text-[#0BDFA0]'
                          : 'bg-[#F3B14D]/10 text-[#F3B14D]'
                      }`}>
                        {c.error_margin > 0 ? `+${c.error_margin}` : c.error_margin} yrs
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-white/[0.02] border border-white/[0.06] text-[#7C8A9A]">
            No historical benchmark records in database.
          </div>
        )}
      </section>
    </div>
  );
};
