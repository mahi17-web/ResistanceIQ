import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar.jsx';
import TopBar from './components/layout/TopBar.jsx';
import NotificationTray from './components/ui/Notification.jsx';
import CommandPalette from './components/ui/CommandPalette.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewCandidate from './pages/NewCandidate.jsx';
import CandidateDetail from './pages/CandidateDetail.jsx';
import Comparison from './pages/Comparison.jsx';
import Backtest from './pages/Backtest.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';
import SecuritySettings from './pages/SecuritySettings.jsx';
import UserManagement from './pages/UserManagement.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import useProjectStore from './store/projectStore.js';
import { getCurrentUser } from './api/client.js';

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();

  const user = useProjectStore((s) => s.user);
  const authStatus = useProjectStore((s) => s.authStatus);
  const setUser = useProjectStore((s) => s.setUser);
  const setOrg = useProjectStore((s) => s.setOrg);
  const setAuthStatus = useProjectStore((s) => s.setAuthStatus);

  // Global Ctrl+K shortcut
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setPaletteOpen((o) => !o);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Auth Bootstrap on App Mount
  useEffect(() => {
    let isMounted = true;
    async function bootstrapAuth() {
      const token = localStorage.getItem('riq_auth_token') || localStorage.getItem('riq_token');
      if (!token) {
        if (isMounted) {
          setAuthStatus('unauthenticated');
        }
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (isMounted) {
          if (currentUser) {
            setUser(currentUser);
            if (currentUser.organization) {
              setOrg(currentUser.organization);
            }
            setAuthStatus('authenticated');
          } else {
            setAuthStatus('unauthenticated');
          }
        }
      } catch {
        if (isMounted) {
          setAuthStatus('unauthenticated');
        }
      }
    }
    bootstrapAuth();
    return () => {
      isMounted = false;
    };
  }, [setUser, setOrg, setAuthStatus]);

  // Check if current route is an unauthenticated public route
  const isAuthRoute =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password';

  // Loading Splash Screen while checking initial token
  if (authStatus === 'loading' && !isAuthRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#030712] text-slate-400">
        <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs tracking-wider uppercase font-semibold text-slate-300">
          Initializing ResistanceIQ Session...
        </p>
      </div>
    );
  }

  // If on auth route, render clean standalone layout
  if (isAuthRoute) {
    return (
      <div className="page-bg min-h-screen">
        <NotificationTray />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  // If unauthenticated and trying to access protected route, redirect to /login
  if (!user && authStatus === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="page-bg min-h-screen">
      {/* Global notification tray */}
      <NotificationTray />

      {/* Global command palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Minimal 72px Command Nav Rail */}
      <Sidebar />

      {/* Main content area offset by nav rail */}
      <div className="main-area flex flex-col flex-1 min-w-0">
        <TopBar onOpenPalette={() => setPaletteOpen(true)} />

        <main className="flex-1">
          <Routes>
            <Route path="/"                  element={<Dashboard />}        />
            <Route path="/new"               element={<NewCandidate />}     />
            <Route path="/new-candidate"     element={<NewCandidate />}     />
            <Route path="/candidates/new"    element={<NewCandidate />}     />
            <Route path="/candidate/new"     element={<NewCandidate />}     />
            <Route path="/forecast/:id"      element={<CandidateDetail />}   />
            <Route path="/forecast"          element={<CandidateDetail />}   />
            <Route path="/comparison"        element={<Comparison />}       />
            <Route path="/backtest"          element={<Backtest />}         />
            <Route path="/reports"           element={<Reports />}          />
            <Route path="/settings"          element={<Settings />}         />
            <Route path="/profile"           element={<Profile />}          />
            <Route path="/settings/security" element={<SecuritySettings />} />
            <Route path="/settings/users"    element={<UserManagement />}   />
            <Route path="*"                  element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
