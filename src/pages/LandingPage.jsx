import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Dna,
  FlaskConical,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  GitBranch,
  Database,
  BarChart3,
  Cpu,
  FileText,
  ExternalLink,
  ChevronRight,
  Atom,
  Bug,
  Compass,
  Sprout,
  Menu,
  X,
  Workflow,
  Microscope,
} from 'lucide-react';
import useProjectStore from '../store/projectStore.js';

/* ─── Subtle SVG Molecular Lattice Background for Console ──────────── */
function MolecularLatticeBg() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-20 transition-opacity duration-500 group-hover:opacity-30"
      viewBox="0 0 420 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0BDFA0" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0BDFA0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0BDFA0" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8B8CF8" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Hexagonal Lattice Bonds */}
      <path
        d="M 60 70 L 110 40 L 160 70 L 160 130 L 110 160 L 60 130 Z"
        stroke="url(#bondGrad)"
        strokeWidth="1.2"
        strokeDasharray="3 3"
      />
      <path
        d="M 160 70 L 210 40 L 260 70 L 260 130 L 210 160 L 160 130"
        stroke="url(#bondGrad)"
        strokeWidth="1.2"
      />
      <path
        d="M 260 70 L 310 40 L 360 70 L 360 130 L 310 160 L 260 130"
        stroke="url(#bondGrad)"
        strokeWidth="1.2"
        strokeDasharray="2 2"
      />
      <path
        d="M 110 160 L 110 220 L 160 250 L 210 220 L 210 160"
        stroke="url(#bondGrad)"
        strokeWidth="1.2"
      />
      <path
        d="M 210 220 L 260 250 L 310 220 L 310 160"
        stroke="url(#bondGrad)"
        strokeWidth="1.2"
        strokeDasharray="4 2"
      />

      {/* Cross Trajectory Lines */}
      <line x1="160" y1="70" x2="210" y2="220" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.25" />
      <line x1="110" y1="160" x2="310" y2="160" stroke="#0BDFA0" strokeWidth="0.8" strokeOpacity="0.2" strokeDasharray="4 4" />

      {/* Molecular Atoms / Nodes */}
      <circle cx="60" cy="70" r="3.5" fill="#0BDFA0" />
      <circle cx="110" cy="40" r="4" fill="#38BDF8" />
      <circle cx="160" cy="70" r="4.5" fill="#0BDFA0" />
      <circle cx="160" cy="130" r="3.5" fill="#8B8CF8" />
      <circle cx="110" cy="160" r="4" fill="#0BDFA0" />
      <circle cx="60" cy="130" r="3.5" fill="#F3B14D" />

      <circle cx="210" cy="40" r="4" fill="#8B8CF8" />
      <circle cx="260" cy="70" r="4.5" fill="#0BDFA0" />
      <circle cx="260" cy="130" r="4" fill="#38BDF8" />
      <circle cx="210" cy="160" r="5" fill="#0BDFA0" />

      <circle cx="310" cy="40" r="3" fill="#38BDF8" />
      <circle cx="360" cy="70" r="3.5" fill="#8B8CF8" />
      <circle cx="360" cy="130" r="3" fill="#0BDFA0" />
      <circle cx="310" cy="160" r="4" fill="#F3B14D" />

      <circle cx="110" cy="220" r="3.5" fill="#38BDF8" />
      <circle cx="160" cy="250" r="4.5" fill="#0BDFA0" />
      <circle cx="210" cy="220" r="4" fill="#8B8CF8" />
      <circle cx="260" cy="250" r="3.5" fill="#0BDFA0" />
      <circle cx="310" cy="220" r="3.5" fill="#38BDF8" />

      {/* Pulsing Target Core */}
      <circle cx="210" cy="160" r="14" fill="url(#nodeGlow)" />
    </svg>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const user = useProjectStore((s) => s.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Demo State
  const [selectedDemoCompound, setSelectedDemoCompound] = useState('imidacloprid');

  const demoCompounds = useMemo(() => ({
    imidacloprid: {
      key: 'imidacloprid',
      name: 'Imidacloprid',
      classification: 'Neonicotinoid (Substituted Chloropyridinyl)',
      formula: 'C9H10ClN5O2',
      moa: 'IRAC Group 4A (nAChR Competitive Modulator)',
      smiles: 'C1CN(C(=N[N+](=O)[O-])N1)CC2=CN=C(C=C2)Cl',
      target: 'Nicotinic Acetylcholine Receptor (nAChR)',
      targetGene: 'nAChR α1/β2 subunit',
      targetUniprot: 'Q96303',
      pest: 'Myzus persicae',
      pestCommon: 'Green Peach Aphid',
      predictedLog10RR: 0.24,
      durabilityScore: 86,
      conformal90: '[-0.15, +0.62]',
      domainStatus: 'IN_DOMAIN',
      tanimotoSim: 0.94,
      riskLevel: 'LOW RISK',
      riskColor: '#0BDFA0',
      activeBits: '34 / 2048',
    },
    chlorantraniliprole: {
      key: 'chlorantraniliprole',
      name: 'Chlorantraniliprole',
      classification: 'Anthranilic Diamide (Bis-Amide)',
      formula: 'C18H14BrCl2N5O2',
      moa: 'IRAC Group 28 (Ryanodine Receptor Modulator)',
      smiles: 'CC1=CC(=C(C(=C1)C(=O)NC2=CC(=CC=C2Cl)Br)NC(=O)C3=CC=NN3C4=CC=C(C=C4)Cl)Cl',
      target: 'Ryanodine Receptor (RyR)',
      targetGene: 'ryr-1 ion channel',
      targetUniprot: 'A0A024E6T9',
      pest: 'Plutella xylostella',
      pestCommon: 'Diamondback Moth',
      predictedLog10RR: 0.18,
      durabilityScore: 91,
      conformal90: '[-0.20, +0.55]',
      domainStatus: 'IN_DOMAIN',
      tanimotoSim: 0.88,
      riskLevel: 'LOW RISK',
      riskColor: '#0BDFA0',
      activeBits: '48 / 2048',
    },
    novel_isostere: {
      key: 'novel_isostere',
      name: 'Iso-Oxazole Bio-Isostere #402',
      classification: 'Novel Heterocyclic Candidate Scaffold',
      formula: 'C14H16ClN3O3',
      moa: 'Novel Substituted Agrochemical Scaffold',
      smiles: 'CC1=NC(=NO1)C2=CC=C(C=C2)CNC(=N[N+](=O)[O-])NCC3=CN=C(C=C3)Cl',
      target: 'Acetylcholinesterase-1 (AChE1)',
      targetGene: 'ace-1 esterase',
      targetUniprot: 'Q869C3',
      pest: 'Helicoverpa armigera',
      pestCommon: 'Cotton Bollworm',
      predictedLog10RR: 0.68,
      durabilityScore: 68,
      conformal90: '[+0.21, +1.15]',
      domainStatus: 'BORDERLINE_DOMAIN',
      tanimotoSim: 0.59,
      riskLevel: 'MODERATE RISK',
      riskColor: '#F3B14D',
      activeBits: '29 / 2048',
    },
  }), []);

  const activeDemo = demoCompounds[selectedDemoCompound];

  const handleOpenWorkspace = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#05070B] text-[#F1F5F9] font-sans antialiased overflow-x-hidden selection:bg-[#0BDFA0]/20 selection:text-[#0BDFA0]">
      {/* ─── Navigation Header ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 h-16 border-b border-white/[0.07] bg-[#05070B]/85 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-3.5 no-underline group select-none"
          aria-label="ResistanceIQ Homepage"
        >
          <div className="brand-logo-mark flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[#0BDFA0] to-[#8B8CF8] shadow-[0_0_20px_rgba(11,223,160,0.3)] transition-transform group-hover:scale-105">
            <Dna size={18} color="#020609" strokeWidth={2.6} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[16px] font-bold tracking-tight text-[#F1F5F9] group-hover:text-white transition-colors">
              Resistance<span className="text-[#0BDFA0]">IQ</span>
            </span>
            <span className="hidden md:inline-block text-[10px] font-mono font-semibold text-[#7C8A9A] uppercase tracking-[0.12em] pl-2 border-l border-white/10">
              Scientific Intelligence
            </span>
          </div>
        </Link>

        {/* Section Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-[13px] font-medium text-[#9AACBE]">
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#capabilities" className="hover:text-white transition-colors">Capabilities</a>
          <a href="#ml-engine" className="hover:text-white transition-colors">ML Architecture</a>
          <a href="#molecular" className="hover:text-white transition-colors">Cheminformatics</a>
          <a href="#workflow" className="hover:text-white transition-colors">How It Works</a>
          <a href="#governance" className="hover:text-white transition-colors">Governance</a>
        </nav>

        {/* Header CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <button
              onClick={handleOpenWorkspace}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0BDFA0] hover:bg-[#09c78e] text-[#020609] text-[13px] font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(11,223,160,0.25)] hover:shadow-[0_0_25px_rgba(11,223,160,0.4)]"
            >
              <span>Open Workspace</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[13px] font-semibold text-[#9AACBE] hover:text-white px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <button
                onClick={handleOpenWorkspace}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0BDFA0] hover:bg-[#09c78e] text-[#020609] text-[13px] font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(11,223,160,0.2)] hover:shadow-[0_0_25px_rgba(11,223,160,0.35)] cursor-pointer"
              >
                <span>Open Workspace</span>
                <ArrowRight size={13} />
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-[#9AACBE] hover:text-white focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0B1017] border-b border-white/10 px-6 py-5 space-y-4 text-sm font-medium text-[#9AACBE]">
          <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white">About</a>
          <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white">Capabilities</a>
          <a href="#ml-engine" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white">ML Architecture</a>
          <a href="#molecular" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white">Cheminformatics</a>
          <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white">How It Works</a>
          <a href="#governance" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white">Governance</a>
          <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
            <Link to="/login" className="text-center py-2 rounded-lg bg-white/5 text-white font-semibold">Sign In</Link>
            <button onClick={handleOpenWorkspace} className="w-full py-2.5 rounded-lg bg-[#0BDFA0] text-[#020609] font-bold">Open Workspace →</button>
          </div>
        </div>
      )}

      {/* ─── Section 1: Hero (Two-Column Desktop Layout) ─────────────── */}
      <section className="relative pt-12 pb-16 md:pt-16 md:pb-24 px-4 sm:px-8 w-[94%] max-w-[1400px] mx-auto">
        {/* Soft Scientific Glow Flares in Background */}
        <div className="absolute top-8 left-1/4 w-[500px] h-[300px] bg-[#0BDFA0]/10 blur-[130px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-20 right-1/4 w-[550px] h-[320px] bg-[#8B8CF8]/10 blur-[140px] rounded-full pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* ─── LEFT SIDE (~54% on desktop, lg:col-span-6 / xl:col-span-7) ─── */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center">
            {/* Small Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0BDFA0]/10 border border-[#0BDFA0]/25 text-[#0BDFA0] text-xs font-mono font-semibold tracking-wider uppercase mb-5 self-start shadow-[0_0_12px_rgba(11,223,160,0.15)]">
              <Sparkles size={13} className="text-[#0BDFA0]" />
              <span>SCIENTIFIC INTELLIGENCE PLATFORM · AI-POWERED RESISTANCE FORECASTING</span>
            </div>

            {/* SEO Main Heading */}
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.12] mb-5">
              Resistance<span className="text-[#0BDFA0]">IQ</span> –<br className="hidden sm:inline" /> AI-Powered Pesticide Resistance Forecasting
            </h1>

            {/* Platform Positioning Description */}
            <p className="text-base sm:text-lg text-[#9AACBE] leading-relaxed mb-6 max-w-2xl">
              Scientific Intelligence Platform for computational hypothesis generation, pesticide durability forecasting, molecular target evaluation, and research reproducibility.
            </p>

            {/* Scientific Pipeline Flow Line */}
            <div className="p-3 rounded-xl bg-[#0B1017]/80 border border-white/[0.08] mb-8 max-w-2xl backdrop-blur-sm">
              <div className="text-[10px] font-mono font-bold text-[#7C8A9A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Workflow size={12} className="text-[#0BDFA0]" />
                <span>INTEGRATED DISCOVERY TRAVERSAL PIPELINE</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono font-semibold">
                <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[#0BDFA0] border border-[#0BDFA0]/20">CROP</span>
                <span className="text-[#7C8A9A]">→</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[#38BDF8] border border-[#38BDF8]/20">THREAT</span>
                <span className="text-[#7C8A9A]">→</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[#8B8CF8] border border-[#8B8CF8]/20">TARGET</span>
                <span className="text-[#7C8A9A]">→</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.04] text-violet-300 border border-violet-400/20">PROTEIN</span>
                <span className="text-[#7C8A9A]">→</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.04] text-amber-300 border border-amber-400/20">MOLECULE</span>
                <span className="text-[#7C8A9A]">→</span>
                <span className="px-2 py-0.5 rounded bg-[#0BDFA0]/20 text-[#0BDFA0] font-bold border border-[#0BDFA0]/40">FORECAST</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <button
                onClick={handleOpenWorkspace}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#0BDFA0] hover:bg-[#09c78e] text-[#020609] text-sm font-bold tracking-wide transition-all duration-200 shadow-[0_0_20px_rgba(11,223,160,0.3)] hover:shadow-[0_0_30px_rgba(11,223,160,0.5)] transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Open Workspace</span>
                <ArrowRight size={16} />
              </button>

              <a
                href="#capabilities"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-[#F1F5F9] text-sm font-semibold transition-all duration-200"
              >
                <span>Explore Forecast Intelligence</span>
                <ChevronRight size={16} className="text-[#7C8A9A]" />
              </a>
            </div>

            {/* Technical Instrumentation Stats Row (4 technical metric boxes) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/[0.08]">
              <div className="p-3 rounded-lg bg-[#0B1017] border border-white/[0.06]">
                <div className="text-lg font-bold font-mono text-[#0BDFA0]">1,059-D</div>
                <div className="text-[10px] text-[#7C8A9A] font-mono uppercase tracking-wider mt-0.5">FEATURE DIMENSIONS</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0B1017] border border-white/[0.06]">
                <div className="text-lg font-bold font-mono text-[#8B8CF8]">2,048-BIT</div>
                <div className="text-[10px] text-[#7C8A9A] font-mono uppercase tracking-wider mt-0.5">ECFP4 FINGERPRINTS</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0B1017] border border-white/[0.06]">
                <div className="text-lg font-bold font-mono text-[#38BDF8]">90% BOUNDS</div>
                <div className="text-[10px] text-[#7C8A9A] font-mono uppercase tracking-wider mt-0.5">CONFORMAL COVERAGE</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0B1017] border border-white/[0.06]">
                <div className="text-lg font-bold font-mono text-[#F3B14D]">TANIMOTO</div>
                <div className="text-[10px] text-[#7C8A9A] font-mono uppercase tracking-wider mt-0.5">MOLECULAR SIMILARITY</div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT SIDE (~46% on desktop, lg:col-span-6 / xl:col-span-5) ─── */}
          <div className="lg:col-span-6 xl:col-span-5 relative">
            {/* Ambient console glow behind card */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#0BDFA0]/20 via-[#38BDF8]/15 to-[#8B8CF8]/20 rounded-3xl blur-xl opacity-75" />

            {/* Scientific Intelligence Console Card */}
            <div className="relative rounded-2xl border border-white/12 bg-[#0B1017] shadow-[0_25px_60px_rgba(0,0,0,0.85)] p-5 sm:p-6 overflow-hidden group">
              {/* SVG Molecular Background Lattice */}
              <MolecularLatticeBg />

              {/* Console Top Header */}
              <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0BDFA0] shadow-[0_0_8px_#0BDFA0]" />
                  <div className="font-mono text-xs font-bold text-white tracking-wider">
                    RESISTANCEIQ <span className="text-[#0BDFA0]">LIVE INFERENCE CONSOLE</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#7C8A9A]">
                  <span className="text-[#0BDFA0] font-bold">● SYSTEM ONLINE</span>
                </div>
              </div>

              {/* Molecule Selector Tabs */}
              <div className="relative z-10 flex items-center gap-1.5 p-1 rounded-lg bg-[#05070B] border border-white/[0.06] mb-4 text-xs font-mono overflow-x-auto">
                <button
                  onClick={() => setSelectedDemoCompound('imidacloprid')}
                  className={`px-2.5 py-1 rounded transition-all whitespace-nowrap cursor-pointer ${
                    selectedDemoCompound === 'imidacloprid'
                      ? 'bg-[#0BDFA0]/20 text-[#0BDFA0] border border-[#0BDFA0]/30 font-bold'
                      : 'text-[#9AACBE] hover:text-white'
                  }`}
                >
                  Imidacloprid
                </button>
                <button
                  onClick={() => setSelectedDemoCompound('chlorantraniliprole')}
                  className={`px-2.5 py-1 rounded transition-all whitespace-nowrap cursor-pointer ${
                    selectedDemoCompound === 'chlorantraniliprole'
                      ? 'bg-[#0BDFA0]/20 text-[#0BDFA0] border border-[#0BDFA0]/30 font-bold'
                      : 'text-[#9AACBE] hover:text-white'
                  }`}
                >
                  Chlorantraniliprole
                </button>
                <button
                  onClick={() => setSelectedDemoCompound('novel_isostere')}
                  className={`px-2.5 py-1 rounded transition-all whitespace-nowrap cursor-pointer ${
                    selectedDemoCompound === 'novel_isostere'
                      ? 'bg-[#0BDFA0]/20 text-[#0BDFA0] border border-[#0BDFA0]/30 font-bold'
                      : 'text-[#9AACBE] hover:text-white'
                  }`}
                >
                  Iso-Oxazole #402
                </button>
              </div>

              {/* Candidate Molecule Display Box */}
              <div className="relative z-10 p-3.5 rounded-xl bg-[#05070B]/90 border border-white/[0.06] mb-3 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-1 text-[11px] font-mono">
                  <span className="text-[#0BDFA0] font-bold">CANDIDATE MOLECULE</span>
                  <span className="text-[#7C8A9A]">{activeDemo.formula}</span>
                </div>
                <div className="text-base font-bold text-white mb-0.5">{activeDemo.name}</div>
                <div className="text-xs text-[#9AACBE] mb-2">{activeDemo.classification}</div>
                <div className="p-2 rounded bg-black/50 border border-white/[0.04] font-mono text-[10.5px] text-[#7C8A9A] break-all leading-tight">
                  <span className="text-[#38BDF8]">SMILES:</span> {activeDemo.smiles}
                </div>
              </div>

              {/* Target & Organism Compact Cards */}
              <div className="relative z-10 grid grid-cols-2 gap-2.5 mb-3.5">
                <div className="p-3 rounded-xl bg-[#05070B]/90 border border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8B8CF8] font-bold mb-1">
                    <Atom size={12} />
                    <span>TARGET RECEPTOR</span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate" title={activeDemo.target}>
                    {activeDemo.target}
                  </div>
                  <div className="text-[10px] font-mono text-[#7C8A9A] mt-0.5">{activeDemo.targetGene}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#05070B]/90 border border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#F3B14D] font-bold mb-1">
                    <Bug size={12} />
                    <span>TARGET ORGANISM</span>
                  </div>
                  <div className="text-xs font-semibold text-white italic truncate" title={activeDemo.pest}>
                    {activeDemo.pest}
                  </div>
                  <div className="text-[10px] font-mono text-[#7C8A9A] mt-0.5">{activeDemo.pestCommon}</div>
                </div>
              </div>

              {/* Forecast Output Panel */}
              <div className="relative z-10 p-3.5 rounded-xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] mb-3.5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10.5px] font-mono font-bold text-[#7C8A9A]">PREDICTIVE ML OUTPUT</div>
                  <div
                    className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded border"
                    style={{
                      color: activeDemo.riskColor,
                      borderColor: `${activeDemo.riskColor}40`,
                      backgroundColor: `${activeDemo.riskColor}15`,
                    }}
                  >
                    {activeDemo.riskLevel}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <div className="p-2.5 rounded-lg bg-[#05070B] border border-white/[0.05]">
                    <div className="text-[10px] text-[#7C8A9A] font-mono">RESISTANCE INDEX</div>
                    <div className="text-xl font-bold font-mono text-white mt-0.5">
                      +{activeDemo.predictedLog10RR}
                    </div>
                    <div className="text-[9.5px] text-[#7C8A9A]">Log10 RR Fold Shift</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#05070B] border border-white/[0.05]">
                    <div className="text-[10px] text-[#7C8A9A] font-mono">DURABILITY SCORE</div>
                    <div className="text-xl font-bold font-mono text-[#0BDFA0] mt-0.5">
                      {activeDemo.durabilityScore}<span className="text-xs text-[#7C8A9A]">/100</span>
                    </div>
                    <div className="text-[9.5px] text-[#7C8A9A]">Field Efficacy Horizon</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] font-mono text-[#9AACBE] p-2.5 rounded-lg bg-[#05070B]/80 border border-white/[0.04]">
                  <div className="flex justify-between">
                    <span>90% Conformal Interval:</span>
                    <span className="text-white font-semibold">{activeDemo.conformal90}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanimoto Max Similarity:</span>
                    <span className="text-white font-semibold">{activeDemo.tanimotoSim} ({activeDemo.domainStatus})</span>
                  </div>
                </div>
              </div>

              {/* Scientific Signals Bar */}
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[9.5px] font-mono text-[#7C8A9A] mb-3">
                <div className="p-1.5 rounded bg-white/[0.02] border border-white/[0.04] text-center">
                  <div className="text-white font-bold">ECFP4</div>
                  <div className="text-[#0BDFA0]">{activeDemo.activeBits}</div>
                </div>
                <div className="p-1.5 rounded bg-white/[0.02] border border-white/[0.04] text-center">
                  <div className="text-white font-bold">TANIMOTO</div>
                  <div className="text-[#38BDF8]">{activeDemo.tanimotoSim}</div>
                </div>
                <div className="p-1.5 rounded bg-white/[0.02] border border-white/[0.04] text-center">
                  <div className="text-white font-bold">CONFORMAL</div>
                  <div className="text-[#8B8CF8]">90% Coverage</div>
                </div>
                <div className="p-1.5 rounded bg-white/[0.02] border border-white/[0.04] text-center">
                  <div className="text-white font-bold">OOD GATING</div>
                  <div className="text-[#F3B14D]">Active</div>
                </div>
              </div>

              {/* Console Footer */}
              <div className="relative z-10 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-[#7C8A9A]">
                <span>MODEL: v2.0.0-gbrt-ecfp4 · <span className="text-white/60">ILLUSTRATIVE FORECAST PREVIEW</span></span>
                <button
                  onClick={handleOpenWorkspace}
                  className="text-[#0BDFA0] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span>Evaluate Chemistry</span>
                  <ArrowRight size={10} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 2: About ResistanceIQ ──────────────────────────── */}
      <section id="about" className="py-20 border-t border-white/[0.06] bg-[#070B10] px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold text-[#0BDFA0] uppercase tracking-wider">About ResistanceIQ</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mt-2 mb-4">
              Computational Intelligence for Agrochemical Durability
            </h2>
            <p className="text-[#9AACBE] text-base leading-relaxed">
              ResistanceIQ is an academic and translational research platform engineered to proactively forecast pest resistance phenotypes, screen novel chemistries against mutant target receptors, and establish rigorous uncertainty bounds before field application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#0BDFA0]/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-[#0BDFA0]/10 text-[#0BDFA0] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Database size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">UNIFIED SCIENTIFIC KNOWLEDGE</h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed">
                Connects agricultural ontologies (FAO ICC, IRAC MoA), protein sequences (UniProt), coordinate structures (AlphaFold/PDB), and decades of toxicological bioassays (APRD, ChEMBL).
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#8B8CF8]/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-[#8B8CF8]/10 text-[#8B8CF8] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Cpu size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">MACHINE-LEARNING INFERENCE</h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed">
                Gradient Boosted Regression Trees and Random Forest ensembles trained on 1,059-dimensional feature vectors containing Morgan/ECFP4 circular fingerprints and physicochemical descriptors.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#38BDF8]/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">CONFORMAL ERROR BOUNDS</h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed">
                Distribution-free uncertainty estimation providing mathematically guaranteed 80%, 90%, and 95% confidence intervals, paired with Tanimoto training-manifold distance checks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 3: Platform Capabilities ───────────────────────── */}
      <section id="capabilities" className="py-20 border-t border-white/[0.06] bg-[#05070B] px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold text-[#0BDFA0] uppercase tracking-wider">Modular Platform</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mt-2 mb-4">
              Scientific Intelligence Modules
            </h2>
            <p className="text-[#9AACBE] text-base leading-relaxed">
              Six core computational modules supporting hypothesis generation, cheminformatics validation, and regulatory reproducibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#0BDFA0]/40 transition-all group">
              <div className="text-xs font-mono font-bold text-[#0BDFA0] mb-2">01</div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <BarChart3 size={18} className="text-[#0BDFA0]" />
                <span>Resistance Forecasting</span>
              </h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed mb-3">
                Predicts Resistance Ratio (Log10 RR) and durability scores calibrated across 40+ years of toxicological bioassays using temporal train/test splits.
              </p>
              <span className="text-[11px] font-mono text-[#0BDFA0]">GBRT + Random Forest Ensemble</span>
            </div>

            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#8B8CF8]/40 transition-all group">
              <div className="text-xs font-mono font-bold text-[#8B8CF8] mb-2">02</div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Atom size={18} className="text-[#8B8CF8]" />
                <span>Molecular Intelligence</span>
              </h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed mb-3">
                Parses SMILES/SDF, executes valence checks, generates 2048-bit ECFP4 circular fingerprints, computes RDKit descriptors, and supports 2D molecular sketching.
              </p>
              <span className="text-[11px] font-mono text-[#8B8CF8]">2048-Bit Morgan / ECFP4</span>
            </div>

            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#38BDF8]/40 transition-all group">
              <div className="text-xs font-mono font-bold text-[#38BDF8] mb-2">03</div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Microscope size={18} className="text-[#38BDF8]" />
                <span>Target & Protein Intelligence</span>
              </h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed mb-3">
                Ontological traversal connecting arthropod pests to UniProt receptor sequences, AlphaFold 3D coordinates, and IRAC biochemical modes of action.
              </p>
              <span className="text-[11px] font-mono text-[#38BDF8]">UniProt & AlphaFold Traversal</span>
            </div>

            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#F3B14D]/40 transition-all group">
              <div className="text-xs font-mono font-bold text-[#F3B14D] mb-2">04</div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <GitBranch size={18} className="text-[#F3B14D]" />
                <span>Scientific Provenance</span>
              </h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed mb-3">
                Cryptographic model verification with SHA-256 artifact hashes, dataset manifests, and deterministic seed logging for audit traceability.
              </p>
              <span className="text-[11px] font-mono text-[#F3B14D]">SHA-256 Model Checksums</span>
            </div>

            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#0BDFA0]/40 transition-all group">
              <div className="text-xs font-mono font-bold text-[#0BDFA0] mb-2">05</div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <FileText size={18} className="text-[#0BDFA0]" />
                <span>Research Reproducibility</span>
              </h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed mb-3">
                Generates deterministic PDF, CSV, and JSON dossiers containing complete feature breakdowns, conformal intervals, and audit histories.
              </p>
              <span className="text-[11px] font-mono text-[#0BDFA0]">Audit-Ready Dossier Exports</span>
            </div>

            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#8B8CF8]/40 transition-all group">
              <div className="text-xs font-mono font-bold text-[#8B8CF8] mb-2">06</div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <FlaskConical size={18} className="text-[#8B8CF8]" />
                <span>Candidate Evaluation</span>
              </h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed mb-3">
                Multi-criteria candidate prioritization ranking efficacy against target mutations while screening out-of-distribution scaffolds via Tanimoto distance.
              </p>
              <span className="text-[11px] font-mono text-[#8B8CF8]">Tanimoto Manifold Gating</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 4: How It Works (7-Stage Workflow) ─────────────── */}
      <section id="workflow" className="py-20 border-t border-white/[0.06] bg-[#070B10] px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold text-[#38BDF8] uppercase tracking-wider">Scientific Workflow</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mt-2 mb-4">
              7-Stage Discovery Traversal Pipeline
            </h2>
            <p className="text-[#9AACBE] text-base leading-relaxed">
              Seamlessly connects agricultural crop taxonomy down to molecular coordinate structures and conformal durability forecasts.
            </p>
          </div>

          {/* Desktop Horizontal Workflow / Mobile Vertical Stack */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            <div className="p-4 rounded-xl bg-[#0B1017] border border-white/[0.07] text-center flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-[#0BDFA0]/10 text-[#0BDFA0] font-mono font-bold text-xs flex items-center justify-center mb-2">
                01
              </div>
              <Sprout size={16} className="text-[#0BDFA0] mb-1.5" />
              <div className="text-xs font-bold text-white">CROP</div>
              <div className="text-[10px] text-[#7C8A9A] mt-1">FAO ICC Commodity</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1017] border border-white/[0.07] text-center flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] font-mono font-bold text-xs flex items-center justify-center mb-2">
                02
              </div>
              <Bug size={16} className="text-[#38BDF8] mb-1.5" />
              <div className="text-xs font-bold text-white">THREAT</div>
              <div className="text-[10px] text-[#7C8A9A] mt-1">Arthropod Pest Species</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1017] border border-white/[0.07] text-center flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-[#8B8CF8]/10 text-[#8B8CF8] font-mono font-bold text-xs flex items-center justify-center mb-2">
                03
              </div>
              <Atom size={16} className="text-[#8B8CF8] mb-1.5" />
              <div className="text-xs font-bold text-white">TARGET</div>
              <div className="text-[10px] text-[#7C8A9A] mt-1">IRAC MoA Receptor</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1017] border border-white/[0.07] text-center flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-violet-400/10 text-violet-300 font-mono font-bold text-xs flex items-center justify-center mb-2">
                04
              </div>
              <Dna size={16} className="text-violet-300 mb-1.5" />
              <div className="text-xs font-bold text-white">PROTEIN</div>
              <div className="text-[10px] text-[#7C8A9A] mt-1">UniProt & 3D Structure</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1017] border border-white/[0.07] text-center flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-amber-400/10 text-amber-300 font-mono font-bold text-xs flex items-center justify-center mb-2">
                05
              </div>
              <FlaskConical size={16} className="text-amber-300 mb-1.5" />
              <div className="text-xs font-bold text-white">MOLECULE</div>
              <div className="text-[10px] text-[#7C8A9A] mt-1">SMILES / SDF / Draw</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1017] border border-white/[0.07] text-center flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-cyan-400/10 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center mb-2">
                06
              </div>
              <Compass size={16} className="text-cyan-300 mb-1.5" />
              <div className="text-xs font-bold text-white">REVIEW</div>
              <div className="text-[10px] text-[#7C8A9A] mt-1">Tanimoto OOD Gating</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0BDFA0]/10 border border-[#0BDFA0]/30 text-center flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-[#0BDFA0] text-[#020609] font-mono font-bold text-xs flex items-center justify-center mb-2">
                07
              </div>
              <BarChart3 size={16} className="text-[#0BDFA0] mb-1.5" />
              <div className="text-xs font-bold text-[#0BDFA0]">FORECAST</div>
              <div className="text-[10px] text-[#9AACBE] mt-1">Conformal Bounds</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 5: ML Architecture Pipeline ────────────────────── */}
      <section id="ml-engine" className="py-20 border-t border-white/[0.06] bg-[#05070B] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold text-[#8B8CF8] uppercase tracking-wider">Inference Architecture</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mt-2 mb-4">
              Machine Learning Pipeline & Uncertainty Calibration
            </h2>
            <p className="text-[#9AACBE] text-base leading-relaxed">
              Technical representation of the 1,059-D feature engineering, ensemble regression, and inductive conformal prediction flow.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-[#0B1017] border border-white/10 space-y-6">
            {/* Architecture Diagram */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-[#05070B] border border-white/[0.06]">
                <div className="text-[10px] font-mono text-[#0BDFA0] font-bold">STAGE 01</div>
                <div className="text-xs font-bold text-white mt-1">Molecular Representation</div>
                <div className="text-[10px] text-[#7C8A9A] mt-1">SMILES Canonicalization</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#05070B] border border-white/[0.06]">
                <div className="text-[10px] font-mono text-[#38BDF8] font-bold">STAGE 02</div>
                <div className="text-xs font-bold text-white mt-1">ECFP4 Fingerprint</div>
                <div className="text-[10px] text-[#7C8A9A] mt-1">2048-Bit Morgan Radius 2</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#05070B] border border-white/[0.06]">
                <div className="text-[10px] font-mono text-[#8B8CF8] font-bold">STAGE 03</div>
                <div className="text-xs font-bold text-white mt-1">Feature Processing</div>
                <div className="text-[10px] text-[#7C8A9A] mt-1">1059-D Feature Matrix</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#05070B] border border-white/[0.06]">
                <div className="text-[10px] font-mono text-violet-300 font-bold">STAGE 04</div>
                <div className="text-xs font-bold text-white mt-1">ML Inference</div>
                <div className="text-[10px] text-[#7C8A9A] mt-1">GBRT + Random Forest</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#05070B] border border-white/[0.06]">
                <div className="text-[10px] font-mono text-amber-300 font-bold">STAGE 05</div>
                <div className="text-xs font-bold text-white mt-1">Conformal Bounds</div>
                <div className="text-[10px] text-[#7C8A9A] mt-1">80%/90%/95% Quantiles</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0BDFA0]/10 border border-[#0BDFA0]/30">
                <div className="text-[10px] font-mono text-[#0BDFA0] font-bold">STAGE 06</div>
                <div className="text-xs font-bold text-[#0BDFA0] mt-1">Resistance Forecast</div>
                <div className="text-[10px] text-[#9AACBE] mt-1">Log10 RR & Durability</div>
              </div>
            </div>

            {/* Model Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/[0.06] text-xs font-mono text-[#9AACBE]">
              <div className="p-3 rounded-lg bg-[#05070B] border border-white/[0.04]">
                <div className="text-[#7C8A9A]">TEMPORAL BENCHMARK</div>
                <div className="text-white font-semibold mt-1">Train: 1980–2012 | Test: 2018–2026</div>
              </div>
              <div className="p-3 rounded-lg bg-[#05070B] border border-white/[0.04]">
                <div className="text-[#7C8A9A]">OOD MANIFOLD GATING</div>
                <div className="text-white font-semibold mt-1">Tanimoto Max Similarity Filter</div>
              </div>
              <div className="p-3 rounded-lg bg-[#05070B] border border-white/[0.04]">
                <div className="text-[#7C8A9A]">UNCERTAINTY METHOD</div>
                <div className="text-white font-semibold mt-1">Inductive Conformal Prediction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 6: Cheminformatics & Molecular Intelligence ───── */}
      <section id="molecular" className="py-20 border-t border-white/[0.06] bg-[#070B10] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold text-[#0BDFA0] uppercase tracking-wider">Cheminformatics Core</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mt-2 mb-4">
              Molecular Intelligence & Chemical Resolution
            </h2>
            <p className="text-[#9AACBE] text-base leading-relaxed">
              Automated chemical ingestion supporting SMILES string validation, SDF file upload, PubChem database synchronization, and live 2D structure sketching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0B1017] border border-white/[0.07]">
                <h3 className="text-sm font-bold text-white mb-1">2048-Bit Morgan / ECFP4 Fingerprints</h3>
                <p className="text-xs text-[#9AACBE]">
                  Encodes circular topological atomic environments at radius 2, capturing specific pharmacophore motifs that drive bioassay activity.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B1017] border border-white/[0.07]">
                <h3 className="text-sm font-bold text-white mb-1">Physicochemical Descriptors</h3>
                <p className="text-xs text-[#9AACBE]">
                  Real-time computation of Molecular Weight (MW), Wildman-Crippen LogP, Topological Polar Surface Area (TPSA), H-Bond Donors/Acceptors, and Rotatable Bonds.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B1017] border border-white/[0.07]">
                <h3 className="text-sm font-bold text-white mb-1">Automated Resolution & Valence Verification</h3>
                <p className="text-xs text-[#9AACBE]">
                  Sanitizes kekule forms, verifies atom valences, flags unphysical bridgeheads, and normalizes aromaticity.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#05070B] border border-white/10 space-y-4 font-mono text-xs">
              <div className="text-[#0BDFA0] font-bold pb-2 border-b border-white/[0.08]">CHEMICAL RESOLVER // SAMPLE FEATURE EXTRACT</div>
              <div className="space-y-2 text-[#9AACBE]">
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span>Active Ingredient:</span>
                  <span className="text-white">Imidacloprid (CID 86287518)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span>Molecular Weight:</span>
                  <span className="text-white">255.66 g/mol</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span>Calculated LogP:</span>
                  <span className="text-white">0.57</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span>TPSA:</span>
                  <span className="text-white">63.02 Å²</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span>H-Bond Donors / Acceptors:</span>
                  <span className="text-white">1 / 5</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span>Rotatable Bonds:</span>
                  <span className="text-white">2</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>ECFP4 Active Bits Count:</span>
                  <span className="text-[#0BDFA0] font-bold">34 / 2048</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 7: Governance & Research Reproducibility ────────── */}
      <section id="governance" className="py-20 border-t border-white/[0.06] bg-[#05070B] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Scientific Governance */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#0B1017] border border-white/10">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Scientific Governance</span>
              <h2 className="text-xl font-bold text-white mt-1 mb-4">Locked Benchmark Artifact & Integrity</h2>
              <div className="space-y-3 font-mono text-xs text-[#9AACBE]">
                <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
                  <span>Model Identifier:</span>
                  <span className="text-white">v2.0.0-gbrt-ecfp4.joblib</span>
                </div>
                <div className="py-1.5 border-b border-white/[0.06]">
                  <div className="text-[#7C8A9A] mb-1">SHA-256 Checksum:</div>
                  <div className="text-[#0BDFA0] break-all">6fc915fa26716dc4a06bad71f586af95ee071acf11e9a5b8acdc5171fed55622</div>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.06]">
                  <span>Operational Mode:</span>
                  <span className="text-amber-300 font-bold">RESEARCH / VALIDATION MODE</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Governance Status:</span>
                  <span className="text-amber-300 font-bold">REQUIRES VALIDATION</span>
                </div>
              </div>
              <p className="text-[11px] text-[#7C8A9A] mt-4 leading-relaxed">
                ResistanceIQ is an academic/translational research tool designed for hypothesis prioritization. Computational predictions must be experimentally validated via standardized bioassays prior to operational decision-making.
              </p>
            </div>

            {/* Production Technology Stack */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#0B1017] border border-white/10">
              <span className="text-xs font-mono font-bold text-[#8B8CF8] uppercase tracking-wider">Enterprise Architecture</span>
              <h2 className="text-xl font-bold text-white mt-1 mb-4">Technology Stack</h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#05070B] border border-white/[0.05]">
                  <div className="font-bold text-white mb-0.5">FastAPI Backend</div>
                  <div className="text-[11px] text-[#7C8A9A]">Python 3.11, Uvicorn, ASGI</div>
                </div>
                <div className="p-3 rounded-lg bg-[#05070B] border border-white/[0.05]">
                  <div className="font-bold text-white mb-0.5">React 19 & Vite 6</div>
                  <div className="text-[11px] text-[#7C8A9A]">TailwindCSS, Lucide, Recharts</div>
                </div>
                <div className="p-3 rounded-lg bg-[#05070B] border border-white/[0.05]">
                  <div className="font-bold text-white mb-0.5">Cheminformatics Core</div>
                  <div className="text-[11px] text-[#7C8A9A]">RDKit, Scikit-learn, NumPy</div>
                </div>
                <div className="p-3 rounded-lg bg-[#05070B] border border-white/[0.05]">
                  <div className="font-bold text-white mb-0.5">Cloud Infrastructure</div>
                  <div className="text-[11px] text-[#7C8A9A]">Render Docker + Vercel Edge</div>
                </div>
                <div className="p-3 rounded-lg bg-[#05070B] border border-white/[0.05]">
                  <div className="font-bold text-white mb-0.5">Database Layer</div>
                  <div className="text-[11px] text-[#7C8A9A]">PostgreSQL / SQLAlchemy 2.0</div>
                </div>
                <div className="p-3 rounded-lg bg-[#05070B] border border-white/[0.05]">
                  <div className="font-bold text-white mb-0.5">Enterprise Auth</div>
                  <div className="text-[11px] text-[#7C8A9A]">JWT, Bcrypt, RBAC, OTP</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 8: Final CTA ───────────────────────────────────── */}
      <section className="py-20 border-t border-white/[0.06] bg-[#070B10] px-4 sm:px-8 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#0BDFA0]/10 blur-[130px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0BDFA0]/10 border border-[#0BDFA0]/20 text-[#0BDFA0] text-xs font-mono font-semibold tracking-wider uppercase">
            <span>ENTER THE RESISTANCEIQ INTELLIGENCE LAYER</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Explore resistance forecasting, molecular intelligence, and research workflows in the ResistanceIQ workspace.
          </h2>

          <p className="text-[#9AACBE] text-base leading-relaxed max-w-xl mx-auto">
            Evaluate novel biopesticide candidates, simulate multi-generational selection pressure, and export audit-ready research dossiers in seconds.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={handleOpenWorkspace}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0BDFA0] hover:bg-[#09c78e] text-[#020609] text-sm font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(11,223,160,0.3)] hover:shadow-[0_0_30px_rgba(11,223,160,0.5)] cursor-pointer"
            >
              <span>Open Workspace</span>
              <ArrowRight size={16} />
            </button>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-white text-sm font-semibold transition-all"
            >
              <span>Create Researcher Account</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#030609] py-12 px-4 sm:px-8 text-xs text-[#7C8A9A]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0BDFA0] to-[#8B8CF8] flex items-center justify-center">
                <Dna size={15} color="#020609" strokeWidth={2.6} />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">
                Resistance<span className="text-[#0BDFA0]">IQ</span>
              </span>
            </div>
            <p className="text-[#9AACBE] text-xs leading-relaxed max-w-md">
              AI-Powered Pesticide Resistance Forecasting & Scientific Intelligence Platform for computational hypothesis generation and resistance risk screening.
            </p>
            <div className="text-[11px] text-[#7C8A9A]">
              Operational Mode: RESEARCH / VALIDATION MODE · Governance: REQUIRES VALIDATION
            </div>
          </div>

          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-3">Platform</h3>
            <ul className="space-y-2">
              <li><Link to="/login" className="hover:text-[#0BDFA0] transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-[#0BDFA0] transition-colors">Create Account</Link></li>
              <li><Link to="/forgot-password" className="hover:text-[#0BDFA0] transition-colors">Password Recovery</Link></li>
              <li><a href="https://resistanceiq-api.onrender.com/docs" target="_blank" rel="noopener noreferrer" className="hover:text-[#0BDFA0] transition-colors inline-flex items-center gap-1">FastAPI Docs <ExternalLink size={10} /></a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-3">Scientific References</h3>
            <ul className="space-y-2">
              <li><a href="https://irac-online.org" target="_blank" rel="noopener noreferrer" className="hover:text-[#0BDFA0] transition-colors inline-flex items-center gap-1">IRAC Mode of Action <ExternalLink size={10} /></a></li>
              <li><a href="https://www.uniprot.org" target="_blank" rel="noopener noreferrer" className="hover:text-[#0BDFA0] transition-colors inline-flex items-center gap-1">UniProtKB <ExternalLink size={10} /></a></li>
              <li><a href="https://pubchem.ncbi.nlm.nih.gov" target="_blank" rel="noopener noreferrer" className="hover:text-[#0BDFA0] transition-colors inline-flex items-center gap-1">PubChem Compounds <ExternalLink size={10} /></a></li>
              <li><a href="https://www.fao.org" target="_blank" rel="noopener noreferrer" className="hover:text-[#0BDFA0] transition-colors inline-flex items-center gap-1">FAO ICC Classification <ExternalLink size={10} /></a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            © {new Date().getFullYear()} ResistanceIQ Platform. Built for scientific reproducibility and non-commercial research screening.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#0BDFA0] font-mono">v2.0.0 Production</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
