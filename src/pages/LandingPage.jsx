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
      viewBox="0 0 520 400"
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
        d="M 70 80 L 135 45 L 200 80 L 200 155 L 135 190 L 70 155 Z"
        stroke="url(#bondGrad)"
        strokeWidth="1.2"
        strokeDasharray="3 3"
      />
      <path
        d="M 200 80 L 265 45 L 330 80 L 330 155 L 265 190 L 200 155"
        stroke="url(#bondGrad)"
        strokeWidth="1.2"
      />
      <path
        d="M 330 80 L 395 45 L 460 80 L 460 155 L 395 190 L 330 155"
        stroke="url(#bondGrad)"
        strokeWidth="1.2"
        strokeDasharray="2 2"
      />
      <path
        d="M 135 190 L 135 265 L 200 300 L 265 265 L 265 190"
        stroke="url(#bondGrad)"
        strokeWidth="1.2"
      />
      <path
        d="M 265 265 L 330 300 L 395 265 L 395 190"
        stroke="url(#bondGrad)"
        strokeWidth="1.2"
        strokeDasharray="4 2"
      />

      {/* Trajectory lines */}
      <line x1="200" y1="80" x2="265" y2="265" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.25" />
      <line x1="135" y1="190" x2="395" y2="190" stroke="#0BDFA0" strokeWidth="0.8" strokeOpacity="0.2" strokeDasharray="4 4" />

      {/* Molecular Atoms / Nodes */}
      <circle cx="70" cy="80" r="3.5" fill="#0BDFA0" />
      <circle cx="135" cy="45" r="4" fill="#38BDF8" />
      <circle cx="200" cy="80" r="4.5" fill="#0BDFA0" />
      <circle cx="200" cy="155" r="3.5" fill="#8B8CF8" />
      <circle cx="135" cy="190" r="4" fill="#0BDFA0" />
      <circle cx="70" cy="155" r="3.5" fill="#F3B14D" />

      <circle cx="265" cy="45" r="4" fill="#8B8CF8" />
      <circle cx="330" cy="80" r="4.5" fill="#0BDFA0" />
      <circle cx="330" cy="155" r="4" fill="#38BDF8" />
      <circle cx="265" cy="190" r="5" fill="#0BDFA0" />

      <circle cx="395" cy="45" r="3.5" fill="#38BDF8" />
      <circle cx="460" cy="80" r="3.5" fill="#8B8CF8" />
      <circle cx="460" cy="155" r="3.5" fill="#0BDFA0" />
      <circle cx="395" cy="190" r="4" fill="#F3B14D" />

      <circle cx="135" cy="265" r="3.5" fill="#38BDF8" />
      <circle cx="200" cy="300" r="4.5" fill="#0BDFA0" />
      <circle cx="265" cy="265" r="4" fill="#8B8CF8" />
      <circle cx="330" cy="300" r="3.5" fill="#0BDFA0" />
      <circle cx="395" cy="265" r="3.5" fill="#38BDF8" />

      {/* Target Core Glow */}
      <circle cx="265" cy="190" r="16" fill="url(#nodeGlow)" />
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
      moa: 'IRAC 4A (nAChR Competitive Modulator)',
      smiles: 'C1CN(C(=N[N+](=O)[O-])N1)CC2=CN=C(C=C2)Cl',
      target: 'Nicotinic Acetylcholine Receptor (nAChR)',
      targetGene: 'nAChR α1/β2 subunit (Q96303)',
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
      moa: 'IRAC 28 (Ryanodine Receptor Modulator)',
      smiles: 'CC1=CC(=C(C(=C1)C(=O)NC2=CC(=CC=C2Cl)Br)NC(=O)C3=CC=NN3C4=CC=C(C=C4)Cl)Cl',
      target: 'Ryanodine Receptor (RyR)',
      targetGene: 'ryr-1 ion channel (A0A024E6T9)',
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
      targetGene: 'ace-1 esterase (Q869C3)',
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
    <div className="min-h-screen bg-[#030609] text-[#F1F5F9] font-sans antialiased overflow-x-hidden selection:bg-[#0BDFA0]/20 selection:text-[#0BDFA0]">
      {/* ─── 1. Header (Sticky 74px Clean Glass Header) ──────────────── */}
      <header className="sticky top-0 z-50 h-[72px] sm:h-[76px] border-b border-white/[0.07] bg-[#030609]/90 backdrop-blur-xl">
        <div className="w-full max-w-[1480px] xl:max-w-[1520px] mx-auto h-full px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20 flex items-center justify-between">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-3.5 no-underline group select-none flex-shrink-0"
            aria-label="ResistanceIQ Homepage"
          >
            <div className="brand-logo-mark flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#0BDFA0] to-[#8B8CF8] shadow-[0_0_20px_rgba(11,223,160,0.3)] transition-transform group-hover:scale-105">
              <Dna size={20} color="#020609" strokeWidth={2.6} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[17px] font-bold tracking-tight text-[#F1F5F9] group-hover:text-white transition-colors">
                Resistance<span className="text-[#0BDFA0]">IQ</span>
              </span>
              <span className="hidden md:inline-block text-[10px] font-mono font-semibold text-[#7C8A9A] uppercase tracking-[0.14em] pl-2 border-l border-white/10">
                SCIENTIFIC INTELLIGENCE
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Generously Spaced) */}
          <nav className="hidden lg:flex items-center gap-8 xl:gap-10 text-[13.5px] font-medium text-[#9AACBE]">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#capabilities" className="hover:text-white transition-colors">Capabilities</a>
            <a href="#workflow" className="hover:text-white transition-colors">How It Works</a>
            <a href="#ml-engine" className="hover:text-white transition-colors">ML Architecture</a>
            <a href="#molecular" className="hover:text-white transition-colors">Cheminformatics</a>
            <a href="#governance" className="hover:text-white transition-colors">Governance</a>
          </nav>

          {/* Right Header CTAs */}
          <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
            {!user && (
              <Link
                to="/login"
                className="text-[13.5px] font-semibold text-[#9AACBE] hover:text-white px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
            )}
            <button
              onClick={handleOpenWorkspace}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#0BDFA0] hover:bg-[#09c78e] text-[#020609] text-[13px] font-bold tracking-wide transition-all duration-200 shadow-[0_0_18px_rgba(11,223,160,0.25)] hover:shadow-[0_0_28px_rgba(11,223,160,0.4)] cursor-pointer uppercase"
            >
              <span>Open Workspace →</span>
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#9AACBE] hover:text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#080D13] border-b border-white/10 px-6 py-6 space-y-4 text-sm font-medium text-[#9AACBE]">
          <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white py-1">About</a>
          <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white py-1">Capabilities</a>
          <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white py-1">How It Works</a>
          <a href="#ml-engine" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white py-1">ML Architecture</a>
          <a href="#molecular" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white py-1">Cheminformatics</a>
          <a href="#governance" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white py-1">Governance</a>
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <Link to="/login" className="text-center py-2.5 rounded-lg bg-white/5 text-white font-semibold">Sign In</Link>
            <button onClick={handleOpenWorkspace} className="w-full py-3 rounded-lg bg-[#0BDFA0] text-[#020609] font-bold">Open Workspace →</button>
          </div>
        </div>
      )}

      {/* ─── 2. Hero Section (Spacious Two-Column Balanced Layout) ────── */}
      <section className="relative pt-20 sm:pt-24 lg:pt-28 pb-20 sm:pb-24 lg:pb-28">
        {/* Soft Ambient Glow Flares */}
        <div className="absolute top-10 left-1/4 w-[550px] h-[350px] bg-[#0BDFA0]/10 blur-[140px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-20 right-1/4 w-[600px] h-[380px] bg-[#8B8CF8]/10 blur-[150px] rounded-full pointer-events-none -z-10" />

        <div className="w-full max-w-[1480px] xl:max-w-[1520px] mx-auto px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 xl:gap-20 items-center">
            {/* ─── LEFT COLUMN (~52%) ─── */}
            <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0BDFA0]/10 border border-[#0BDFA0]/25 text-[#0BDFA0] text-[11.5px] font-mono font-semibold tracking-wider uppercase mb-6 self-start shadow-[0_0_15px_rgba(11,223,160,0.15)]">
                <Sparkles size={13} className="text-[#0BDFA0]" />
                <span>SCIENTIFIC INTELLIGENCE PLATFORM • AI-POWERED RESISTANCE FORECASTING</span>
              </div>

              {/* Main Heading (56px–68px Desktop Scale) */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[56px] xl:text-[66px] font-extrabold tracking-tight text-white leading-[1.04] mb-6 max-w-[700px]">
                Resistance<span className="text-[#0BDFA0]">IQ</span> –<br />
                AI-Powered<br />
                Pesticide Resistance<br />
                Forecasting
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-[19px] text-[#9AACBE] leading-[1.65] mb-8 max-w-[650px]">
                Scientific Intelligence Platform for computational hypothesis generation, pesticide durability forecasting, molecular target evaluation, and research reproducibility.
              </p>

              {/* Discovery Pipeline Ribbon */}
              <div className="mb-8 max-w-[650px]">
                <div className="text-[10.5px] font-mono font-bold text-[#7C8A9A] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Workflow size={13} className="text-[#0BDFA0]" />
                  <span>DISCOVERY TRAVERSAL PIPELINE</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-semibold">
                  <span className="px-3 py-1 rounded-md bg-white/[0.04] text-[#0BDFA0] border border-[#0BDFA0]/20">CROP</span>
                  <span className="text-[#7C8A9A]">→</span>
                  <span className="px-3 py-1 rounded-md bg-white/[0.04] text-[#38BDF8] border border-[#38BDF8]/20">THREAT</span>
                  <span className="text-[#7C8A9A]">→</span>
                  <span className="px-3 py-1 rounded-md bg-white/[0.04] text-[#8B8CF8] border border-[#8B8CF8]/20">TARGET</span>
                  <span className="text-[#7C8A9A]">→</span>
                  <span className="px-3 py-1 rounded-md bg-white/[0.04] text-violet-300 border border-violet-400/20">PROTEIN</span>
                  <span className="text-[#7C8A9A]">→</span>
                  <span className="px-3 py-1 rounded-md bg-white/[0.04] text-amber-300 border border-amber-400/20">MOLECULE</span>
                  <span className="text-[#7C8A9A]">→</span>
                  <span className="px-3 py-1 rounded-md bg-[#0BDFA0]/20 text-[#0BDFA0] font-bold border border-[#0BDFA0]/40">FORECAST</span>
                </div>
              </div>

              {/* Large CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={handleOpenWorkspace}
                  className="inline-flex items-center justify-center gap-2.5 h-[52px] px-8 rounded-xl bg-[#0BDFA0] hover:bg-[#09c78e] text-[#020609] text-sm font-bold tracking-wide transition-all duration-200 shadow-[0_0_20px_rgba(11,223,160,0.3)] hover:shadow-[0_0_30px_rgba(11,223,160,0.5)] transform hover:-translate-y-0.5 cursor-pointer uppercase"
                >
                  <span>OPEN WORKSPACE →</span>
                </button>

                <a
                  href="#capabilities"
                  className="inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-[#F1F5F9] text-sm font-semibold transition-all duration-200 uppercase"
                >
                  <span>EXPLORE FORECAST INTELLIGENCE →</span>
                </a>
              </div>
            </div>

            {/* ─── RIGHT COLUMN (~48% - Live Inference Console Dashboard) ─── */}
            <div className="lg:col-span-6 xl:col-span-6 relative">
              {/* Outer Glow */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-[#0BDFA0]/20 via-[#38BDF8]/15 to-[#8B8CF8]/20 rounded-3xl blur-xl opacity-70" />

              {/* Console Dashboard Card */}
              <div className="relative min-h-[560px] rounded-[24px] border border-white/12 bg-[#080D13] p-7 sm:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.95)] overflow-hidden group flex flex-col justify-between">
                {/* SVG Lattice Background */}
                <MolecularLatticeBg />

                <div className="relative z-10 space-y-5">
                  {/* Console Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0BDFA0] shadow-[0_0_8px_#0BDFA0]" />
                      <div className="font-mono text-xs font-bold text-white tracking-wider">
                        RESISTANCEIQ <span className="text-[#0BDFA0]">LIVE INFERENCE CONSOLE</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10.5px] font-mono text-[#7C8A9A]">
                      <span className="text-[#0BDFA0] font-bold">● SYSTEM ONLINE</span>
                    </div>
                  </div>

                  {/* Molecule Selector Tabs */}
                  <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#05070B] border border-white/[0.06] text-xs font-mono overflow-x-auto">
                    <button
                      onClick={() => setSelectedDemoCompound('imidacloprid')}
                      className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                        selectedDemoCompound === 'imidacloprid'
                          ? 'bg-[#0BDFA0]/20 text-[#0BDFA0] border border-[#0BDFA0]/30 font-bold'
                          : 'text-[#9AACBE] hover:text-white'
                      }`}
                    >
                      Imidacloprid
                    </button>
                    <button
                      onClick={() => setSelectedDemoCompound('chlorantraniliprole')}
                      className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                        selectedDemoCompound === 'chlorantraniliprole'
                          ? 'bg-[#0BDFA0]/20 text-[#0BDFA0] border border-[#0BDFA0]/30 font-bold'
                          : 'text-[#9AACBE] hover:text-white'
                      }`}
                    >
                      Chlorantraniliprole
                    </button>
                    <button
                      onClick={() => setSelectedDemoCompound('novel_isostere')}
                      className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                        selectedDemoCompound === 'novel_isostere'
                          ? 'bg-[#0BDFA0]/20 text-[#0BDFA0] border border-[#0BDFA0]/30 font-bold'
                          : 'text-[#9AACBE] hover:text-white'
                      }`}
                    >
                      Iso-Oxazole #402
                    </button>
                  </div>

                  {/* Candidate Molecule Info Box */}
                  <div className="p-5 rounded-2xl bg-[#05070B]/90 border border-white/[0.06] backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-1 text-[11px] font-mono">
                      <span className="text-[#0BDFA0] font-bold">CANDIDATE MOLECULE</span>
                      <span className="text-[#7C8A9A]">{activeDemo.formula}</span>
                    </div>
                    <div className="text-xl font-bold text-white mb-0.5">{activeDemo.name}</div>
                    <div className="text-xs text-[#9AACBE] mb-3">{activeDemo.classification} · <span className="text-[#38BDF8]">{activeDemo.moa}</span></div>
                    <div className="p-2.5 rounded-lg bg-black/50 border border-white/[0.04] font-mono text-[10.5px] text-[#7C8A9A] break-all leading-tight">
                      <span className="text-[#38BDF8]">SMILES:</span> {activeDemo.smiles}
                    </div>
                  </div>

                  {/* Target & Organism Cards (Two Large Horizontal Cards) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-[#05070B]/90 border border-white/[0.06] min-h-[110px] flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-[#8B8CF8] font-bold">
                        <Atom size={14} />
                        <span>TARGET RECEPTOR</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white truncate" title={activeDemo.target}>
                          {activeDemo.target}
                        </div>
                        <div className="text-[10.5px] font-mono text-[#7C8A9A] mt-0.5">{activeDemo.targetGene}</div>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#05070B]/90 border border-white/[0.06] min-h-[110px] flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-[#F3B14D] font-bold">
                        <Bug size={14} />
                        <span>TARGET ORGANISM</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white italic truncate" title={activeDemo.pest}>
                          {activeDemo.pest}
                        </div>
                        <div className="text-[10.5px] font-mono text-[#7C8A9A] mt-0.5">{activeDemo.pestCommon}</div>
                      </div>
                    </div>
                  </div>

                  {/* Predictive ML Output Section (4 Large Metric Blocks) */}
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[10.5px] font-mono font-bold text-[#7C8A9A]">PREDICTIVE ML OUTPUT</div>
                      <div
                        className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border"
                        style={{
                          color: activeDemo.riskColor,
                          borderColor: `${activeDemo.riskColor}40`,
                          backgroundColor: `${activeDemo.riskColor}15`,
                        }}
                      >
                        {activeDemo.riskLevel}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div className="p-3.5 rounded-xl bg-[#05070B] border border-white/[0.05]">
                        <div className="text-[10px] text-[#7C8A9A] font-mono uppercase">RESISTANCE INDEX</div>
                        <div className="text-2xl font-bold font-mono text-white mt-1">
                          +{activeDemo.predictedLog10RR}
                        </div>
                        <div className="text-[9.5px] text-[#7C8A9A] mt-0.5">Log10 RR Shift</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#05070B] border border-white/[0.05]">
                        <div className="text-[10px] text-[#7C8A9A] font-mono uppercase">DURABILITY SCORE</div>
                        <div className="text-2xl font-bold font-mono text-[#0BDFA0] mt-1">
                          {activeDemo.durabilityScore}<span className="text-xs text-[#7C8A9A]">/100</span>
                        </div>
                        <div className="text-[9.5px] text-[#7C8A9A] mt-0.5">Efficacy Horizon</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#05070B] border border-white/[0.05]">
                        <div className="text-[10px] text-[#7C8A9A] font-mono uppercase">90% CONFORMAL</div>
                        <div className="text-xs font-bold font-mono text-[#8B8CF8] mt-2 truncate" title={activeDemo.conformal90}>
                          {activeDemo.conformal90}
                        </div>
                        <div className="text-[9.5px] text-[#7C8A9A] mt-0.5">Coverage Bound</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#05070B] border border-white/[0.05]">
                        <div className="text-[10px] text-[#7C8A9A] font-mono uppercase">RISK STATUS</div>
                        <div className="text-xs font-bold font-mono text-white mt-2" style={{ color: activeDemo.riskColor }}>
                          {activeDemo.riskLevel}
                        </div>
                        <div className="text-[9.5px] text-[#7C8A9A] mt-0.5">Gated Classification</div>
                      </div>
                    </div>
                  </div>

                  {/* Technical Signals Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px] font-mono text-[#7C8A9A]">
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                      <div className="text-white font-bold">ECFP4</div>
                      <div className="text-[#0BDFA0] mt-0.5">{activeDemo.activeBits}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                      <div className="text-white font-bold">TANIMOTO</div>
                      <div className="text-[#38BDF8] mt-0.5">{activeDemo.tanimotoSim}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                      <div className="text-white font-bold">CONFORMAL</div>
                      <div className="text-[#8B8CF8] mt-0.5">90% Coverage</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                      <div className="text-white font-bold">OOD GATING</div>
                      <div className="text-[#F3B14D] mt-0.5">{activeDemo.domainStatus}</div>
                    </div>
                  </div>
                </div>

                {/* Console Footer */}
                <div className="relative z-10 pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between text-[10.5px] font-mono text-[#7C8A9A]">
                  <span>MODEL: v2.0.0-gbrt-ecfp4 · <span className="text-white/60">ILLUSTRATIVE FORECAST PREVIEW</span></span>
                  <button
                    onClick={handleOpenWorkspace}
                    className="text-[#0BDFA0] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span>Evaluate Chemistry</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─── HERO METRICS ROW (BELOW HERO COLUMNS) ─── */}
          <div className="mt-16 sm:mt-20 pt-12 border-t border-white/[0.08]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-7 rounded-2xl bg-[#080D13] border border-white/[0.07] min-h-[130px] flex flex-col justify-center">
                <div className="text-3xl font-bold font-mono text-[#0BDFA0]">1,059-D</div>
                <div className="text-xs text-[#7C8A9A] font-mono uppercase tracking-wider mt-1.5">FEATURE DIMENSIONS</div>
                <div className="text-[11.5px] text-[#9AACBE] mt-1">Multi-modal descriptor vectors</div>
              </div>

              <div className="p-7 rounded-2xl bg-[#080D13] border border-white/[0.07] min-h-[130px] flex flex-col justify-center">
                <div className="text-3xl font-bold font-mono text-[#8B8CF8]">2,048-BIT</div>
                <div className="text-xs text-[#7C8A9A] font-mono uppercase tracking-wider mt-1.5">ECFP4 FINGERPRINTS</div>
                <div className="text-[11.5px] text-[#9AACBE] mt-1">Morgan circular radius 2</div>
              </div>

              <div className="p-7 rounded-2xl bg-[#080D13] border border-white/[0.07] min-h-[130px] flex flex-col justify-center">
                <div className="text-3xl font-bold font-mono text-[#38BDF8]">90% BOUNDS</div>
                <div className="text-xs text-[#7C8A9A] font-mono uppercase tracking-wider mt-1.5">CONFORMAL COVERAGE</div>
                <div className="text-[11.5px] text-[#9AACBE] mt-1">Inductive conformal guarantees</div>
              </div>

              <div className="p-7 rounded-2xl bg-[#080D13] border border-white/[0.07] min-h-[130px] flex flex-col justify-center">
                <div className="text-3xl font-bold font-mono text-[#F3B14D]">TANIMOTO</div>
                <div className="text-xs text-[#7C8A9A] font-mono uppercase tracking-wider mt-1.5">MOLECULAR SIMILARITY</div>
                <div className="text-[11.5px] text-[#9AACBE] mt-1">Manifold distance gating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. About Section (Spacious 100–140px Top/Bottom Padding) ── */}
      <section id="about" className="py-28 lg:py-32 border-t border-white/[0.06] bg-[#070B10]">
        <div className="w-full max-w-[1480px] xl:max-w-[1520px] mx-auto px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20">
          <div className="text-center max-w-[850px] mx-auto mb-16 sm:mb-20">
            <span className="text-xs font-mono font-bold text-[#0BDFA0] uppercase tracking-wider">ABOUT RESISTANCEIQ</span>
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-white tracking-tight mt-3 mb-6">
              Computational Intelligence for Agrochemical Durability
            </h2>
            <p className="text-[#9AACBE] text-base sm:text-lg leading-relaxed max-w-[800px] mx-auto">
              ResistanceIQ is an academic and translational research platform engineered to proactively forecast pest resistance phenotypes, screen novel chemistries against mutant target receptors, and establish rigorous uncertainty bounds before field application.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-8 sm:p-9 rounded-2xl bg-[#0B1017] border border-white/[0.07] hover:border-[#0BDFA0]/30 transition-all min-h-[240px] flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#0BDFA0]/10 text-[#0BDFA0] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <Database size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 tracking-wide">UNIFIED SCIENTIFIC KNOWLEDGE</h3>
                <p className="text-sm text-[#9AACBE] leading-relaxed">
                  Connects agricultural ontologies (FAO ICC, IRAC MoA), protein sequences (UniProt), coordinate structures (AlphaFold/PDB), and decades of toxicological bioassays (APRD, ChEMBL).
                </p>
              </div>
            </div>

            <div className="p-8 sm:p-9 rounded-2xl bg-[#0B1017] border border-white/[0.07] hover:border-[#8B8CF8]/30 transition-all min-h-[240px] flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#8B8CF8]/10 text-[#8B8CF8] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <Cpu size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 tracking-wide">MACHINE-LEARNING INFERENCE</h3>
                <p className="text-sm text-[#9AACBE] leading-relaxed">
                  Gradient Boosted Regression Trees and Random Forest ensembles trained on 1,059-dimensional feature vectors containing Morgan/ECFP4 circular fingerprints and physicochemical descriptors.
                </p>
              </div>
            </div>

            <div className="p-8 sm:p-9 rounded-2xl bg-[#0B1017] border border-white/[0.07] hover:border-[#38BDF8]/30 transition-all min-h-[240px] flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 tracking-wide">CONFORMAL ERROR BOUNDS</h3>
                <p className="text-sm text-[#9AACBE] leading-relaxed">
                  Distribution-free uncertainty estimation providing mathematically guaranteed 80%, 90%, and 95% confidence intervals, paired with Tanimoto training-manifold distance checks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. Capabilities (Scientific Intelligence Modules) ───────── */}
      <section id="capabilities" className="py-28 lg:py-32 border-t border-white/[0.06] bg-[#05070B]">
        <div className="w-full max-w-[1480px] xl:max-w-[1520px] mx-auto px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20">
          <div className="text-center max-w-[850px] mx-auto mb-16 sm:mb-20">
            <span className="text-xs font-mono font-bold text-[#0BDFA0] uppercase tracking-wider">SCIENTIFIC INTELLIGENCE MODULES</span>
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-white tracking-tight mt-3 mb-6">
              Six Core Modules Powering Evidence-Based Discovery
            </h2>
            <p className="text-[#9AACBE] text-base sm:text-lg leading-relaxed">
              Six core computational modules supporting hypothesis generation, cheminformatics validation, and regulatory reproducibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 sm:p-9 rounded-2xl bg-[#080D13] border border-white/[0.07] hover:border-[#0BDFA0]/40 transition-all flex flex-col justify-between min-h-[200px] group">
              <div>
                <div className="text-xs font-mono font-bold text-[#0BDFA0] mb-3">01</div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2.5">
                  <BarChart3 size={20} className="text-[#0BDFA0]" />
                  <span>Resistance Forecasting</span>
                </h3>
                <p className="text-sm text-[#9AACBE] leading-relaxed mb-4">
                  Predicts Resistance Ratio (Log10 RR) and durability scores calibrated across 40+ years of toxicological bioassays using temporal train/test splits.
                </p>
              </div>
              <span className="text-xs font-mono text-[#0BDFA0] font-semibold">GBRT + Random Forest Ensemble</span>
            </div>

            <div className="p-8 sm:p-9 rounded-2xl bg-[#080D13] border border-white/[0.07] hover:border-[#8B8CF8]/40 transition-all flex flex-col justify-between min-h-[200px] group">
              <div>
                <div className="text-xs font-mono font-bold text-[#8B8CF8] mb-3">02</div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2.5">
                  <Atom size={20} className="text-[#8B8CF8]" />
                  <span>Molecular Intelligence</span>
                </h3>
                <p className="text-sm text-[#9AACBE] leading-relaxed mb-4">
                  Parses SMILES/SDF, executes valence checks, generates 2048-bit ECFP4 circular fingerprints, computes RDKit descriptors, and supports 2D molecular sketching.
                </p>
              </div>
              <span className="text-xs font-mono text-[#8B8CF8] font-semibold">2048-Bit Morgan / ECFP4</span>
            </div>

            <div className="p-8 sm:p-9 rounded-2xl bg-[#080D13] border border-white/[0.07] hover:border-[#38BDF8]/40 transition-all flex flex-col justify-between min-h-[200px] group">
              <div>
                <div className="text-xs font-mono font-bold text-[#38BDF8] mb-3">03</div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2.5">
                  <Microscope size={20} className="text-[#38BDF8]" />
                  <span>Target & Protein Intelligence</span>
                </h3>
                <p className="text-sm text-[#9AACBE] leading-relaxed mb-4">
                  Ontological traversal connecting arthropod pests to UniProt receptor sequences, AlphaFold 3D coordinates, and IRAC biochemical modes of action.
                </p>
              </div>
              <span className="text-xs font-mono text-[#38BDF8] font-semibold">UniProt & AlphaFold Traversal</span>
            </div>

            <div className="p-8 sm:p-9 rounded-2xl bg-[#080D13] border border-white/[0.07] hover:border-[#F3B14D]/40 transition-all flex flex-col justify-between min-h-[200px] group">
              <div>
                <div className="text-xs font-mono font-bold text-[#F3B14D] mb-3">04</div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2.5">
                  <GitBranch size={20} className="text-[#F3B14D]" />
                  <span>Scientific Provenance</span>
                </h3>
                <p className="text-sm text-[#9AACBE] leading-relaxed mb-4">
                  Cryptographic model verification with SHA-256 artifact hashes, dataset manifests, and deterministic seed logging for audit traceability.
                </p>
              </div>
              <span className="text-xs font-mono text-[#F3B14D] font-semibold">SHA-256 Model Checksums</span>
            </div>

            <div className="p-8 sm:p-9 rounded-2xl bg-[#080D13] border border-white/[0.07] hover:border-[#0BDFA0]/40 transition-all flex flex-col justify-between min-h-[200px] group">
              <div>
                <div className="text-xs font-mono font-bold text-[#0BDFA0] mb-3">05</div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2.5">
                  <FileText size={20} className="text-[#0BDFA0]" />
                  <span>Research Reproducibility</span>
                </h3>
                <p className="text-sm text-[#9AACBE] leading-relaxed mb-4">
                  Generates deterministic PDF, CSV, and JSON dossiers containing complete feature breakdowns, conformal intervals, and audit histories.
                </p>
              </div>
              <span className="text-xs font-mono text-[#0BDFA0] font-semibold">Audit-Ready Dossier Exports</span>
            </div>

            <div className="p-8 sm:p-9 rounded-2xl bg-[#080D13] border border-white/[0.07] hover:border-[#8B8CF8]/40 transition-all flex flex-col justify-between min-h-[200px] group">
              <div>
                <div className="text-xs font-mono font-bold text-[#8B8CF8] mb-3">06</div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2.5">
                  <FlaskConical size={20} className="text-[#8B8CF8]" />
                  <span>Candidate Evaluation</span>
                </h3>
                <p className="text-sm text-[#9AACBE] leading-relaxed mb-4">
                  Multi-criteria candidate prioritization ranking efficacy against target mutations while screening out-of-distribution scaffolds via Tanimoto distance.
                </p>
              </div>
              <span className="text-xs font-mono text-[#8B8CF8] font-semibold">Tanimoto Manifold Gating</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. How It Works (7-Stage Scientific Pipeline Timeline) ──── */}
      <section id="workflow" className="py-28 lg:py-32 border-t border-white/[0.06] bg-[#070B10]">
        <div className="w-full max-w-[1480px] xl:max-w-[1520px] mx-auto px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20">
          <div className="text-center max-w-[850px] mx-auto mb-16 sm:mb-20">
            <span className="text-xs font-mono font-bold text-[#38BDF8] uppercase tracking-wider">OPERATIONAL PIPELINE</span>
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-white tracking-tight mt-3 mb-6">
              How ResistanceIQ Works
            </h2>
            <p className="text-[#9AACBE] text-base sm:text-lg leading-relaxed">
              A 7-stage discovery timeline connecting agricultural crop taxonomy down to molecular coordinate structures and conformal durability forecasts.
            </p>
          </div>

          {/* Desktop Horizontal Timeline / Mobile Vertical Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="p-6 rounded-2xl bg-[#0B1017] border border-white/[0.07] text-center flex flex-col items-center justify-between min-h-[160px]">
              <div className="w-9 h-9 rounded-full bg-[#0BDFA0]/10 text-[#0BDFA0] font-mono font-bold text-xs flex items-center justify-center mb-2">
                01
              </div>
              <Sprout size={22} className="text-[#0BDFA0] mb-2" />
              <div className="text-sm font-bold text-white">01 CROP</div>
              <div className="text-[11px] text-[#7C8A9A] mt-1">FAO ICC Taxonomy</div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0B1017] border border-white/[0.07] text-center flex flex-col items-center justify-between min-h-[160px]">
              <div className="w-9 h-9 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] font-mono font-bold text-xs flex items-center justify-center mb-2">
                02
              </div>
              <Bug size={22} className="text-[#38BDF8] mb-2" />
              <div className="text-sm font-bold text-white">02 THREAT</div>
              <div className="text-[11px] text-[#7C8A9A] mt-1">Arthropod Species</div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0B1017] border border-white/[0.07] text-center flex flex-col items-center justify-between min-h-[160px]">
              <div className="w-9 h-9 rounded-full bg-[#8B8CF8]/10 text-[#8B8CF8] font-mono font-bold text-xs flex items-center justify-center mb-2">
                03
              </div>
              <Atom size={22} className="text-[#8B8CF8] mb-2" />
              <div className="text-sm font-bold text-white">03 TARGET</div>
              <div className="text-[11px] text-[#7C8A9A] mt-1">IRAC MoA Receptor</div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0B1017] border border-white/[0.07] text-center flex flex-col items-center justify-between min-h-[160px]">
              <div className="w-9 h-9 rounded-full bg-violet-400/10 text-violet-300 font-mono font-bold text-xs flex items-center justify-center mb-2">
                04
              </div>
              <Dna size={22} className="text-violet-300 mb-2" />
              <div className="text-sm font-bold text-white">04 PROTEIN</div>
              <div className="text-[11px] text-[#7C8A9A] mt-1">UniProt & 3D Structure</div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0B1017] border border-white/[0.07] text-center flex flex-col items-center justify-between min-h-[160px]">
              <div className="w-9 h-9 rounded-full bg-amber-400/10 text-amber-300 font-mono font-bold text-xs flex items-center justify-center mb-2">
                05
              </div>
              <FlaskConical size={22} className="text-amber-300 mb-2" />
              <div className="text-sm font-bold text-white">05 MOLECULE</div>
              <div className="text-[11px] text-[#7C8A9A] mt-1">SMILES / SDF / Draw</div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0B1017] border border-white/[0.07] text-center flex flex-col items-center justify-between min-h-[160px]">
              <div className="w-9 h-9 rounded-full bg-cyan-400/10 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center mb-2">
                06
              </div>
              <Compass size={22} className="text-cyan-300 mb-2" />
              <div className="text-sm font-bold text-white">06 REVIEW</div>
              <div className="text-[11px] text-[#7C8A9A] mt-1">Tanimoto OOD Filter</div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0BDFA0]/10 border border-[#0BDFA0]/30 text-center flex flex-col items-center justify-between min-h-[160px]">
              <div className="w-9 h-9 rounded-full bg-[#0BDFA0] text-[#020609] font-mono font-bold text-xs flex items-center justify-center mb-2">
                07
              </div>
              <BarChart3 size={22} className="text-[#0BDFA0] mb-2" />
              <div className="text-sm font-bold text-[#0BDFA0]">07 FORECAST</div>
              <div className="text-[11px] text-[#9AACBE] mt-1">Conformal Bounds</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. ML Architecture Pipeline ────────────────────────────── */}
      <section id="ml-engine" className="py-28 lg:py-32 border-t border-white/[0.06] bg-[#05070B]">
        <div className="w-full max-w-[1480px] xl:max-w-[1520px] mx-auto px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20">
          <div className="text-center max-w-[850px] mx-auto mb-16 sm:mb-20">
            <span className="text-xs font-mono font-bold text-[#8B8CF8] uppercase tracking-wider">INFERENCE ARCHITECTURE</span>
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-white tracking-tight mt-3 mb-6">
              Machine Learning Pipeline & Uncertainty Calibration
            </h2>
            <p className="text-[#9AACBE] text-base sm:text-lg leading-relaxed">
              Technical representation of the 1,059-D feature engineering, ensemble regression, and inductive conformal prediction flow.
            </p>
          </div>

          <div className="p-8 sm:p-10 lg:p-12 rounded-2xl bg-[#080D13] border border-white/10 space-y-8">
            {/* Architecture Pipeline Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-center">
              <div className="p-6 rounded-2xl bg-[#05070B] border border-white/[0.06] min-h-[140px] flex flex-col justify-center">
                <div className="text-[10.5px] font-mono text-[#0BDFA0] font-bold uppercase">MOLECULAR REP</div>
                <div className="text-xs font-bold text-white mt-1.5">SMILES Parser</div>
                <div className="text-[10.5px] text-[#7C8A9A] mt-1">Canonical Normalization</div>
              </div>

              <div className="p-6 rounded-2xl bg-[#05070B] border border-white/[0.06] min-h-[140px] flex flex-col justify-center">
                <div className="text-[10.5px] font-mono text-[#38BDF8] font-bold uppercase">ECFP4 FINGERPRINT</div>
                <div className="text-xs font-bold text-white mt-1.5">2,048 Bits</div>
                <div className="text-[10.5px] text-[#7C8A9A] mt-1">Morgan Circular Radius 2</div>
              </div>

              <div className="p-6 rounded-2xl bg-[#05070B] border border-white/[0.06] min-h-[140px] flex flex-col justify-center">
                <div className="text-[10.5px] font-mono text-[#8B8CF8] font-bold uppercase">FEATURE PROCESS</div>
                <div className="text-xs font-bold text-white mt-1.5">1,059-D Vector</div>
                <div className="text-[10.5px] text-[#7C8A9A] mt-1">RDKit Descriptors</div>
              </div>

              <div className="p-6 rounded-2xl bg-[#05070B] border border-white/[0.06] min-h-[140px] flex flex-col justify-center">
                <div className="text-[10.5px] font-mono text-violet-300 font-bold uppercase">ML INFERENCE</div>
                <div className="text-xs font-bold text-white mt-1.5">GBRT + RF</div>
                <div className="text-[10.5px] text-[#7C8A9A] mt-1">Ensemble Regressor</div>
              </div>

              <div className="p-6 rounded-2xl bg-[#05070B] border border-white/[0.06] min-h-[140px] flex flex-col justify-center">
                <div className="text-[10.5px] font-mono text-amber-300 font-bold uppercase">CONFORMAL BOUNDS</div>
                <div className="text-xs font-bold text-white mt-1.5">80% / 90% / 95%</div>
                <div className="text-[10.5px] text-[#7C8A9A] mt-1">Quantile Intervals</div>
              </div>

              <div className="p-6 rounded-2xl bg-[#0BDFA0]/10 border border-[#0BDFA0]/30 min-h-[140px] flex flex-col justify-center">
                <div className="text-[10.5px] font-mono text-[#0BDFA0] font-bold uppercase">RESISTANCE FORECAST</div>
                <div className="text-xs font-bold text-[#0BDFA0] mt-1.5">Log10 RR Shift</div>
                <div className="text-[10.5px] text-[#9AACBE] mt-1">Durability Score</div>
              </div>
            </div>

            {/* Model Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/[0.06] text-xs font-mono text-[#9AACBE]">
              <div className="p-5 rounded-xl bg-[#05070B] border border-white/[0.04]">
                <div className="text-[#7C8A9A]">TEMPORAL BENCHMARK</div>
                <div className="text-white font-semibold mt-1">Train: 1980–2012 | Test: 2018–2026</div>
              </div>
              <div className="p-5 rounded-xl bg-[#05070B] border border-white/[0.04]">
                <div className="text-[#7C8A9A]">OOD MANIFOLD GATING</div>
                <div className="text-white font-semibold mt-1">Tanimoto Max Similarity Filter</div>
              </div>
              <div className="p-5 rounded-xl bg-[#05070B] border border-white/[0.04]">
                <div className="text-[#7C8A9A]">UNCERTAINTY METHOD</div>
                <div className="text-white font-semibold mt-1">Inductive Conformal Prediction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. Cheminformatics & Molecular Intelligence ───────────── */}
      <section id="molecular" className="py-28 lg:py-32 border-t border-white/[0.06] bg-[#070B10]">
        <div className="w-full max-w-[1480px] xl:max-w-[1520px] mx-auto px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20">
          <div className="text-center max-w-[850px] mx-auto mb-16 sm:mb-20">
            <span className="text-xs font-mono font-bold text-[#0BDFA0] uppercase tracking-wider">CHEMINFORMATICS CORE</span>
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-white tracking-tight mt-3 mb-6">
              Molecular Intelligence & Chemical Resolution
            </h2>
            <p className="text-[#9AACBE] text-base sm:text-lg leading-relaxed">
              Automated chemical ingestion supporting SMILES string validation, SDF file upload, PubChem database synchronization, and live 2D structure sketching.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="p-7 rounded-2xl bg-[#0B1017] border border-white/[0.07]">
                <h3 className="text-base font-bold text-white mb-2">2048-Bit Morgan / ECFP4 Fingerprints</h3>
                <p className="text-sm text-[#9AACBE] leading-relaxed">
                  Encodes circular topological atomic environments at radius 2, capturing specific pharmacophore motifs that drive bioassay activity.
                </p>
              </div>

              <div className="p-7 rounded-2xl bg-[#0B1017] border border-white/[0.07]">
                <h3 className="text-base font-bold text-white mb-2">Physicochemical Descriptors</h3>
                <p className="text-sm text-[#9AACBE] leading-relaxed">
                  Real-time computation of Molecular Weight (MW), Wildman-Crippen LogP, Topological Polar Surface Area (TPSA), H-Bond Donors/Acceptors, and Rotatable Bonds.
                </p>
              </div>

              <div className="p-7 rounded-2xl bg-[#0B1017] border border-white/[0.07]">
                <h3 className="text-base font-bold text-white mb-2">Automated Resolution & Valence Verification</h3>
                <p className="text-sm text-[#9AACBE] leading-relaxed">
                  Sanitizes kekule forms, verifies atom valences, flags unphysical bridgeheads, and normalizes aromaticity.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 p-8 rounded-2xl bg-[#05070B] border border-white/10 space-y-4 font-mono text-xs">
              <div className="text-[#0BDFA0] font-bold pb-3 border-b border-white/[0.08] tracking-wider">
                CHEMICAL RESOLVER // SAMPLE FEATURE EXTRACT
              </div>
              <div className="space-y-3.5 text-[#9AACBE]">
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span>Active Ingredient:</span>
                  <span className="text-white font-semibold">Imidacloprid (CID 86287518)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span>Molecular Weight:</span>
                  <span className="text-white font-semibold">255.66 g/mol</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span>Calculated LogP:</span>
                  <span className="text-white font-semibold">0.57</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span>TPSA:</span>
                  <span className="text-white font-semibold">63.02 Å²</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span>H-Bond Donors / Acceptors:</span>
                  <span className="text-white font-semibold">1 / 5</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span>Rotatable Bonds:</span>
                  <span className="text-white font-semibold">2</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>ECFP4 Active Bits:</span>
                  <span className="text-[#0BDFA0] font-bold">34 / 2048</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. Governance & Trust Section ──────────────────────────── */}
      <section id="governance" className="py-28 lg:py-32 border-t border-white/[0.06] bg-[#05070B]">
        <div className="w-full max-w-[1480px] xl:max-w-[1520px] mx-auto px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Scientific Governance */}
            <div className="p-8 sm:p-10 rounded-2xl bg-[#080D13] border border-white/10">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">SCIENTIFIC GOVERNANCE & TRUST</span>
              <h2 className="text-2xl font-bold text-white mt-2 mb-5">Locked Benchmark Artifact & Integrity</h2>
              <div className="space-y-3.5 font-mono text-xs text-[#9AACBE]">
                <div className="flex justify-between py-2 border-b border-white/[0.06]">
                  <span>Model Identifier:</span>
                  <span className="text-white font-semibold">v2.0.0-gbrt-ecfp4.joblib</span>
                </div>
                <div className="py-2 border-b border-white/[0.06]">
                  <div className="text-[#7C8A9A] mb-1">SHA-256 Checksum:</div>
                  <div className="text-[#0BDFA0] break-all font-semibold">6fc915fa26716dc4a06bad71f586af95ee071acf11e9a5b8acdc5171fed55622</div>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.06]">
                  <span>Operational Mode:</span>
                  <span className="text-amber-300 font-bold">RESEARCH / VALIDATION MODE</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Governance Status:</span>
                  <span className="text-amber-300 font-bold">REQUIRES VALIDATION</span>
                </div>
              </div>
              <p className="text-xs text-[#7C8A9A] mt-6 leading-relaxed">
                ResistanceIQ is an academic/translational research tool designed for hypothesis prioritization. Computational predictions must be experimentally validated via standardized bioassays prior to operational decision-making.
              </p>
            </div>

            {/* Production Technology Stack */}
            <div className="p-8 sm:p-10 rounded-2xl bg-[#080D13] border border-white/10">
              <span className="text-xs font-mono font-bold text-[#8B8CF8] uppercase tracking-wider">ENTERPRISE ARCHITECTURE</span>
              <h2 className="text-2xl font-bold text-white mt-2 mb-5">Production Technology Stack</h2>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#05070B] border border-white/[0.05]">
                  <div className="font-bold text-white mb-1">FastAPI Backend</div>
                  <div className="text-[11px] text-[#7C8A9A]">Python 3.11, Uvicorn, ASGI</div>
                </div>
                <div className="p-4 rounded-xl bg-[#05070B] border border-white/[0.05]">
                  <div className="font-bold text-white mb-1">React 19 & Vite 6</div>
                  <div className="text-[11px] text-[#7C8A9A]">TailwindCSS, Lucide, Recharts</div>
                </div>
                <div className="p-4 rounded-xl bg-[#05070B] border border-white/[0.05]">
                  <div className="font-bold text-white mb-1">Cheminformatics Core</div>
                  <div className="text-[11px] text-[#7C8A9A]">RDKit, Scikit-learn, NumPy</div>
                </div>
                <div className="p-4 rounded-xl bg-[#05070B] border border-white/[0.05]">
                  <div className="font-bold text-white mb-1">Cloud Infrastructure</div>
                  <div className="text-[11px] text-[#7C8A9A]">Render Docker + Vercel Edge</div>
                </div>
                <div className="p-4 rounded-xl bg-[#05070B] border border-white/[0.05]">
                  <div className="font-bold text-white mb-1">Database Layer</div>
                  <div className="text-[11px] text-[#7C8A9A]">PostgreSQL / SQLAlchemy 2.0</div>
                </div>
                <div className="p-4 rounded-xl bg-[#05070B] border border-white/[0.05]">
                  <div className="font-bold text-white mb-1">Enterprise Auth</div>
                  <div className="text-[11px] text-[#7C8A9A]">JWT, Bcrypt, RBAC, OTP</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9. Final Call To Action (Spacious Final Section) ────────── */}
      <section className="py-28 lg:py-32 border-t border-white/[0.06] bg-[#070B10] text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[380px] bg-[#0BDFA0]/10 blur-[160px] rounded-full pointer-events-none -z-10" />

        <div className="w-full max-w-[1480px] xl:max-w-[1520px] mx-auto px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20">
          <div className="max-w-[850px] mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0BDFA0]/10 border border-[#0BDFA0]/20 text-[#0BDFA0] text-xs font-mono font-semibold tracking-wider uppercase">
              <span>ENTER THE RESISTANCEIQ INTELLIGENCE LAYER</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-white tracking-tight leading-tight">
              Enter the ResistanceIQ Intelligence Layer
            </h2>

            <p className="text-[#9AACBE] text-base sm:text-lg leading-relaxed max-w-[650px] mx-auto">
              Transform pesticide resistance research into an evidence-driven computational workflow.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-5 pt-4">
              <button
                onClick={handleOpenWorkspace}
                className="inline-flex items-center gap-2.5 h-14 px-9 rounded-xl bg-[#0BDFA0] hover:bg-[#09c78e] text-[#020609] text-base font-bold tracking-wide transition-all shadow-[0_0_25px_rgba(11,223,160,0.35)] hover:shadow-[0_0_35px_rgba(11,223,160,0.55)] cursor-pointer uppercase"
              >
                <span>OPEN WORKSPACE →</span>
              </button>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 h-14 px-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-white text-sm font-semibold transition-all uppercase"
              >
                <span>Create Researcher Account</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10. Footer (Spacious 4-Column Design) ───────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#030609] py-16 text-xs text-[#7C8A9A]">
        <div className="w-full max-w-[1480px] xl:max-w-[1520px] mx-auto px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0BDFA0] to-[#8B8CF8] flex items-center justify-center">
                  <Dna size={16} color="#020609" strokeWidth={2.6} />
                </div>
                <span className="text-base font-bold text-white tracking-tight">
                  Resistance<span className="text-[#0BDFA0]">IQ</span>
                </span>
              </div>
              <p className="text-[#9AACBE] text-xs leading-relaxed max-w-md">
                AI-Powered Pesticide Resistance Forecasting & Scientific Intelligence Platform for computational hypothesis generation and resistance risk screening.
              </p>
              <div className="text-[11px] text-[#7C8A9A] font-mono">
                Operational Mode: RESEARCH / VALIDATION MODE · Governance: REQUIRES VALIDATION
              </div>
            </div>

            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4">Platform</h3>
              <ul className="space-y-2.5">
                <li><Link to="/login" className="hover:text-[#0BDFA0] transition-colors">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-[#0BDFA0] transition-colors">Create Account</Link></li>
                <li><Link to="/forgot-password" className="hover:text-[#0BDFA0] transition-colors">Password Recovery</Link></li>
                <li><a href="https://resistanceiq-api.onrender.com/docs" target="_blank" rel="noopener noreferrer" className="hover:text-[#0BDFA0] transition-colors inline-flex items-center gap-1">FastAPI Docs <ExternalLink size={10} /></a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4">Scientific References</h3>
              <ul className="space-y-2.5">
                <li><a href="https://irac-online.org" target="_blank" rel="noopener noreferrer" className="hover:text-[#0BDFA0] transition-colors inline-flex items-center gap-1">IRAC Mode of Action <ExternalLink size={10} /></a></li>
                <li><a href="https://www.uniprot.org" target="_blank" rel="noopener noreferrer" className="hover:text-[#0BDFA0] transition-colors inline-flex items-center gap-1">UniProtKB <ExternalLink size={10} /></a></li>
                <li><a href="https://pubchem.ncbi.nlm.nih.gov" target="_blank" rel="noopener noreferrer" className="hover:text-[#0BDFA0] transition-colors inline-flex items-center gap-1">PubChem Compounds <ExternalLink size={10} /></a></li>
                <li><a href="https://www.fao.org" target="_blank" rel="noopener noreferrer" className="hover:text-[#0BDFA0] transition-colors inline-flex items-center gap-1">FAO ICC Classification <ExternalLink size={10} /></a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11.5px]">
            <div>
              © {new Date().getFullYear()} ResistanceIQ Platform. Built for scientific reproducibility and non-commercial research screening.
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[#0BDFA0] font-mono font-semibold">v2.0.0 Production</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
