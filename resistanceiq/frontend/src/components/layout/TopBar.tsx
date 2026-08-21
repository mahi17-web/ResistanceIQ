import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Database, Cpu, User as UserIcon, LogOut } from 'lucide-react';
import { api } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { CommandPalette } from '../ui/CommandPalette.tsx';

export const TopBar: React.FC = () => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const { user, logout } = useAuth();

  const { data: health } = useQuery({
    queryKey: ['system-health'],
    queryFn: api.getHealth,
    refetchInterval: 15000,
  });

  // Global hotkey Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isOnline = health?.status === 'HEALTHY' || health?.database_connected;
  const statusText = health?.status === 'HEALTHY' ? 'ONLINE' : isOnline ? 'DEGRADED' : 'OFFLINE';

  return (
    <>
      <header className="topbar h-14 border-b border-white/[0.06] flex items-center justify-between px-8 bg-[#05070B]/80 backdrop-blur-md sticky top-0 z-30">
        {/* Left: Global Search Button */}
        <button
          onClick={() => setIsPaletteOpen(true)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-[#7C8A9A] hover:border-white/[0.12] transition-colors group"
        >
          <Search size={14} className="group-hover:text-white transition-colors" />
          <span>Quick search or action...</span>
          <kbd className="ml-2 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-[#4E6078]">
            ⌘K
          </kbd>
        </button>

        {/* Right: Live System Health & User Profile */}
        <div className="flex items-center gap-6 text-xs font-mono">
          {/* ML Health Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
            <span
              className={`w-2 h-2 rounded-full ${
                statusText === 'ONLINE' ? 'bg-[#0BDFA0]' : statusText === 'DEGRADED' ? 'bg-[#F3B14D]' : 'bg-[#E85D7A]'
              }`}
            />
            <span className="text-[#9AACBE] font-semibold">{statusText}</span>
          </div>

          {/* User Email & Logout */}
          <div className="flex items-center gap-3 pl-4 border-l border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#0BDFA0]/10 flex items-center justify-center text-[#0BDFA0] font-sans font-bold text-[10px]">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <span className="text-[#9AACBE] font-sans text-xs">{user?.email}</span>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="text-[#7C8A9A] hover:text-[#E85D7A] transition-colors p-1"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </>
  );
};
