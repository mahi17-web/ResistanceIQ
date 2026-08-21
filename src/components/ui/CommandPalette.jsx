import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, FlaskConical, GitCompare,
  ClipboardCheck, FileText, Settings, Plus, ArrowRight,
  Dna,
} from 'lucide-react';
import { getProjects, getForecasts } from '../../api/client.js';

const NAV_ITEMS = [
  { label: 'Dashboard',     to: '/',           icon: LayoutDashboard, group: 'Navigation' },
  { label: 'New Candidate', to: '/new',         icon: FlaskConical,    group: 'Navigation' },
  { label: 'Comparison',    to: '/comparison',  icon: GitCompare,      group: 'Navigation' },
  { label: 'Backtest',      to: '/backtest',    icon: ClipboardCheck,  group: 'Navigation' },
  { label: 'Reports',       to: '/reports',     icon: FileText,        group: 'Navigation' },
  { label: 'Settings',      to: '/settings',    icon: Settings,        group: 'Navigation' },
];

const ACTIONS = [
  { label: 'New Candidate',   to: '/new',        icon: Plus,         group: 'Actions', desc: 'Run ML pipeline' },
  { label: 'Compare Molecules', to: '/comparison', icon: GitCompare, group: 'Actions', desc: 'Side-by-side durability' },
  { label: 'Run Backtest',    to: '/backtest',   icon: ClipboardCheck, group: 'Actions', desc: 'Model validation' },
  { label: 'Generate Report', to: '/reports',    icon: FileText,     group: 'Actions', desc: 'Export PDF / CSV' },
];

export default function CommandPalette({ open, onClose }) {
  const navigate    = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [projects, setProjects] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      getProjects().then((ps) => setProjects(ps || [])).catch(() => setProjects([]));
      getForecasts().then((fs) => setForecasts(fs || [])).catch(() => setForecasts([]));
    }
  }, [open]);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery('');
      setActiveIdx(0);
    }
  }

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setActiveIdx(0);
  }

  // Auto-focus input on open
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Build results filtered by query
  const results = useCallback(() => {
    const q = query.toLowerCase().trim();

    // Filter Navigation
    const nav = NAV_ITEMS.filter((n) =>
      !q || n.label.toLowerCase().includes(q)
    );

    // Filter Actions
    const actions = ACTIONS.filter((a) =>
      !q || a.label.toLowerCase().includes(q) || a.desc?.toLowerCase().includes(q)
    );

    // Filter Candidates/Forecasts
    const candidates = forecasts.filter((f) => {
      const name = f.molecule?.chemical_name || f.molecule_name || '';
      const pest = f.pest?.species_name || f.pest_name || '';
      return q && (name.toLowerCase().includes(q) || pest.toLowerCase().includes(q));
    }).slice(0, 4).map((f) => ({
      label: f.molecule?.chemical_name || f.molecule_name || `Candidate ${f.id?.slice(0, 6)}`,
      desc: `${f.pest?.species_name || f.pest_name || 'Organism'} · ${f.risk_tier || 'Analysis'}`,
      to: `/forecast/${f.id}`,
      icon: Dna,
      group: 'Candidates',
    }));

    // Filter Projects
    const projectItems = projects.filter((p) =>
      q && (p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
    ).slice(0, 3).map((p) => ({
      label: p.name,
      desc: p.description || 'Discovery Project',
      to: '/comparison',
      icon: FlaskConical,
      group: 'Projects',
    }));

    return [...nav, ...actions, ...candidates, ...projectItems];
  }, [query, forecasts, projects]);

  const items = results();

  const handleSelect = useCallback((item) => {
    if (!item) return;
    navigate(item.to);
    onClose();
  }, [navigate, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => (items.length ? (i + 1) % items.length : 0));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
      }
      if (e.key === 'Enter' && items[activeIdx]) {
        e.preventDefault();
        handleSelect(items[activeIdx]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, items, activeIdx, handleSelect, onClose]);

  if (!open) return null;

  // Group items by category
  const grouped = items.reduce((acc, item, idx) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push({ ...item, _idx: idx });
    return acc;
  }, {});

  return (
    <div
      className="palette-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Palette"
    >
      <div className="palette-panel" onClick={(e) => e.stopPropagation()}>
        {/* Search header with icon + input + ESC badge */}
        <div className="palette-header">
          <Search size={17} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="Search ResistanceIQ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search ResistanceIQ commands"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="palette-esc-badge">ESC</kbd>
        </div>

        {/* Search Results list */}
        <div className="palette-results-list">
          {items.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center' }}>
              <Search size={22} style={{ color: 'var(--ink-5)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)' }}>
                No results found
              </p>
              <p style={{ fontSize: 11, color: 'var(--ink-5)', marginTop: 4 }}>
                No ResistanceIQ commands or records match "{query}".
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([groupName, groupItems]) => (
              <div key={groupName} style={{ marginBottom: 6 }}>
                <p className="palette-section-header">{groupName}</p>
                {groupItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item._idx === activeIdx;
                  return (
                    <button
                      key={item._idx}
                      type="button"
                      className={`palette-item${isActive ? ' active' : ''}`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setActiveIdx(item._idx)}
                    >
                      <div className="palette-item-icon">
                        <Icon size={16} strokeWidth={2} />
                      </div>
                      <div className="palette-item-text">
                        <span className="palette-item-label">{item.label}</span>
                        {item.desc && (
                          <span className="palette-item-desc">{item.desc}</span>
                        )}
                      </div>
                      <ArrowRight size={13} className="palette-item-arrow" />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Compact Footer with Shortcuts */}
        <div className="palette-footer">
          <span className="palette-footer-hint">
            <kbd className="palette-kbd">↑↓</kbd>
            <span>Navigate</span>
          </span>
          <span className="palette-footer-hint">
            <kbd className="palette-kbd">↵</kbd>
            <span>Select</span>
          </span>
          <span className="palette-footer-hint">
            <kbd className="palette-kbd">ESC</kbd>
            <span>Close</span>
          </span>
        </div>
      </div>
    </div>
  );
}
