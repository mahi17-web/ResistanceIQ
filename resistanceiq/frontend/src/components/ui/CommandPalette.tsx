import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, FlaskConical, Dna, FileText, Settings, ShieldCheck, Plus, X } from 'lucide-react';
import { api } from '../../api/client.ts';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: api.getProjects });
  const { data: forecasts } = useQuery({ queryKey: ['forecasts'], queryFn: () => api.getForecasts() });

  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setQuery('');
      setActiveIdx(0);
    }
  }

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setActiveIdx(0);
  }

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const navItems: { label: string; to: string; icon: any; group: string; desc?: string }[] = [
    { label: 'Dashboard & Portfolio', to: '/', icon: FlaskConical, group: 'Navigation', desc: 'Overview & metrics' },
    { label: 'Evaluate New Candidate', to: '/new', icon: Plus, group: 'Actions', desc: 'Predict resistance' },
    { label: 'Candidate Comparison', to: '/comparison', icon: Dna, group: 'Navigation', desc: 'Trajectory analysis' },
    { label: 'Historical Backtest Calibration', to: '/backtest', icon: ShieldCheck, group: 'Navigation', desc: 'APRD benchmark lab' },
    { label: 'Research Reports & Dossiers', to: '/reports', icon: FileText, group: 'Navigation', desc: 'Exported dossiers' },
    { label: 'Workspace & ML Settings', to: '/settings', icon: Settings, group: 'Navigation', desc: 'Org & API config' },
  ];

  const results = useCallback(() => {
    const q = query.toLowerCase().trim();

    const filteredNav = navItems.filter((n) => !q || n.label.toLowerCase().includes(q));

    const projectItems = (projects || [])
      .filter((p) => q && (p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)))
      .slice(0, 3)
      .map((p) => ({
        label: p.name,
        desc: p.description || 'Active research program',
        to: `/comparison`,
        icon: FlaskConical,
        group: 'Projects',
      }));

    const forecastItems = (forecasts || [])
      .filter((f) => q && f.id.toLowerCase().includes(q))
      .slice(0, 3)
      .map((f) => ({
        label: `Forecast #${f.id.slice(0, 8)}`,
        desc: `${f.risk_tier || 'MODERATE'} Risk · ${f.estimated_years_to_resistance || 6} yrs`,
        to: `/comparison`,
        icon: Dna,
        group: 'Forecasts',
      }));

    return [...filteredNav, ...projectItems, ...forecastItems];
  }, [query, projects, forecasts]);

  const items = results();

  const handleSelect = useCallback(
    (item: any) => {
      if (!item) return;
      navigate(item.to);
      onClose();
    },
    [navigate, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => (items.length ? (i + 1) % items.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
      } else if (e.key === 'Enter' && items[activeIdx]) {
        e.preventDefault();
        handleSelect(items[activeIdx]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, items, activeIdx, handleSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl rounded-2xl bg-[#0B1017] border border-white/[0.12] shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
          <Search size={18} className="text-[#7C8A9A]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidates, research projects, or jump to route..."
            className="w-full bg-transparent text-sm text-[#F1F5F9] focus:outline-none font-sans"
          />
          <kbd className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-[#7C8A9A]">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-white/[0.02]">
          {items.length > 0 ? (
            items.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === activeIdx;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(item)}
                  className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-white/[0.06] text-[#0BDFA0]' : 'hover:bg-white/[0.02] text-[#F1F5F9]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center ${
                        isSelected ? 'bg-[#0BDFA0]/10 text-[#0BDFA0]' : 'bg-white/[0.04] text-[#7C8A9A]'
                      }`}
                    >
                      <Icon size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{item.label}</div>
                      {item.desc && <div className="text-[11px] text-[#7C8A9A] mt-0.5">{item.desc}</div>}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-[#4E6078] px-2 py-0.5 rounded bg-white/[0.02]">
                    {item.group}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-[#7C8A9A] font-mono">
              No matching commands or entities found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
