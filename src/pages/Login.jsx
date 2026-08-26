import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Dna,
  X,
} from 'lucide-react';
import { login, forgotPassword } from '../api/client.js';
import useProjectStore from '../store/projectStore.js';
import AuthHeader from '../components/auth/AuthHeader.jsx';
import AuthBackground, { AmbientMolecularNetwork } from '../components/auth/AuthBackground.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useProjectStore((s) => s.setUser);
  const setOrg = useProjectStore((s) => s.setOrg);
  const setAuthStatus = useProjectStore((s) => s.setAuthStatus);
  const addNotification = useProjectStore((s) => s.addNotification);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');

  const redirectUrl = location.state?.from || '/';

  // Rotate loading states during real asynchronous login
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingPhase((p) => (p + 1) % 3);
    }, 700);
    return () => clearInterval(interval);
  }, [isLoading]);

  const loadingMessages = [
    'Authenticating...',
    'Loading workspace...',
    'Preparing research environment...',
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both corporate email and password.');
      return;
    }

    setLoadingPhase(0);
    setIsLoading(true);
    try {
      const data = await login(email.trim(), password);
      if (data.user) {
        setUser(data.user);
        if (data.user.organization) {
          setOrg(data.user.organization);
        }
        setAuthStatus('authenticated');
        addNotification({
          title: 'Workspace Restored',
          message: `Signed in as ${data.user.full_name || data.user.email}`,
          type: 'success',
        });
        navigate(redirectUrl, { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Incorrect email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      const res = await forgotPassword(forgotEmail.trim());
      setForgotSuccess(res?.message || 'Password reset instructions dispatched.');
    } catch {
      setForgotSuccess('If an active account exists, password reset instructions have been dispatched.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <AuthBackground>
      <AuthHeader mode="login" />

      <main
        className="flex-1 w-full max-w-[1440px] mx-auto flex flex-col justify-center items-center"
        style={{
          padding: 'clamp(32px, 5vw, 64px) clamp(20px, 5.5vw, 80px) clamp(48px, 6vw, 84px)',
        }}
      >
        {/* Asymmetric Continuous Scientific Workspace Layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* ═══════════════════════════════════════════════════════════════
              LEFT COLUMN: EDITORIAL SCIENTIFIC IDENTITY (~48% Width)
              ═══════════════════════════════════════════════════════════════ */}
          <div className="order-2 lg:order-1 lg:col-span-6 flex flex-col justify-between space-y-8 max-w-[500px]">
            
            {/* Header & Editorial Hero */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0BDFA0]" />
                <span className="mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#0BDFA0]">
                  SCIENTIFIC INTELLIGENCE PLATFORM
                </span>
              </div>

              <h1
                className="text-white font-extrabold tracking-tight"
                style={{
                  fontSize: 'clamp(40px, 4.2vw, 64px)',
                  lineHeight: 0.98,
                  letterSpacing: '-0.03em',
                  fontWeight: 750,
                }}
              >
                Return to the <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #0BDFA0 0%, #38BDF8 60%, #8B8CF8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  intelligence layer.
                </span>
              </h1>

              <p
                className="text-sm leading-relaxed text-[#9AACBE]"
                style={{ maxWidth: 440, fontSize: 14.5 }}
              >
                Continue your resistance forecasting, molecular evaluation,
                and research workspace.
              </p>
            </div>

            {/* 3 Compact Capability Metadata Lines */}
            <div className="space-y-3.5 pt-1">
              
              {/* Line 01 */}
              <div className="pb-3 border-b border-white/[0.04] space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="mono text-[11px] font-bold text-[#0BDFA0]">01</span>
                  <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#F1F5F9]">
                    Resistance Forecasting
                  </span>
                </div>
                <p className="text-[12.5px] text-[#7C8A9A] pl-5">
                  Temporal inference · uncertainty modeling
                </p>
              </div>

              {/* Line 02 */}
              <div className="pb-3 border-b border-white/[0.04] space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="mono text-[11px] font-bold text-[#38BDF8]">02</span>
                  <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#F1F5F9]">
                    Molecular Intelligence
                  </span>
                </div>
                <p className="text-[12.5px] text-[#7C8A9A] pl-5">
                  Chemical resolution · target mapping
                </p>
              </div>

              {/* Line 03 */}
              <div className="pb-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="mono text-[11px] font-bold text-[#8B8CF8]">03</span>
                  <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#F1F5F9]">
                    Research Reproducibility
                  </span>
                </div>
                <p className="text-[12.5px] text-[#7C8A9A] pl-5">
                  Immutable datasets · model lineage
                </p>
              </div>
            </div>

            {/* Live Scientific Telemetry Visual */}
            <div className="hidden sm:flex justify-start pt-1">
              <AmbientMolecularNetwork />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              RIGHT COLUMN: SECURE RESEARCH TERMINAL PANEL (~52% Width)
              ═══════════════════════════════════════════════════════════════ */}
          <div className="order-1 lg:order-2 lg:col-span-6 flex justify-center lg:justify-end w-full">
            <div
              className="w-full max-w-[480px] rounded-[26px] border relative transition-all duration-300"
              style={{
                background: 'rgba(6, 10, 16, 0.82)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                borderColor: 'rgba(255, 255, 255, 0.07)',
                borderRadius: 26,
                padding: 'clamp(28px, 4vw, 44px)',
                boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.75), inset 0 1px 0 0 rgba(255, 255, 255, 0.09), 0 0 32px rgba(11, 223, 160, 0.02)',
              }}
            >
              {/* Header inside Panel */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <div
                    className="brand-logo-mark flex items-center justify-center"
                    style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, borderRadius: 8 }}
                  >
                    <Dna size={16} color="#020609" strokeWidth={2.6} />
                  </div>
                  <div>
                    <span className="text-[14.5px] font-bold text-white tracking-tight">
                      Resistance<span className="text-[#0BDFA0]">IQ</span>
                    </span>
                    <p className="text-[9px] font-semibold text-[#7C8A9A] uppercase tracking-[0.12em]">
                      SCIENTIFIC INTELLIGENCE PLATFORM
                    </p>
                  </div>
                </div>

                <div className="pt-1 space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Sign in to your workspace
                  </h2>
                  <p className="text-xs sm:text-[13px] text-[#7C8A9A]">
                    Continue to your research environment.
                  </p>
                </div>
              </div>

              {/* Inline Error Banner */}
              {errorMessage && (
                <div
                  className="mb-5 p-3 rounded-xl flex items-start gap-2.5 text-xs animate-fade-in"
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                  }}
                  role="alert"
                >
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                  <div className="flex-1 leading-relaxed">{errorMessage}</div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4" noValidate>
                
                {/* Email Field */}
                <div className="space-y-1">
                  <label
                    htmlFor="login-email-input"
                    className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8FA0B5]"
                  >
                    Corporate / Research Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66758A] pointer-events-none"
                    />
                    <input
                      id="login-email-input"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="scientist@organization.bio"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-[52px] rounded-[11px] text-[14px] text-[#E8EEF5] placeholder:text-[#66758A] mono transition-all outline-none"
                      style={{
                        background: 'rgba(255, 255, 255, 0.018)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        paddingLeft: 44,
                        paddingRight: 16,
                      }}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label
                      htmlFor="login-password-input"
                      className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8FA0B5]"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      id="login-forgot-password-link"
                      className="text-xs text-[#7C8A9A] hover:text-[#0BDFA0] transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66758A] pointer-events-none"
                    />
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-[52px] rounded-[11px] text-[14px] text-[#E8EEF5] placeholder:text-[#66758A] mono transition-all outline-none"
                      style={{
                        background: 'rgba(255, 255, 255, 0.018)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        paddingLeft: 44,
                        paddingRight: 44,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C8A9A] hover:text-[#F1F5F9] transition-colors p-1 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Remember Checkbox */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 text-[#0BDFA0] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-[#8FA0B5]">Remember this workstation</span>
                  </label>
                </div>

                {/* Primary Sign In Button */}
                <div className="pt-2">
                  <button
                    id="login-submit-btn"
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-[54px] rounded-[13px] font-bold text-sm text-[#020609] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-[#0BDFA0]/15 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #0BDFA0 0%, #00B27A 50%, #38BDF8 100%)',
                    }}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#020609] border-t-transparent rounded-full animate-spin" />
                        <span>{loadingMessages[loadingPhase]}</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to ResistanceIQ</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>

                {/* Footer Switch */}
                <div className="mt-5 pt-4 border-t border-white/[0.05] text-center">
                  <p className="text-xs text-[#7C8A9A]">
                    Need a workspace?{' '}
                    <Link
                      to="/register"
                      className="text-[#0BDFA0] font-semibold hover:text-[#38BDF8] transition-colors inline-flex items-center gap-1"
                    >
                      <span>Create Account</span>
                      <ArrowRight size={12} />
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>

        </div>
      </main>

      {/* Forgot Password Terminal Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-md p-7 rounded-[24px] border relative space-y-4"
            style={{
              background: 'rgba(8, 13, 20, 0.95)',
              borderColor: 'rgba(255, 255, 255, 0.09)',
              boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.8), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Reset Password</h3>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="text-[#7C8A9A] hover:text-white transition-colors p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#9AACBE] leading-relaxed">
              Enter your corporate email address. If an active account exists, a secure single-use password reset token will be dispatched.
            </p>

            {forgotSuccess ? (
              <div className="p-4 rounded-xl bg-[#0BDFA0]/10 border border-[#0BDFA0]/30 text-[#0BDFA0] text-xs flex items-start gap-2.5 my-2">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{forgotSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4 pt-1">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8FA0B5]">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="scientist@organization.bio"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full h-[48px] px-3.5 rounded-[10px] text-sm text-[#E8EEF5] placeholder:text-[#66758A] mono outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(false)}
                    className="px-4 py-2.5 rounded-[10px] text-xs font-semibold text-[#9AACBE] hover:text-white bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2.5 rounded-[10px] text-xs font-bold text-[#020609] bg-[#0BDFA0] hover:bg-[#00B27A] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {forgotLoading ? 'Dispatching...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}

            {forgotSuccess && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="px-5 py-2.5 rounded-[10px] text-xs font-bold text-[#020609] bg-[#0BDFA0] hover:bg-[#00B27A] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AuthBackground>
  );
}
