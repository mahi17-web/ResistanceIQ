import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, User, Shield, Users, LogOut, ChevronDown, Settings as SettingsIcon } from 'lucide-react';
import useProjectStore from '../../store/projectStore.js';
import { logout } from '../../api/client.js';

export default function TopBar({ onOpenPalette }) {
  const navigate = useNavigate();
  const user = useProjectStore((s) => s.user);
  const storeLogout = useProjectStore((s) => s.logout);
  const addNotification = useProjectStore((s) => s.addNotification);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await logout();
    storeLogout();
    addNotification({
      title: 'Signed Out',
      message: 'You have been securely signed out.',
      type: 'info',
    });
    navigate('/login', { replace: true });
  };

  const displayName = user?.full_name || user?.display_name || user?.name || user?.email || 'User';
  const roleDisplay = user?.role ? user.role.toUpperCase() : 'ANALYST';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isAdmin = user?.role === 'ADMIN';

  return (
    <header
      style={{
        height: 60,
        borderBottom: '1px solid var(--line)',
        background: 'rgba(5,7,11,0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--page-px)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Left — model status */}
      <div className="status-online">
        <span className="status-dot" />
        <span>ML Pipeline Online</span>
        <span style={{ color: 'var(--ink-5)', margin: '0 4px' }}>·</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>v2.0-gbrt-ecfp4</span>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Search trigger */}
        <button
          id="topbar-search-btn"
          onClick={onOpenPalette}
          aria-label="Open command palette (Ctrl+K)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '6px 12px',
            cursor: 'pointer',
            color: 'var(--ink-4)',
            fontSize: 12,
            fontFamily: 'inherit',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--line-med)';
            e.currentTarget.style.color = 'var(--ink-3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--line)';
            e.currentTarget.style.color = 'var(--ink-4)';
          }}
        >
          <Search size={13} />
          <span>Search</span>
          <kbd style={{
            fontSize: 10, background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--line)', borderRadius: 4,
            padding: '1px 5px', fontFamily: 'monospace', marginLeft: 4,
          }}>⌘K</kbd>
        </button>

        {/* User dropdown */}
        {user ? (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              id="topbar-user-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderLeft: '1px solid var(--line)',
                paddingLeft: 16,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0BDFA0, #8B8CF8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: '#020609', flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ lineHeight: 1.3 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </p>
                <p style={{ fontSize: 10, color: '#0BDFA0', fontWeight: 700, textTransform: 'uppercase' }}>
                  {roleDisplay}
                </p>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--ink-4)', marginLeft: 2 }} />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 12px)',
                  width: 220,
                  background: '#090e1a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                  padding: '6px',
                  zIndex: 100,
                }}
              >
                <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </p>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    color: '#e2e8f0',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                  className="hover:bg-white/5"
                >
                  <User size={14} style={{ color: '#0BDFA0' }} />
                  <span>My Profile</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    color: '#e2e8f0',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                  className="hover:bg-white/5"
                >
                  <SettingsIcon size={14} style={{ color: '#8B8CF8' }} />
                  <span>Account Settings</span>
                </Link>

                <Link
                  to="/settings/security"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    color: '#e2e8f0',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                  className="hover:bg-white/5"
                >
                  <Shield size={14} style={{ color: '#F59E0B' }} />
                  <span>Security & Password</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/settings/users"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#e2e8f0',
                      textDecoration: 'none',
                      transition: 'background 0.15s',
                    }}
                    className="hover:bg-white/5"
                  >
                    <Users size={14} style={{ color: '#38BDF8' }} />
                    <span>Team Management</span>
                  </Link>
                )}

                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                <button
                  id="topbar-signout-btn"
                  onClick={handleSignOut}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    color: '#f87171',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  className="hover:bg-red-500/10"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: '1px solid var(--line)', paddingLeft: 16 }}>
            <Link
              to="/login"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#020609',
                background: '#0BDFA0',
                padding: '6px 14px',
                borderRadius: 6,
                textDecoration: 'none',
              }}
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
