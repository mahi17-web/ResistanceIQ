import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Layers, Dna, Calendar, Users, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.ts';
import { Project } from '../../api/types.ts';

interface ProjectDetailDrawerProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectDetailDrawer: React.FC<ProjectDetailDrawerProps> = ({ project, onClose }) => {
  const { data: forecasts } = useQuery({
    queryKey: ['forecasts', project?.id],
    queryFn: () => (project ? api.getForecasts(project.id) : []),
    enabled: !!project,
  });

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl h-full bg-[#0B1017] border-l border-white/[0.08] p-8 flex flex-col justify-between overflow-y-auto shadow-2xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded bg-[#0BDFA0]/10 text-[#0BDFA0] border border-[#0BDFA0]/20 text-xs font-mono">
              {project.status}
            </span>
            <button onClick={onClose} className="text-[#7C8A9A] hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">{project.name}</h2>
            <p className="text-sm text-[#9AACBE] leading-relaxed">
              {project.description || 'No description recorded for this research program.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs">
            <div>
              <span className="text-[#7C8A9A] block mb-1">Created Date</span>
              <span className="font-mono text-[#F1F5F9]">
                {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-[#7C8A9A] block mb-1">Total Candidates</span>
              <span className="font-mono text-[#0BDFA0] font-bold">
                {forecasts?.length ?? 0} Simulated
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#F1F5F9]">Simulated Candidates</h3>
              <Link
                to="/new"
                onClick={onClose}
                className="text-xs text-[#0BDFA0] hover:underline font-mono flex items-center gap-1"
              >
                + Add Candidate <ArrowUpRight size={13} />
              </Link>
            </div>

            {forecasts && forecasts.length > 0 ? (
              <div className="space-y-3">
                {forecasts.map((fc) => (
                  <div
                    key={fc.id}
                    className="p-4 rounded-xl bg-[#05070B] border border-white/[0.04] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <Dna size={16} className="text-[#0BDFA0]" />
                      <div>
                        <div className="font-mono font-semibold text-[#F1F5F9]">
                          Forecast #{fc.id.slice(0, 8)}
                        </div>
                        <div className="text-[#7C8A9A] mt-0.5">
                          {fc.estimated_years_to_resistance ? `${fc.estimated_years_to_resistance} yrs horizon` : 'Pending'}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded font-mono uppercase text-[11px] ${
                        fc.risk_tier === 'LOW'
                          ? 'bg-[#0BDFA0]/10 text-[#0BDFA0]'
                          : fc.risk_tier === 'MODERATE'
                          ? 'bg-[#F3B14D]/10 text-[#F3B14D]'
                          : 'bg-[#E85D7A]/10 text-[#E85D7A]'
                      }`}
                    >
                      {fc.risk_tier || 'MODERATE'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-white/[0.01] border border-white/[0.04] text-xs text-[#7C8A9A]">
                No candidate evaluations created in this project yet.
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between">
          <Link
            to="/comparison"
            onClick={onClose}
            className="btn btn-primary text-xs w-full justify-center"
          >
            Compare All In Project
          </Link>
        </div>
      </div>
    </div>
  );
};
