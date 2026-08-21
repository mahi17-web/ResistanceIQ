import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, ArrowUpRight, AlertCircle, RefreshCw, Dna, Layers, FolderPlus } from 'lucide-react';
import { api } from '../api/client.ts';
import { Project } from '../api/types.ts';
import { CreateProjectModal } from '../components/projects/CreateProjectModal.tsx';
import { ProjectDetailDrawer } from '../components/projects/ProjectDetailDrawer.tsx';

export const DashboardPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: api.getDashboardSummary,
  });

  return (
    <div className="page-wrap py-12">
      {/* ─── Hero Section ─── */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <span className="section-title">Scientific Intelligence Platform</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#0BDFA0]" />
          <span className="text-xs font-mono text-[#7C8A9A]">Resistance Durability Forecasting</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <h1 className="display-xl mb-4">
              Anticipate resistance.<br />
              <span className="text-[#0BDFA0]">Before field deployment.</span>
            </h1>
            <p className="text-lg text-[#9AACBE] max-w-2xl leading-relaxed">
              In-silico molecular docking, deep mutagenesis scanning, and Wright-Fisher population genetics
              simulations for agrochemical candidate evaluation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-secondary text-xs flex items-center gap-1.5"
            >
              <FolderPlus size={16} />
              <span>New Project</span>
            </button>
            <Link to="/new" className="btn btn-primary btn-cta">
              <Plus size={18} strokeWidth={2.5} />
              Evaluate Candidate
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Error State ─── */}
      {isError && (
        <div className="mb-12 p-6 rounded-2xl bg-[#E85D7A]/10 border border-[#E85D7A]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={24} className="text-[#E85D7A] flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-[#F1F5F9]">Unable to load dashboard data.</h3>
              <p className="text-xs text-[#E85D7A] mt-0.5">
                {(error as Error)?.message?.includes('Authentication') || (error as Error)?.message?.includes('401')
                  ? 'Your session may have expired.'
                  : (error as Error)?.message || 'Please try again or contact an administrator.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {((error as Error)?.message?.includes('Authentication') || (error as Error)?.message?.includes('401')) && (
              <Link to="/login" className="btn btn-primary text-xs">
                Sign in again
              </Link>
            )}
            <button
              onClick={() => refetch()}
              className="btn btn-secondary text-xs flex items-center gap-2"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Statistic Strip ─── */}
      <section className="border-y border-white/[0.08] py-8 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="text-4xl font-extrabold font-mono text-[#F1F5F9] mb-1">
              {isLoading ? (
                <div className="h-9 w-16 bg-white/[0.06] rounded animate-pulse" />
              ) : (
                summary?.total_projects ?? 0
              )}
            </div>
            <div className="text-xs text-[#7C8A9A] uppercase tracking-wider font-medium">
              Active Research Projects
            </div>
          </div>

          <div>
            <div className="text-4xl font-extrabold font-mono text-[#0BDFA0] mb-1">
              {isLoading ? (
                <div className="h-9 w-16 bg-white/[0.06] rounded animate-pulse" />
              ) : (
                summary?.total_forecasts ?? 0
              )}
            </div>
            <div className="text-xs text-[#7C8A9A] uppercase tracking-wider font-medium">
              Forecast Jobs Computed
            </div>
          </div>

          <div>
            <div className="text-4xl font-extrabold font-mono text-[#8B8CF8] mb-1">
              {isLoading ? (
                <div className="h-9 w-24 bg-white/[0.06] rounded animate-pulse" />
              ) : summary?.avg_durability_score ? (
                `${(summary.avg_durability_score * 10).toFixed(1)} / 10`
              ) : (
                '0.0'
              )}
            </div>
            <div className="text-xs text-[#7C8A9A] uppercase tracking-wider font-medium">
              Mean Portfolio Durability
            </div>
          </div>

          <div>
            <div className="text-4xl font-extrabold font-mono text-[#F1F5F9] mb-1">
              {isLoading ? (
                <div className="h-9 w-16 bg-white/[0.06] rounded animate-pulse" />
              ) : (
                summary?.validated_cases_count ?? 0
              )}
            </div>
            <div className="text-xs text-[#7C8A9A] uppercase tracking-wider font-medium">
              APRD Validated Benchmarks
            </div>
          </div>
        </div>
      </section>

      {/* ─── Active Research Programs ─── */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="display-md">Active Research Projects</h2>
          <span className="text-xs font-mono text-[#7C8A9A]">
            {summary?.active_projects?.length ?? 0} Programs Tracked
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : summary?.active_projects && summary.active_projects.length > 0 ? (
          <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {summary.active_projects.map((project, idx) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] px-4 -mx-4 rounded-lg transition-colors group cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <span className="font-mono text-xs text-[#4E6078] pt-1">
                    0{idx + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-[#F1F5F9] group-hover:text-[#0BDFA0] transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-[#7C8A9A] max-w-xl line-clamp-1 mt-1">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <span className="text-xs font-mono text-[#9AACBE]">
                      {project.forecast_count ?? 0} candidates
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-[#0BDFA0]">
                    {project.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <Layers className="mx-auto mb-3 text-[#4E6078]" size={32} />
            <p className="text-[#9AACBE] mb-2 font-medium">No research projects yet.</p>
            <p className="text-xs text-[#7C8A9A] mb-6">Start your first analysis to begin tracking candidate durability.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary"
            >
              <Plus size={16} /> + New Candidate
            </button>
          </div>
        )}
      </section>

      {/* ─── Recent Forecast Records ─── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="display-md">Recent Intelligence Forecasts</h2>
          <Link to="/comparison" className="text-xs text-[#0BDFA0] hover:underline font-mono flex items-center gap-1">
            Compare Candidates <ArrowUpRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : summary?.recent_forecasts && summary.recent_forecasts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.recent_forecasts.map((fc) => (
              <div
                key={fc.id}
                className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.06] flex flex-col justify-between hover:border-white/[0.14] transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Dna size={16} className="text-[#0BDFA0]" />
                    <span className="font-mono text-sm font-semibold text-[#F1F5F9]">
                      Forecast #{fc.id.slice(0, 8)}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
                    fc.risk_tier === 'LOW'
                      ? 'bg-[#0BDFA0]/10 text-[#0BDFA0] border border-[#0BDFA0]/20'
                      : fc.risk_tier === 'MODERATE'
                      ? 'bg-[#F3B14D]/10 text-[#F3B14D] border border-[#F3B14D]/20'
                      : 'bg-[#E85D7A]/10 text-[#E85D7A] border border-[#E85D7A]/20'
                  }`}>
                    {fc.risk_tier || 'UNCLASSIFIED'} RISK
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-white/[0.04] pt-4 mt-2">
                  <div>
                    <div className="text-xs text-[#7C8A9A]">Durability Score</div>
                    <div className="text-lg font-mono font-bold text-[#F1F5F9]">
                      {fc.durability_score ? (fc.durability_score * 100).toFixed(0) : '--'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#7C8A9A]">Est. Horizon</div>
                    <div className="text-lg font-mono font-bold text-[#F1F5F9]">
                      {fc.estimated_years_to_resistance ? `${fc.estimated_years_to_resistance} yrs` : '--'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#7C8A9A]">Binding Affinity</div>
                    <div className="text-lg font-mono font-bold text-[#F1F5F9]">
                      {fc.binding_affinity_kcal_mol ? `${fc.binding_affinity_kcal_mol} kcal/mol` : '--'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-white/[0.02] border border-white/[0.06] text-[#7C8A9A]">
            No forecast records found in database.
          </div>
        )}
      </section>

      {/* Modals & Drawers */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <ProjectDetailDrawer
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
};
