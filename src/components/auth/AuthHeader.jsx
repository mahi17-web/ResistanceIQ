import { Link } from 'react-router-dom';
import { Dna, ArrowRight } from 'lucide-react';

export default function AuthHeader({ mode = 'register' }) {
  return (
    <header
      style={{
        height: 64,
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(3, 6, 9, 0.75)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(24px, 6vw, 80px)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        width: '100%',
      }}
    >
      {/* Left: Platform Identity */}
      <Link
        to="/"
        className="flex items-center gap-3.5 no-underline group select-none cursor-pointer"
        aria-label="ResistanceIQ Platform Home"
      >
        <div
          className="brand-logo-mark flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
          style={{ width: 38, height: 38, minWidth: 38, minHeight: 38, borderRadius: 10 }}
        >
          <Dna size={20} color="#020609" strokeWidth={2.6} />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[15.5px] font-bold tracking-tight text-[#F1F5F9] transition-colors group-hover:text-white">
            Resistance<span className="text-[#0BDFA0]">IQ</span>
          </span>
          <span className="hidden md:inline-block text-[10px] font-semibold text-[#7C8A9A] uppercase tracking-[0.12em] pl-2.5 border-l border-white/10">
            SCIENTIFIC INTELLIGENCE PLATFORM
          </span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0BDFA0]/10 text-[#0BDFA0] border border-[#0BDFA0]/20">
            V2.0 PRO
          </span>
        </div>
      </Link>

      {/* Right: Operational Status & Contextual Navigation */}
      <div className="flex items-center gap-6 text-xs">
        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-[#7C8A9A]">
          <span className="status-dot" style={{ background: '#0BDFA0', boxShadow: '0 0 10px rgba(11, 223, 160, 0.6)' }} />
          <span className="tracking-wider text-[#9AACBE]">SYSTEM OPERATIONAL</span>
        </div>

        <div className="flex items-center gap-2 text-[#9AACBE] sm:pl-5 sm:border-l border-white/10">
          {mode === 'register' ? (
            <>
              <span className="hidden sm:inline text-[#7C8A9A]">Already registered?</span>
              <Link
                to="/login"
                id="auth-header-signin-link"
                className="text-[#0BDFA0] font-semibold hover:text-[#38BDF8] inline-flex items-center gap-1.5 transition-colors group text-[13px]"
              >
                <span>Sign In</span>
                <ArrowRight size={13} className="transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            </>
          ) : (
            <>
              <span className="hidden sm:inline text-[#7C8A9A]">Need a workspace?</span>
              <Link
                to="/register"
                id="auth-header-register-link"
                className="text-[#0BDFA0] font-semibold hover:text-[#38BDF8] inline-flex items-center gap-1.5 transition-colors group text-[13px]"
              >
                <span>Create Account</span>
                <ArrowRight size={13} className="transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
