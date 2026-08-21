import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FlaskConical, GitCompare,
  ClipboardCheck, FileText, Settings, Dna,
} from 'lucide-react';
import useProjectStore from '../../store/projectStore.js';

const NAV_ITEMS = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/new',        icon: FlaskConical,    label: 'New Candidate' },
  { to: '/comparison', icon: GitCompare,      label: 'Comparison' },
  { to: '/backtest',   icon: ClipboardCheck,  label: 'Backtest' },
  { to: '/reports',    icon: FileText,        label: 'Reports' },
];

export default function Sidebar() {
  const org = useProjectStore((s) => s.org);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);

  const handleMouseEnter = () => {
    const timer = setTimeout(() => setIsExpanded(true), 280);
    setHoverTimeout(timer);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setIsExpanded(false);
  };

  return (
    <aside
      className={`sidebar ${isExpanded ? 'is-expanded' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="navigation"
      aria-label="Sidebar navigation"
    >
      {/* ── 1. Brand / Logo Area ── */}
      <NavLink
        to="/"
        className="sidebar-brand"
        aria-label="ResistanceIQ Home"
      >
        <div className="brand-logo-mark">
          <Dna size={19} color="#020609" strokeWidth={2.5} />
        </div>

        {isExpanded && (
          <div className="brand-text">
            <span className="brand-title">ResistanceIQ</span>
            <span className="brand-subtitle">{org?.name || 'Enterprise BioSciences'}</span>
          </div>
        )}
      </NavLink>

      {/* ── 2. Navigation Container ── */}
      <div className="sidebar-nav">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
            title={!isExpanded ? label : undefined}
            aria-label={label}
          >
            {({ isActive }) => (
              <>
                <Icon size={19} strokeWidth={isActive ? 2.3 : 1.8} />
                {isExpanded && <span className="nav-item-label">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* ── 3. Spacer ── */}
      <div className="sidebar-spacer" />

      {/* ── 4. Bottom Section: Settings & ML Pipeline ── */}
      <div className="sidebar-bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
          title={!isExpanded ? 'Settings' : undefined}
          aria-label="Settings"
        >
          {({ isActive }) => (
            <>
              <Settings size={19} strokeWidth={isActive ? 2.3 : 1.8} />
              {isExpanded && <span className="nav-item-label">Settings</span>}
            </>
          )}
        </NavLink>

        <div
          className="sidebar-pipeline"
          title={!isExpanded ? 'ML Pipeline · Online (v2.0-gbrt-ecfp4)' : undefined}
        >
          <div className="pipeline-dot" />
          {isExpanded && (
            <div className="pipeline-info">
              <span className="pipeline-title">ML Pipeline</span>
              <span className="pipeline-status">Online · v2.0-gbrt-ecfp4</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
