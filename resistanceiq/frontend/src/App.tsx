import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './context/ToastContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { TopBar } from './components/layout/TopBar.tsx';
import { DashboardPage } from './pages/Dashboard.tsx';
import { NewCandidatePage } from './pages/NewCandidate.tsx';
import { ComparisonPage } from './pages/Comparison.tsx';
import { BacktestPage } from './pages/Backtest.tsx';
import { ReportsPage } from './pages/Reports.tsx';
import { SettingsPage } from './pages/Settings.tsx';
import { LoginPage } from './pages/Login.tsx';
import { NotFoundPage } from './pages/NotFound.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#05070B] flex flex-col items-center justify-center gap-3 text-xs font-mono text-[#7C8A9A]">
        <div className="w-6 h-6 border-2 border-[#0BDFA0]/30 border-t-[#0BDFA0] rounded-full animate-spin" />
        <span>Authenticating cryptographic session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppShell: React.FC = () => {
  return (
    <ProtectedRoute>
      <div className="page-bg min-h-screen flex">
        {/* Approved Pure Flexbox Sidebar Rail (72px collapsed / 240px expanded) */}
        <Sidebar />

        {/* Main Layout Area */}
        <div className="main-area flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/new" element={<NewCandidatePage />} />
              <Route path="/comparison" element={<ComparisonPage />} />
              <Route path="/backtest" element={<BacktestPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/*" element={<AppShell />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};
