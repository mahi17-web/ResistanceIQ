import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Check,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Building2,
} from 'lucide-react';
import { register } from '../api/client.js';
import useProjectStore from '../store/projectStore.js';
import AuthHeader from '../components/auth/AuthHeader.jsx';
import AuthBackground, { AmbientMolecularNetwork } from '../components/auth/AuthBackground.jsx';

export default function Register() {
  const navigate = useNavigate();
  const setUser = useProjectStore((s) => s.setUser);
  const setOrg = useProjectStore((s) => s.setOrg);
  const setAuthStatus = useProjectStore((s) => s.setAuthStatus);
  const addNotification = useProjectStore((s) => s.addNotification);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [researchRole, setResearchRole] = useState('Research Scientist');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Password Complexity Validation Rules
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_=+~`[\]]/.test(password);
  const isMatch = Boolean(password && confirmPassword && password === confirmPassword);

  const passedRulesCount = useMemo(() => {
    return [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  }, [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial]);

  const strengthData = useMemo(() => {
    if (!password) {
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
  }, [password, passedRulesCount]);

  const isPasswordStrong = passedRulesCount === 5;

  // Step Status Tracking
  const isStep1Complete = Boolean(firstName.trim().length >= 1 && lastName.trim().length >= 1);
  const isStep2Complete = Boolean(
    email.trim().length >= 4 &&
    /^\S+@\S+\.\S+$/.test(email) &&
    organizationName.trim().length >= 1
  );
  const isStep3Complete = Boolean(isPasswordStrong && isMatch);

  const isFormValid = isStep1Complete && isStep2Complete && isStep3Complete;

  const currentStep = useMemo(() => {
    if (!isStep1Complete) return 1;
    if (!isStep2Complete) return 2;
    return 3;
  }, [isStep1Complete, isStep2Complete]);

  // Loading animation message rotation during submission
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingPhase((p) => (p + 1) % 3);
    }, 750);
    return () => clearInterval(interval);
  }, [isLoading]);

  const loadingMessages = [
    'Creating workspace...',
    'Initializing research environment...',
    'Preparing secure workspace...',
  ];

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      organizationName: true,
      password: true,
      confirmPassword: true,
    });

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !organizationName.trim()) {
      setErrorMessage('Please complete all required profile and research workspace fields.');
      return;
    }

    if (!isPasswordStrong) {
      setErrorMessage('Password must satisfy all security complexity requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoadingPhase(0);
    setIsLoading(true);
    try {
      const data = await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        organization_name: organizationName.trim(),
        password,
        confirm_password: confirmPassword,
      });

      if (data.user) {
        setUser(data.user);
        if (data.user.organization) {
          setOrg(data.user.organization);
        }
        setAuthStatus('authenticated');
        addNotification({
          title: 'Workspace Created',
          message: `Welcome to ResistanceIQ, ${data.user.full_name || data.user.email}!`,
          type: 'success',
        });
        setSuccessData(data);
      }
    } catch (err) {
      setErrorMessage(
        err.message ||
          'Unable to initialize workspace. Please verify your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SUCCESS CONFIRMATION STATE
  // ─────────────────────────────────────────────────────────────────────────────
  if (successData) {
    return (
      <AuthBackground>
        <AuthHeader mode="register" />
        <main className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div
            className="w-full max-w-[540px] p-8 sm:p-10 rounded-[28px] border relative space-y-6 text-center animate-fade-up"
            style={{
              background: 'rgba(8, 13, 20, 0.85)',
              backdropFilter: 'blur(28px)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              boxShadow: '0 32px 64px -16px rgba(0,0,0,0.7), inset 0 1px 0 0 rgba(255,255,255,0.1)',
            }}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#0BDFA0]/10 border border-[#0BDFA0]/30 text-[#0BDFA0] flex items-center justify-center mx-auto shadow-lg shadow-[#0BDFA0]/10">
              <CheckCircle2 size={30} strokeWidth={2.2} />
            </div>

            <div className="space-y-2">
              <p className="mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#0BDFA0]">
                WORKSPACE INITIALIZATION COMPLETE
              </p>
              <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
                Research Environment Ready
              </h1>
              <p className="text-sm text-[#9AACBE] max-w-md mx-auto leading-relaxed">
                Initializing research environment with encrypted isolation and temporal resistance forecasting models.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-left space-y-2.5 text-xs text-slate-300 font-sans">
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-[#7C8A9A]">Organization</span>
                <span className="font-semibold text-white">{organizationName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-[#7C8A9A]">Principal User</span>
                <span className="font-medium text-white">{firstName} {lastName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-[#7C8A9A]">Corporate Email</span>
                <span className="mono text-[#0BDFA0]">{email}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#7C8A9A]">Primary Role</span>
                <span className="font-bold text-[#0BDFA0] uppercase">{researchRole}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="continue-to-app-btn"
                onClick={() => navigate('/dashboard', { replace: true })}
                className="w-full h-[56px] rounded-[13px] font-bold text-sm text-[#020609] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#0BDFA0]/20"
                style={{
                  background: 'linear-gradient(135deg, #0BDFA0 0%, #00B27A 50%, #38BDF8 100%)',
                }}
              >
                <span>Enter ResistanceIQ Dashboard</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </main>
      </AuthBackground>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN REGISTRATION PAGE — ONE CONTINUOUS SCIENTIFIC WORKSPACE
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <AuthBackground>
      <AuthHeader mode="register" />

      <main
        className="flex-1 w-full max-w-[1440px] mx-auto flex flex-col justify-center items-center"
        style={{
          padding: 'clamp(32px, 5vw, 64px) clamp(20px, 5.5vw, 80px) clamp(48px, 6vw, 84px)',
        }}
      >
        {/* Asymmetric Continuous Scientific Workspace Layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* ═══════════════════════════════════════════════════════════════
              LEFT COLUMN: EDITORIAL SCIENTIFIC METADATA (~42% Width)
              ═══════════════════════════════════════════════════════════════ */}
          <div className="order-2 lg:order-1 lg:col-span-5 flex flex-col justify-between space-y-8 pt-2 max-w-[500px]">
            
            {/* Header & Editorial Hero */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0BDFA0]" />
                <span className="mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#0BDFA0]">
                  WORKSPACE INITIALIZATION
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
                Build your <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #0BDFA0 0%, #38BDF8 60%, #8B8CF8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  ResistanceIQ
                </span> <br />
                workspace.
              </h1>

              <p
                className="text-sm leading-relaxed text-[#9AACBE]"
                style={{ maxWidth: 440, fontSize: 14.5 }}
              >
                Create a secure research workspace for resistance forecasting,
                molecular evaluation, and reproducible scientific analysis.
              </p>
            </div>

            {/* 3 Scientific Capability Metadata Modules */}
            <div className="space-y-4 pt-1">
              
              {/* Module 01 */}
              <div className="pb-3.5 border-b border-white/[0.04] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="mono text-[11px] font-bold text-[#0BDFA0]">01</span>
                  <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#F1F5F9]">
                    RESISTANCE FORECASTING
                  </span>
                </div>
                <p className="text-[12.5px] text-[#7C8A9A] pl-5">
                  Temporal inference · uncertainty modeling
                </p>
              </div>

              {/* Module 02 */}
              <div className="pb-3.5 border-b border-white/[0.04] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="mono text-[11px] font-bold text-[#38BDF8]">02</span>
                  <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#F1F5F9]">
                    MOLECULAR INTELLIGENCE
                  </span>
                </div>
                <p className="text-[12.5px] text-[#7C8A9A] pl-5">
                  Chemical resolution · target mapping
                </p>
              </div>

              {/* Module 03 */}
              <div className="pb-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="mono text-[11px] font-bold text-[#8B8CF8]">03</span>
                  <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#F1F5F9]">
                    RESEARCH REPRODUCIBILITY
                  </span>
                </div>
                <p className="text-[12.5px] text-[#7C8A9A] pl-5">
                  Immutable datasets · model lineage
                </p>
              </div>
            </div>

            {/* Live Scientific Telemetry Field */}
            <div className="hidden sm:flex justify-start pt-1">
              <AmbientMolecularNetwork />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              RIGHT COLUMN: FLOATING SCIENTIFIC INSTRUMENT PANEL (~58% Width)
              ═══════════════════════════════════════════════════════════════ */}
          <div className="order-1 lg:order-2 lg:col-span-7 flex justify-center lg:justify-end w-full">
            <div
              className="w-full max-w-[660px] rounded-[28px] border relative transition-all duration-300"
              style={{
                background: 'rgba(8, 13, 20, 0.78)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                borderColor: 'rgba(255, 255, 255, 0.07)',
                borderRadius: 28,
                padding: 'clamp(28px, 4.5vw, 44px)',
                boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.09), 0 0 32px rgba(11, 223, 160, 0.02)',
              }}
            >
              {/* Form Header */}
              <div className="space-y-1 mb-6">
                <p className="mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#0BDFA0]">
                  WORKSPACE INITIALIZATION
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Create your <span className="text-[#0BDFA0]">ResistanceIQ</span> workspace
                </h2>
                <p className="text-xs sm:text-[13px] text-[#7C8A9A] leading-relaxed">
                  Set up your secure research workspace for resistance forecasting,
                  molecular intelligence, and reproducible scientific analysis.
                </p>
              </div>

              {/* Refined Step Navigation (Thin line, tiny numbers) */}
              <div
                className="flex items-center justify-between py-2.5 px-3.5 rounded-xl mb-6"
                style={{
                  background: 'rgba(255, 255, 255, 0.015)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                {/* Step 01 */}
                <div className="flex items-center gap-2">
                  <span
                    className={`mono text-[11px] font-bold ${
                      isStep1Complete ? 'text-[#0BDFA0]' : currentStep === 1 ? 'text-[#0BDFA0]' : 'text-[#64748B]'
                    }`}
                  >
                    01
                  </span>
                  <span
                    className={`text-xs font-semibold tracking-wide ${
                      isStep1Complete || currentStep === 1 ? 'text-[#F1F5F9]' : 'text-[#64748B]'
                    }`}
                  >
                    Identity
                  </span>
                  {isStep1Complete && <Check size={12} strokeWidth={3} className="text-[#0BDFA0]" />}
                </div>

                {/* Divider Line 1 */}
                <div
                  className={`flex-1 h-[1px] mx-3 transition-colors ${
                    isStep1Complete ? 'bg-[#0BDFA0]/30' : 'bg-white/5'
                  }`}
                />

                {/* Step 02 */}
                <div className="flex items-center gap-2">
                  <span
                    className={`mono text-[11px] font-bold ${
                      isStep2Complete ? 'text-[#0BDFA0]' : currentStep === 2 ? 'text-[#0BDFA0]' : 'text-[#64748B]'
                    }`}
                  >
                    02
                  </span>
                  <span
                    className={`text-xs font-semibold tracking-wide ${
                      isStep2Complete || currentStep === 2 ? 'text-[#F1F5F9]' : 'text-[#64748B]'
                    }`}
                  >
                    Workspace
                  </span>
                  {isStep2Complete && <Check size={12} strokeWidth={3} className="text-[#0BDFA0]" />}
                </div>

                {/* Divider Line 2 */}
                <div
                  className={`flex-1 h-[1px] mx-3 transition-colors ${
                    isStep2Complete ? 'bg-[#0BDFA0]/30' : 'bg-white/5'
                  }`}
                />

                {/* Step 03 */}
                <div className="flex items-center gap-2">
                  <span
                    className={`mono text-[11px] font-bold ${
                      isStep3Complete ? 'text-[#0BDFA0]' : currentStep === 3 ? 'text-[#0BDFA0]' : 'text-[#64748B]'
                    }`}
                  >
                    03
                  </span>
                  <span
                    className={`text-xs font-semibold tracking-wide ${
                      isStep3Complete || currentStep === 3 ? 'text-[#F1F5F9]' : 'text-[#64748B]'
                    }`}
                  >
                    Security
                  </span>
                  {isStep3Complete && <Check size={12} strokeWidth={3} className="text-[#0BDFA0]" />}
                </div>
              </div>

              {/* Inline Error Alert Region */}
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

              {/* Registration Form */}
              <form onSubmit={handleRegister} className="space-y-4" noValidate>

                {/* ── ROW 1: FIRST NAME & LAST NAME (1fr 1fr Grid) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* First Name */}
                  <div className="space-y-1">
                    <label
                      htmlFor="reg-first-name"
                      className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8FA0B5]"
                    >
                      First Name <span className="text-[#0BDFA0]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="reg-first-name"
                        type="text"
                        required
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onBlur={() => handleBlur('firstName')}
                        placeholder="Eleanor"
                        className="w-full h-[52px] rounded-[11px] text-[14px] text-[#E8EEF5] placeholder:text-[#66758A] transition-all outline-none"
                        style={{
                          background: 'rgba(255, 255, 255, 0.018)',
                          border: touched.firstName && !firstName.trim()
                            ? '1px solid #f43f5e'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                          paddingLeft: 16,
                          paddingRight: 16,
                        }}
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="space-y-1">
                    <label
                      htmlFor="reg-last-name"
                      className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8FA0B5]"
                    >
                      Last Name <span className="text-[#0BDFA0]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="reg-last-name"
                        type="text"
                        required
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onBlur={() => handleBlur('lastName')}
                        placeholder="Vance"
                        className="w-full h-[52px] rounded-[11px] text-[14px] text-[#E8EEF5] placeholder:text-[#66758A] transition-all outline-none"
                        style={{
                          background: 'rgba(255, 255, 255, 0.018)',
                          border: touched.lastName && !lastName.trim()
                            ? '1px solid #f43f5e'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                          paddingLeft: 16,
                          paddingRight: 16,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── ROW 2: CORPORATE / RESEARCH EMAIL ── */}
                <div className="space-y-1">
                  <label
                    htmlFor="reg-email"
                    className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8FA0B5]"
                  >
                    Corporate / Research Email <span className="text-[#0BDFA0]">*</span>
                  </label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66758A] pointer-events-none"
                    />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => handleBlur('email')}
                      placeholder="scientist@organization.bio"
                      className="w-full h-[52px] rounded-[11px] text-[14px] text-[#E8EEF5] placeholder:text-[#66758A] mono transition-all outline-none"
                      style={{
                        background: 'rgba(255, 255, 255, 0.018)',
                        border: touched.email && (!email.trim() || !/^\S+@\S+\.\S+$/.test(email))
                          ? '1px solid #f43f5e'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                        paddingLeft: 44,
                        paddingRight: 16,
                      }}
                    />
                  </div>
                </div>

                {/* ── ROW 3: ORGANIZATION & PRIMARY RESEARCH ROLE (1fr 1fr Grid) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Organization */}
                  <div className="space-y-1">
                    <label
                      htmlFor="reg-org"
                      className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8FA0B5]"
                    >
                      Organization / Institution <span className="text-[#0BDFA0]">*</span>
                    </label>
                    <div className="relative">
                      <Building2
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66758A] pointer-events-none"
                      />
                      <input
                        id="reg-org"
                        type="text"
                        required
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        onBlur={() => handleBlur('organizationName')}
                        placeholder="Black Mesa AgroSciences"
                        className="w-full h-[52px] rounded-[11px] text-[14px] text-[#E8EEF5] placeholder:text-[#66758A] transition-all outline-none"
                        style={{
                          background: 'rgba(255, 255, 255, 0.018)',
                          border: touched.organizationName && !organizationName.trim()
                            ? '1px solid #f43f5e'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                          paddingLeft: 44,
                          paddingRight: 16,
                        }}
                      />
                    </div>
                  </div>

                  {/* Research Role */}
                  <div className="space-y-1">
                    <label
                      htmlFor="reg-role"
                      className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8FA0B5]"
                    >
                      Primary Research Role <span className="text-[#0BDFA0]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="reg-role"
                        value={researchRole}
                        onChange={(e) => setResearchRole(e.target.value)}
                        className="w-full h-[52px] rounded-[11px] text-[13.5px] text-[#E8EEF5] transition-all outline-none appearance-none cursor-pointer"
                        style={{
                          background: '#070C13',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          paddingLeft: 16,
                          paddingRight: 36,
                        }}
                      >
                        <option value="Research Scientist">Research Scientist</option>
                        <option value="Computational Biologist">Computational Biologist</option>
                        <option value="Lead Chemist">Lead Chemist</option>
                        <option value="Agronomist / Field Scientist">Agronomist / Field Scientist</option>
                        <option value="Principal Investigator">Principal Investigator</option>
                        <option value="Regulatory Affairs Analyst">Regulatory Affairs Analyst</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#7C8A9A]">
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── ROW 4: PASSWORD & CONFIRM PASSWORD (1fr 1fr Grid) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Password */}
                  <div className="space-y-1">
                    <label
                      htmlFor="reg-password"
                      className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8FA0B5]"
                    >
                      Password <span className="text-[#0BDFA0]">*</span>
                    </label>
                    <div className="relative">
                      <Lock
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66758A] pointer-events-none"
                      />
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => handleBlur('password')}
                        placeholder="••••••••••••"
                        className="w-full h-[52px] rounded-[11px] text-[14px] text-[#E8EEF5] placeholder:text-[#66758A] transition-all outline-none mono"
                        style={{
                          background: 'rgba(255, 255, 255, 0.018)',
                          border: touched.password && !isPasswordStrong
                            ? '1px solid #f43f5e'
                            : '1px solid rgba(255, 255, 255, 0.06)',
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

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label
                      htmlFor="reg-confirm-password"
                      className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8FA0B5]"
                    >
                      Confirm Password <span className="text-[#0BDFA0]">*</span>
                    </label>
                    <div className="relative">
                      <Lock
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66758A] pointer-events-none"
                      />
                      <input
                        id="reg-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={() => handleBlur('confirmPassword')}
                        placeholder="••••••••••••"
                        className="w-full h-[52px] rounded-[11px] text-[14px] text-[#E8EEF5] placeholder:text-[#66758A] transition-all outline-none mono"
                        style={{
                          background: 'rgba(255, 255, 255, 0.018)',
                          border: touched.confirmPassword && !isMatch
                            ? '1px solid #f43f5e'
                            : '1px solid rgba(255, 255, 255, 0.06)',
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
                </div>

                {/* ── PASSWORD STRENGTH & 2-COLUMN CHECKLIST (Item 14) ── */}
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

                  {/* Progress Bar Meter */}
                  <div className="h-[3px] bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strengthData.color} transition-all duration-300 rounded-full`}
                      style={{ width: strengthData.width }}
                    />
                  </div>

                  {/* 2-Column Live Validation Checklist (Status indicators) */}
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

                {/* ── LIVE WORKSPACE PREVIEW (Item 15) ── */}
                <div
                  className="p-3 rounded-xl space-y-1.5 text-xs"
                  style={{
                    background: 'rgba(255, 255, 255, 0.012)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div className="flex items-center justify-between text-[10px] mono text-[#7C8A9A] uppercase tracking-wider">
                    <span>WORKSPACE PREVIEW</span>
                    <span className="text-[#0BDFA0] font-semibold">LIVE TELEMETRY</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-0.5">
                    <div>
                      <p className="text-[9.5px] text-[#7C8A9A] uppercase tracking-wider">Organization</p>
                      <p className="font-semibold text-[#F1F5F9] truncate mt-0.5 text-[12px]">
                        {organizationName || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9.5px] text-[#7C8A9A] uppercase tracking-wider">Principal User</p>
                      <p className="font-semibold text-[#F1F5F9] truncate mt-0.5 text-[12px]">
                        {firstName || lastName ? `${firstName} ${lastName}`.trim() : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9.5px] text-[#7C8A9A] uppercase tracking-wider">Research Role</p>
                      <p className="font-semibold text-[#0BDFA0] truncate mt-0.5 text-[12px]">
                        {researchRole}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9.5px] text-[#7C8A9A] uppercase tracking-wider">Security</p>
                      <p className="font-semibold truncate mt-0.5 text-[12px]">
                        {isLoading ? (
                          <span className="text-[#38BDF8] font-medium">Provisioning</span>
                        ) : isFormValid ? (
                          <span className="text-[#0BDFA0] font-bold">Ready</span>
                        ) : (
                          <span className="text-[#F3B14D] font-medium">Pending</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── PRIMARY CTA BUTTON (Item 16) ── */}
                <div className="pt-2 space-y-2.5">
                  <button
                    type="submit"
                    id="submit-register-btn"
                    disabled={isLoading}
                    className="w-full h-[56px] rounded-[13px] font-bold text-sm text-[#020609] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-[#0BDFA0]/15 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <span>Create Research Workspace</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  {/* Footer Terms & Legal (Item 17) */}
                  <p className="text-[11px] text-center text-[#7C8A9A] leading-relaxed pt-0.5">
                    By creating an account, you agree to our{' '}
                    <span className="text-[#9AACBE] hover:underline cursor-pointer">Terms of Service</span> and{' '}
                    <span className="text-[#9AACBE] hover:underline cursor-pointer">Privacy Policy</span>. · © 2026 ResistanceIQ
                  </p>
                </div>

              </form>
            </div>
          </div>

        </div>
      </main>
    </AuthBackground>
  );
}
