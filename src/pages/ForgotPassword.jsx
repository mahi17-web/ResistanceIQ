import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Check,
  Eye,
  EyeOff,
  Dna,
  RefreshCw,
} from 'lucide-react';
import { forgotPassword, verifyResetCode, resetPassword } from '../api/client.js';
import AuthHeader from '../components/auth/AuthHeader.jsx';
import AuthBackground, { AmbientMolecularNetwork } from '../components/auth/AuthBackground.jsx';

export default function ForgotPassword() {
  const navigate = useNavigate();

  // State Machine: 'EMAIL_ENTRY' | 'CODE_VERIFICATION' | 'NEW_PASSWORD' | 'SUCCESS'
  const [step, setStep] = useState('EMAIL_ENTRY');

  // Form Fields
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI / Status States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Resend cooldown timer (30 seconds)
  const [resendCooldown, setResendCooldown] = useState(0);

  // References for OTP 6-box input
  const digitRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  // Resend countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first digit box when switching to CODE_VERIFICATION
  useEffect(() => {
    if (step === 'CODE_VERIFICATION') {
      setTimeout(() => {
        digitRefs[0].current?.focus();
      }, 100);
    }
  }, [step]);

  // Password Complexity Validation Rules
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_=+~`[\]]/.test(newPassword);
  const isMatch = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);

  const passedRulesCount = useMemo(() => {
    return [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  }, [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial]);

  const strengthData = useMemo(() => {
    if (!newPassword) {
      return { label: 'EMPTY', color: 'bg-slate-800', text: 'text-slate-500', width: '0%' };
    }
    if (passedRulesCount <= 2) {
      return { label: 'WEAK', color: 'bg-rose-500', text: 'text-rose-400', width: '30%' };
    }
    if (passedRulesCount === 3) {
      return { label: 'FAIR', color: 'bg-amber-400', text: 'text-amber-300', width: '60%' };
    }
    if (passedRulesCount === 4) {
      return { label: 'STRONG', color: 'bg-cyan-400', text: 'text-cyan-300', width: '85%' };
    }
    return { label: 'EXCELLENT', color: 'bg-[#0BDFA0]', text: 'text-[#0BDFA0]', width: '100%' };
  }, [newPassword, passedRulesCount]);

  const isPasswordStrong = passedRulesCount === 5;

  // ── Step 1: Submit Email for Verification Code ─────────────────────────────
  const handleSendCode = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('[ForgotPassword] handleSendCode triggered with email:', email);
    setErrorMessage('');
    setInfoMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      console.warn('[ForgotPassword] Invalid email format:', cleanEmail);
      setErrorMessage('Please enter a valid research email address.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[ForgotPassword] Calling forgotPassword API...');
      const res = await forgotPassword(cleanEmail);
      console.log('[ForgotPassword] API success response:', res);
      setInfoMessage(res.message || 'Verification email requested. Check your inbox.');
      setStep('CODE_VERIFICATION');
      setResendCooldown(30);
    } catch (err) {
      console.error('[ForgotPassword] API error response:', err);
      setErrorMessage(
        err.message || "We couldn't send the verification email right now. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Handle 6-Digit OTP Box Interactions ────────────────────────────
  const handleDigitChange = (index, value) => {
    setErrorMessage('');
    const rawVal = value.replace(/\D/g, ''); // numeric only
    if (!rawVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    const char = rawVal.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);

    if (index < 5 && char) {
      digitRefs[index + 1].current?.focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitRefs[index - 1].current?.focus();
    }
  };

  const handleDigitPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pastedData.length, 5);
    digitRefs[nextIndex].current?.focus();
  };

  const fullOtpCode = otpDigits.join('');

  const handleVerifyCode = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage('');
    setInfoMessage('');

    if (fullOtpCode.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyResetCode(email.trim().toLowerCase(), fullOtpCode);
      if (res.reset_token) {
        setResetToken(res.reset_token);
        setStep('NEW_PASSWORD');
      }
    } catch (err) {
      setErrorMessage(
        err.message || 'Invalid or expired verification code. Please check your email and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3: Set New Password ───────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage('');

    if (!isPasswordStrong) {
      setErrorMessage('Password must satisfy all security complexity requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(resetToken, newPassword);
      setStep('SUCCESS');
    } catch (err) {
      setErrorMessage(
        err.message || 'Unable to reset password. Authorization token may have expired.'
      );
    } finally {
      setIsLoading(false);
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
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* LEFT COLUMN: EDITORIAL IDENTITY */}
          <div className="order-2 lg:order-1 lg:col-span-6 flex flex-col justify-between space-y-8 max-w-[500px]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0BDFA0]" />
                <span className="mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#0BDFA0]">
                  WORKSPACE SECURITY RECOVERY
                </span>
              </div>

              <h1
                className="text-white font-extrabold tracking-tight"
                style={{
                  fontSize: 'clamp(38px, 4.2vw, 58px)',
                  lineHeight: 1.02,
                  letterSpacing: '-0.03em',
                  fontWeight: 750,
                }}
              >
                Restore your <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #0BDFA0 0%, #38BDF8 60%, #8B8CF8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  research credentials.
                </span>
              </h1>

              <p
                className="text-sm leading-relaxed text-[#9AACBE]"
                style={{ maxWidth: 440, fontSize: 14.5 }}
              >
                Authorized security recovery protocol with cryptographic verification
                and zero plaintext token exposure.
              </p>
            </div>

            <div className="space-y-3.5 pt-1">
              <div className="pb-3 border-b border-white/[0.04] space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="mono text-[11px] font-bold text-[#0BDFA0]">01</span>
                  <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#F1F5F9]">
                    Identity Verification
                  </span>
                </div>
                <p className="text-[12.5px] text-[#7C8A9A] pl-5">
                  Single-use 6-digit cryptographic challenge
                </p>
              </div>

              <div className="pb-3 border-b border-white/[0.04] space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="mono text-[11px] font-bold text-[#38BDF8]">02</span>
                  <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#F1F5F9]">
                    Encrypted Delivery
                  </span>
                </div>
                <p className="text-[12.5px] text-[#7C8A9A] pl-5">
                  Direct SMTP TLS dispatch with 10-minute expiry
                </p>
              </div>

              <div className="pb-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="mono text-[11px] font-bold text-[#8B8CF8]">03</span>
                  <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#F1F5F9]">
                    Credential Provenance
                  </span>
                </div>
                <p className="text-[12.5px] text-[#7C8A9A] pl-5">
                  Bcrypt key derivation with full session revocation
                </p>
              </div>
            </div>

            <div className="hidden sm:flex justify-start pt-1">
              <AmbientMolecularNetwork />
            </div>
          </div>

          {/* RIGHT COLUMN: SECURITY TERMINAL PANEL */}
          <div className="order-1 lg:order-2 lg:col-span-6 flex justify-center lg:justify-end w-full">
            <div
              className="w-full max-w-[500px] rounded-[26px] border relative transition-all duration-300"
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
                      SECURITY TERMINAL
                    </p>
                  </div>
                </div>

                {step === 'EMAIL_ENTRY' && (
                  <div className="pt-1 space-y-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Forgot your password?
                    </h2>
                    <p className="text-xs sm:text-[13px] text-[#7C8A9A]">
                      Enter your registered research email and we'll send a secure verification code.
                    </p>
                  </div>
                )}

                {step === 'CODE_VERIFICATION' && (
                  <div className="pt-1 space-y-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Enter verification code
                    </h2>
                    <p className="text-xs sm:text-[13px] text-[#7C8A9A]">
                      We sent a 6-digit verification code to <span className="text-[#0BDFA0] font-mono">{email}</span>. Code expires in 10 minutes.
                    </p>
                  </div>
                )}

                {step === 'NEW_PASSWORD' && (
                  <div className="pt-1 space-y-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Create new password
                    </h2>
                    <p className="text-xs sm:text-[13px] text-[#7C8A9A]">
                      Set up your updated credentials for the research workspace.
                    </p>
                  </div>
                )}
              </div>

              {/* Progress Indicator */}
              {step !== 'SUCCESS' && (
                <div
                  className="flex items-center justify-between py-2.5 px-3.5 rounded-xl mb-6"
                  style={{
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="mono text-[11px] font-bold text-[#0BDFA0]">
                      01
                    </span>
                    <span className={`text-xs font-semibold ${step === 'EMAIL_ENTRY' ? 'text-[#F1F5F9]' : 'text-[#7C8A9A]'}`}>
                      Email
                    </span>
                    {step !== 'EMAIL_ENTRY' && <Check size={12} strokeWidth={3} className="text-[#0BDFA0]" />}
                  </div>

                  <div className={`flex-1 h-[1px] mx-2.5 transition-colors ${step !== 'EMAIL_ENTRY' ? 'bg-[#0BDFA0]/30' : 'bg-white/5'}`} />

                  <div className="flex items-center gap-1.5">
                    <span className={`mono text-[11px] font-bold ${step === 'CODE_VERIFICATION' || step === 'NEW_PASSWORD' ? 'text-[#0BDFA0]' : 'text-[#64748B]'}`}>
                      02
                    </span>
                    <span className={`text-xs font-semibold ${step === 'CODE_VERIFICATION' ? 'text-[#F1F5F9]' : step === 'NEW_PASSWORD' ? 'text-[#7C8A9A]' : 'text-[#64748B]'}`}>
                      Verify
                    </span>
                    {step === 'NEW_PASSWORD' && <Check size={12} strokeWidth={3} className="text-[#0BDFA0]" />}
                  </div>

                  <div className={`flex-1 h-[1px] mx-2.5 transition-colors ${step === 'NEW_PASSWORD' ? 'bg-[#0BDFA0]/30' : 'bg-white/5'}`} />

                  <div className="flex items-center gap-1.5">
                    <span className={`mono text-[11px] font-bold ${step === 'NEW_PASSWORD' ? 'text-[#0BDFA0]' : 'text-[#64748B]'}`}>
                      03
                    </span>
                    <span className={`text-xs font-semibold ${step === 'NEW_PASSWORD' ? 'text-[#F1F5F9]' : 'text-[#64748B]'}`}>
                      Password
                    </span>
                  </div>
                </div>
              )}

              {/* Inline Error Alert */}
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

              {/* Inline Info Alert */}
              {infoMessage && (
                <div
                  className="mb-5 p-3 rounded-xl flex items-start gap-2.5 text-xs animate-fade-in"
                  style={{
                    background: 'rgba(11, 223, 160, 0.08)',
                    border: '1px solid rgba(11, 223, 160, 0.2)',
                    color: '#0BDFA0',
                  }}
                >
                  <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{infoMessage}</div>
                </div>
              )}

              {/* STEP 1: EMAIL ENTRY */}
              {step === 'EMAIL_ENTRY' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label
                      htmlFor="forgot-email-input"
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
                        id="forgot-email-input"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="scientist@organization.bio"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendCode(e); }}
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

                  <div className="pt-2">
                    <button
                      id="forgot-send-code-btn"
                      type="button"
                      onClick={handleSendCode}
                      disabled={isLoading}
                      className="w-full h-[54px] rounded-[13px] font-bold text-sm text-[#020609] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-[#0BDFA0]/15 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, #0BDFA0 0%, #00B27A 50%, #38BDF8 100%)',
                      }}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#020609] border-t-transparent rounded-full animate-spin" />
                          <span>Dispatching verification code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Verification Code</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/[0.05] text-center">
                    <p className="text-xs text-[#7C8A9A]">
                      Remember your password?{' '}
                      <Link
                        to="/login"
                        className="text-[#0BDFA0] font-semibold hover:text-[#38BDF8] transition-colors inline-flex items-center gap-1"
                      >
                        <span>Sign In</span>
                        <ArrowRight size={12} />
                      </Link>
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: 6-DIGIT OTP CODE ENTRY */}
              {step === 'CODE_VERIFICATION' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8FA0B5] text-center">
                      Enter 6-Digit Security Code
                    </label>

                    <div className="flex justify-between items-center gap-2 sm:gap-2.5 pt-1">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={digitRefs[idx]}
                          id={`otp-box-${idx}`}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => {
                            handleDigitKeyDown(idx, e);
                            if (e.key === 'Enter' && fullOtpCode.length === 6) handleVerifyCode(e);
                          }}
                          onPaste={handleDigitPaste}
                          className="w-[46px] sm:w-[52px] h-[54px] rounded-[12px] text-center text-xl font-mono font-bold text-[#0BDFA0] transition-all outline-none"
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: digit ? '1px solid #0BDFA0' : '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: digit ? '0 0 12px rgba(11, 223, 160, 0.15)' : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-[#7C8A9A] pt-1">
                    <button
                      type="button"
                      onClick={() => setStep('EMAIL_ENTRY')}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      ← Change email
                    </button>

                    {resendCooldown > 0 ? (
                      <span className="mono text-[11px] text-[#64748B]">
                        Resend code in {resendCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        id="resend-code-btn"
                        onClick={handleSendCode}
                        disabled={isLoading}
                        className="text-[#0BDFA0] hover:text-[#38BDF8] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                        <span>Resend verification code</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      id="verify-code-btn"
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={isLoading || fullOtpCode.length !== 6}
                      className="w-full h-[54px] rounded-[13px] font-bold text-sm text-[#020609] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-[#0BDFA0]/15 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, #0BDFA0 0%, #00B27A 50%, #38BDF8 100%)',
                      }}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#020609] border-t-transparent rounded-full animate-spin" />
                          <span>Verifying security code...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify Security Code</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: NEW PASSWORD & CONFIRMATION */}
              {step === 'NEW_PASSWORD' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label
                      htmlFor="new-password-input"
                      className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8FA0B5]"
                    >
                      New Password <span className="text-[#0BDFA0]">*</span>
                    </label>
                    <div className="relative">
                      <Lock
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66758A] pointer-events-none"
                      />
                      <input
                        id="new-password-input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-[52px] rounded-[11px] text-[14px] text-[#E8EEF5] placeholder:text-[#66758A] transition-all outline-none mono"
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

                  <div className="space-y-1">
                    <label
                      htmlFor="confirm-new-password-input"
                      className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8FA0B5]"
                    >
                      Confirm New Password <span className="text-[#0BDFA0]">*</span>
                    </label>
                    <div className="relative">
                      <Lock
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66758A] pointer-events-none"
                      />
                      <input
                        id="confirm-new-password-input"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-[52px] rounded-[11px] text-[14px] text-[#E8EEF5] placeholder:text-[#66758A] transition-all outline-none mono"
                        style={{
                          background: 'rgba(255, 255, 255, 0.018)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          paddingLeft: 44,
                          paddingRight: 44,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C8A9A] hover:text-[#F1F5F9] transition-colors p-1 cursor-pointer"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div
                    className="p-3 rounded-xl space-y-2 text-xs"
                    style={{
                      background: 'rgba(255, 255, 255, 0.012)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <div className="flex items-center justify-between text-xs mono">
                      <span className="text-[#7C8A9A] font-semibold tracking-wider text-[10.5px]">
                        PASSWORD STRENGTH
                      </span>
                      <span className={`font-bold text-[10.5px] ${strengthData.text}`}>{strengthData.label}</span>
                    </div>

                    <div className="h-[3px] bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strengthData.color} transition-all duration-300 rounded-full`}
                        style={{ width: strengthData.width }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-y-1 gap-x-4 pt-0.5 text-[11.5px]">
                      <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-[#0BDFA0]' : 'text-[#64748B]'}`}>
                        {hasMinLength ? (
                          <Check size={12} strokeWidth={3} className="text-[#0BDFA0]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#475569] inline-block" />
                        )}
                        <span>8+ characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-[#0BDFA0]' : 'text-[#64748B]'}`}>
                        {hasUpper ? (
                          <Check size={12} strokeWidth={3} className="text-[#0BDFA0]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#475569] inline-block" />
                        )}
                        <span>Uppercase</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasLower ? 'text-[#0BDFA0]' : 'text-[#64748B]'}`}>
                        {hasLower ? (
                          <Check size={12} strokeWidth={3} className="text-[#0BDFA0]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#475569] inline-block" />
                        )}
                        <span>Lowercase</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-[#0BDFA0]' : 'text-[#64748B]'}`}>
                        {hasNumber ? (
                          <Check size={12} strokeWidth={3} className="text-[#0BDFA0]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#475569] inline-block" />
                        )}
                        <span>Number</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-[#0BDFA0]' : 'text-[#64748B]'}`}>
                        {hasSpecial ? (
                          <Check size={12} strokeWidth={3} className="text-[#0BDFA0]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#475569] inline-block" />
                        )}
                        <span>Special character</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${isMatch ? 'text-[#0BDFA0]' : 'text-[#64748B]'}`}>
                        {isMatch ? (
                          <Check size={12} strokeWidth={3} className="text-[#0BDFA0]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#475569] inline-block" />
                        )}
                        <span>Passwords match</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      id="reset-password-submit-btn"
                      type="button"
                      onClick={handleResetPassword}
                      disabled={isLoading || !isPasswordStrong || !isMatch}
                      className="w-full h-[54px] rounded-[13px] font-bold text-sm text-[#020609] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-[#0BDFA0]/15 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, #0BDFA0 0%, #00B27A 50%, #38BDF8 100%)',
                      }}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#020609] border-t-transparent rounded-full animate-spin" />
                          <span>Updating password...</span>
                        </>
                      ) : (
                        <>
                          <span>Reset Password</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: SUCCESS CONFIRMATION */}
              {step === 'SUCCESS' && (
                <div className="space-y-6 text-center py-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#0BDFA0]/15 border border-[#0BDFA0]/40 text-[#0BDFA0] flex items-center justify-center mx-auto shadow-lg shadow-[#0BDFA0]/15">
                    <CheckCircle2 size={34} strokeWidth={2.4} />
                  </div>

                  <div className="space-y-2.5">
                    <p className="mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#0BDFA0]">
                      CREDENTIAL RECOVERY COMPLETE
                    </p>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      Password Reset Successful
                    </h2>
                    <p className="text-sm text-[#CBD5E1] max-w-sm mx-auto leading-relaxed">
                      Your ResistanceIQ research credentials have been updated successfully.
                      You may now sign in using your new password.
                    </p>
                  </div>

                  <div className="pt-3">
                    <button
                      id="return-to-login-btn"
                      onClick={() => navigate('/login', { replace: true })}
                      className="w-full h-[54px] rounded-[13px] font-bold text-sm text-[#020609] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-[#0BDFA0]/20"
                      style={{
                        background: 'linear-gradient(135deg, #0BDFA0 0%, #00B27A 50%, #38BDF8 100%)',
                      }}
                    >
                      <span>Return to Sign In</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>
    </AuthBackground>
  );
}
