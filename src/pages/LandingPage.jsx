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
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Atom,
  Bug,
  Compass,
} from 'lucide-react';
import useProjectStore from '../store/projectStore.js';

export default function LandingPage() {
  const navigate = useNavigate();
  const user = useProjectStore((s) => s.user);

  // Interactive Demo State
  const [selectedDemoCompound, setSelectedDemoCompound] = useState('imidacloprid');

  const demoCompounds = useMemo(() => ({
    imidacloprid: {
      name: 'Imidacloprid (Neonicotinoid)',
      formula: 'C9H10ClN5O2',
      moa: 'IRAC Group 4A (nAChR Competitive Modulator)',
      smiles: 'C1CN(C(=N[N+](=O)[O-])N1)CC2=CN=C(C=C2)Cl',
      target: 'Nicotinic Acetylcholine Receptor (nAChR)',
      pest: 'Myzus persicae (Green Peach Aphid)',
      predictedLog10RR: 0.24,
      durabilityScore: 86,
      conformal90: '[-0.15, +0.62]',
      domainStatus: 'IN_DOMAIN',
      tanimotoSim: 0.94,
      riskLevel: 'LOW_RISK',
      riskColor: '#0BDFA0',
    },
    chlorantraniliprole: {
      name: 'Chlorantraniliprole (Diamide)',
      formula: 'C18H14BrCl2N5O2',
      moa: 'IRAC Group 28 (Ryanodine Receptor Modulator)',
      smiles: 'CC1=CC(=C(C(=C1)C(=O)NC2=CC(=CC=C2Cl)Br)NC(=O)C3=CC=NN3C4=CC=C(C=C4)Cl)Cl',
      target: 'Ryanodine Receptor (RyR)',
      pest: 'Plutella xylostella (Diamondback Moth)',
      predictedLog10RR: 0.18,
      durabilityScore: 91,
      conformal90: '[-0.20, +0.55]',
      domainStatus: 'IN_DOMAIN',
      tanimotoSim: 0.88,
      riskLevel: 'LOW_RISK',
      riskColor: '#0BDFA0',
    },
    novel_isostere: {
      name: 'Candidate Iso-Oxazole Bio-Isostere #402',
      formula: 'C14H16ClN3O3',
      moa: 'Novel Substituted Agrochemical Scaffold',
      smiles: 'CC1=NC(=NO1)C2=CC=C(C=C2)CNC(=N[N+](=O)[O-])NCC3=CN=C(C=C3)Cl',
      target: 'Acetylcholinesterase-1 (AChE1)',
      pest: 'Helicoverpa armigera (Cotton Bollworm)',
      predictedLog10RR: 0.68,
      durabilityScore: 68,
      conformal90: '[+0.21, +1.15]',
      domainStatus: 'BORDERLINE_DOMAIN',
      tanimotoSim: 0.59,
      riskLevel: 'MODERATE_RISK',
      riskColor: '#F3B14D',
    },
  }), []);

  const activeDemo = demoCompounds[selectedDemoCompound];

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
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
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
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0BDFA0] hover:bg-[#09c78e] text-[#020609] text-[12.5px] font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(11,223,160,0.2)] hover:shadow-[0_0_25px_rgba(11,223,160,0.35)]"
              >
                <span>Launch Platform</span>
                <ArrowRight size={13} />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ─── Hero Section ───────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-8 max-w-[1400px] mx-auto">
        {/* Background glow flares */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-[#0BDFA0]/10 blur-[130px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-40 left-1/4 w-[400px] h-[250px] bg-[#8B8CF8]/10 blur-[110px] rounded-full pointer-events-none -z-10" />

        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-14">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0BDFA0]/10 border border-[#0BDFA0]/25 text-[#0BDFA0] text-xs font-mono font-semibold tracking-wider uppercase mb-6 shadow-[0_0_12px_rgba(11,223,160,0.15)]">
            <Sparkles size={13} className="text-[#0BDFA0]" />
            <span>AI-Powered Scientific Intelligence · V2.0 Engine</span>
          </div>

          {/* Primary H1 */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12] mb-6">
            Resistance<span className="text-[#0BDFA0]">IQ</span> – AI-Powered Pesticide Resistance Forecasting
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-[#9AACBE] max-w-2xl mx-auto leading-relaxed mb-8">
            Scientific Intelligence Platform for computational hypothesis generation, pesticide durability forecasting, molecular target evaluation, and research reproducibility.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#0BDFA0] hover:bg-[#09c78e] text-[#020609] text-sm font-bold tracking-wide transition-all duration-200 shadow-[0_0_20px_rgba(11,223,160,0.3)] hover:shadow-[0_0_30px_rgba(11,223,160,0.5)] transform hover:-translate-y-0.5"
            >
              <span>Access Research Platform</span>
              <ArrowRight size={16} />
            </Link>

            <a
              href="#interactive-demo"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-[#F1F5F9] text-sm font-semibold transition-all duration-200"
            >
              <span>Explore Live Forecast Preview</span>
              <ChevronRight size={16} className="text-[#7C8A9A]" />
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 w-full max-w-3xl pt-8 border-t border-white/[0.08]">
            <div className="text-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <div className="text-xl font-bold font-mono text-[#0BDFA0]">1,059-D</div>
              <div className="text-[11px] text-[#7C8A9A] uppercase tracking-wider mt-0.5">Feature Dimensions</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <div className="text-xl font-bold font-mono text-[#8B8CF8]">2,048-Bit</div>
              <div className="text-[11px] text-[#7C8A9A] uppercase tracking-wider mt-0.5">ECFP4 Fingerprints</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <div className="text-xl font-bold font-mono text-[#38BDF8]">90% Bounds</div>
              <div className="text-[11px] text-[#7C8A9A] uppercase tracking-wider mt-0.5">Conformal Guarantees</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <div className="text-xl font-bold font-mono text-[#F3B14D]">Tanimoto & Mahalanobis</div>
              <div className="text-[11px] text-[#7C8A9A] uppercase tracking-wider mt-0.5">OOD Domain Gating</div>
            </div>
          </div>
        </div>

        {/* ─── Interactive Live Forecast Preview Component ────────────── */}
        <div id="interactive-demo" className="mt-6 max-w-5xl mx-auto rounded-2xl border border-white/10 bg-[#0B1017]/95 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl p-6 sm:p-8">
          {/* Window header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/[0.08] gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="pl-3 border-l border-white/10">
                <span className="text-xs font-mono text-[#7C8A9A]">CANDIDATE FORECAST DOSSIER // LIVE INFERENCE PREVIEW</span>
              </div>
            </div>

            {/* Compound Selector */}
            <div className="flex items-center gap-2 bg-[#05070B] p-1 rounded-lg border border-white/10 text-xs">
              <span className="text-[11px] text-[#7C8A9A] px-2 font-mono">Select Molecule:</span>
              <button
                onClick={() => setSelectedDemoCompound('imidacloprid')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  selectedDemoCompound === 'imidacloprid'
                    ? 'bg-[#0BDFA0]/20 text-[#0BDFA0] border border-[#0BDFA0]/30'
                    : 'text-[#9AACBE] hover:text-white'
                }`}
              >
                Imidacloprid
              </button>
              <button
                onClick={() => setSelectedDemoCompound('chlorantraniliprole')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  selectedDemoCompound === 'chlorantraniliprole'
                    ? 'bg-[#0BDFA0]/20 text-[#0BDFA0] border border-[#0BDFA0]/30'
                    : 'text-[#9AACBE] hover:text-white'
                }`}
              >
                Chlorantraniliprole
              </button>
              <button
                onClick={() => setSelectedDemoCompound('novel_isostere')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  selectedDemoCompound === 'novel_isostere'
                    ? 'bg-[#0BDFA0]/20 text-[#0BDFA0] border border-[#0BDFA0]/30'
                    : 'text-[#9AACBE] hover:text-white'
                }`}
              >
                Iso-Oxazole #402
              </button>
            </div>
          </div>

          {/* Dossier Body Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Left Col: Chemical & Biological Context (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 rounded-xl bg-[#05070B] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-[#0BDFA0] font-bold">CANDIDATE MOLECULE</span>
                  <span className="text-[11px] font-mono text-[#7C8A9A]">{activeDemo.formula}</span>
                </div>
                <h2 className="text-lg font-bold text-white mb-1">{activeDemo.name}</h2>
                <div className="text-xs text-[#9AACBE] mb-3">{activeDemo.moa}</div>
                <div className="p-2.5 rounded bg-black/40 border border-white/[0.04] font-mono text-[11px] text-[#7C8A9A] break-all">
                  <span className="text-[#38BDF8]">SMILES:</span> {activeDemo.smiles}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#05070B] border border-white/[0.06]">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#8B8CF8] mb-1">
                    <Atom size={14} />
                    <span>TARGET RECEPTOR</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{activeDemo.target}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#05070B] border border-white/[0.06]">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#F3B14D] mb-1">
                    <Bug size={14} />
                    <span>TARGET ORGANISM</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{activeDemo.pest}</div>
                </div>
              </div>
            </div>

            {/* Right Col: Forecast Output & Uncertainty (5 cols) */}
            <div className="lg:col-span-5 p-5 rounded-xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.08] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-[#7C8A9A]">PREDICTIVE ML OUTPUT</span>
                  <span
                    className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border"
                    style={{
                      color: activeDemo.riskColor,
                      borderColor: `${activeDemo.riskColor}40`,
                      backgroundColor: `${activeDemo.riskColor}15`,
                    }}
                  >
                    {activeDemo.riskLevel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-[#05070B] border border-white/[0.06]">
                    <div className="text-[11px] text-[#7C8A9A] font-mono mb-1">LOG10 RR PREDICTION</div>
                    <div className="text-2xl font-bold font-mono text-white">
                      +{activeDemo.predictedLog10RR}
                    </div>
                    <div className="text-[10px] text-[#7C8A9A] mt-0.5">Fold resistance index</div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#05070B] border border-white/[0.06]">
                    <div className="text-[11px] text-[#7C8A9A] font-mono mb-1">DURABILITY SCORE</div>
                    <div className="text-2xl font-bold font-mono text-[#0BDFA0]">
                      {activeDemo.durabilityScore}/100
                    </div>
                    <div className="text-[10px] text-[#7C8A9A] mt-0.5">High operational durability</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono text-[#9AACBE] p-3 rounded-lg bg-[#05070B]/70 border border-white/[0.04]">
                  <div className="flex justify-between">
                    <span>90% Conformal Interval:</span>
                    <span className="text-white font-semibold">{activeDemo.conformal90}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Domain Status:</span>
                    <span className="text-[#0BDFA0] font-semibold">{activeDemo.domainStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanimoto Max Similarity:</span>
                    <span className="text-white font-semibold">{activeDemo.tanimotoSim}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#7C8A9A]">
                <span>MODEL: v2.0.0-gbrt-ecfp4</span>
                <Link to="/login" className="text-[#0BDFA0] hover:underline flex items-center gap-1 font-semibold">
                  <span>Run Custom Forecast</span>
                  <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 2: About ResistanceIQ ──────────────────────────── */}
      <section id="about" className="py-20 border-t border-white/[0.06] bg-[#070B10] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
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
            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#0BDFA0]/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-[#0BDFA0]/10 text-[#0BDFA0] flex items-center justify-center mb-4">
                <Database size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Unified Scientific Knowledge</h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed">
                Connects agricultural ontologies (FAO ICC, IRAC MoA), protein sequences (UniProt), coordinate structures (AlphaFold/PDB), and decades of toxicological bioassays (APRD, ChEMBL).
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#8B8CF8]/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-[#8B8CF8]/10 text-[#8B8CF8] flex items-center justify-center mb-4">
                <Cpu size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Machine-Learning Inference</h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed">
                Gradient Boosted Regression Trees and Random Forest ensembles trained on 1,059-dimensional feature vectors containing Morgan/ECFP4 fingerprints and physicochemical descriptors.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#38BDF8]/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center mb-4">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Conformal Error Bounds</h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed">
                Distribution-free uncertainty estimation providing mathematically guaranteed 80%, 90%, and 95% confidence intervals, paired with Tanimoto manifold distance checks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 3 & 4: Problem & Solution ──────────────────────── */}
      <section className="py-20 border-t border-white/[0.06] bg-[#05070B] px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* The Problem */}
            <div>
              <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">The Agricultural Challenge</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-2 mb-6">
                Reactive Resistance Monitoring Causes Multi-Billion Dollar Control Failures
              </h2>
              <div className="space-y-4 text-sm text-[#9AACBE]">
                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-rose-500/[0.04] border border-rose-500/20">
                  <AlertCircle size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Late-Stage Field Discovery:</span> Traditional bioassays only confirm resistance after crop damage and field control failures have already occurred.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-rose-500/[0.04] border border-rose-500/20">
                  <AlertCircle size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Cross-Resistance Cascades:</span> Single target point mutations (e.g. AChE1-F331W, VGSC-kdr) simultaneously neutralize entire classes of chemical modes of action.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-rose-500/[0.04] border border-rose-500/20">
                  <AlertCircle size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Wet-Lab Screening Bottlenecks:</span> Synthesizing and bioassaying candidate chemistries takes months per iteration without prior in-silico screening.
                  </div>
                </div>
              </div>
            </div>

            {/* The Solution */}
            <div>
              <span className="text-xs font-mono font-bold text-[#0BDFA0] uppercase tracking-wider">The ResistanceIQ Solution</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-2 mb-6">
                Proactive In-Silico Resistance Screening & Hypothesis Prioritization
              </h2>
              <div className="space-y-4 text-sm text-[#9AACBE]">
                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#0BDFA0]/[0.04] border border-[#0BDFA0]/20">
                  <CheckCircle2 size={18} className="text-[#0BDFA0] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Pre-Deployment Forecasting:</span> Estimate Log10 Resistance Ratios and multi-generation durability curves before committing to chemical synthesis.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#0BDFA0]/[0.04] border border-[#0BDFA0]/20">
                  <CheckCircle2 size={18} className="text-[#0BDFA0] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Ontological Traversal:</span> Traverse seamlessly from Crop Commodity → Pest Species → Biological Receptor → 3D Coordinate Structure → Chemical Candidate.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#0BDFA0]/[0.04] border border-[#0BDFA0]/20">
                  <CheckCircle2 size={18} className="text-[#0BDFA0] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Gated Out-of-Distribution Screening:</span> Detect novel chemical scaffolds outside the training manifold using Tanimoto maximum similarity gating.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 5: Key Platform Features ───────────────────────── */}
      <section id="capabilities" className="py-20 border-t border-white/[0.06] bg-[#070B10] px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold text-[#0BDFA0] uppercase tracking-wider">Core Capabilities</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mt-2 mb-4">
              Scientific Intelligence Features
            </h2>
            <p className="text-[#9AACBE] text-base leading-relaxed">
              Six modular, integrated capabilities providing end-to-end scientific hypothesis generation, molecular screening, and research validation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#0BDFA0]/40 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-[#0BDFA0]/10 text-[#0BDFA0] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Temporal Resistance Forecasting</h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed mb-3">
                Predicts Resistance Ratio (Log10 RR) and durability scores calibrated across 40+ years of toxicological bioassays using temporal train/test splits.
              </p>
              <span className="text-[11px] font-mono text-[#0BDFA0] font-semibold">GBRT + Random Forest Ensemble</span>
            </div>

            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#8B8CF8]/40 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-[#8B8CF8]/10 text-[#8B8CF8] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Conformal Uncertainty Bounds</h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed mb-3">
                Calculates distribution-free 80%, 90%, and 95% confidence intervals on predicted resistance metrics with guaranteed coverage rates under exchangeability.
              </p>
              <span className="text-[11px] font-mono text-[#8B8CF8] font-semibold">Inductive Conformal Prediction</span>
            </div>

            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#38BDF8]/40 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Compass size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Applicability Domain & OOD Gating</h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed mb-3">
                Evaluates distance-to-training-manifold using Tanimoto maximum similarity and Mahalanobis feature distance to detect novel scaffolds.
              </p>
              <span className="text-[11px] font-mono text-[#38BDF8] font-semibold">Tanimoto Manifold Filtering</span>
            </div>

            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#F3B14D]/40 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-[#F3B14D]/10 text-[#F3B14D] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <GitBranch size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Scientific Knowledge Graph</h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed mb-3">
                Traversal connecting crops (FAO ICC), arthropod pests, IRAC Modes of Action, UniProt protein sequences, and AlphaFold/PDB coordinate structures.
              </p>
              <span className="text-[11px] font-mono text-[#F3B14D] font-semibold">Ontological Graph Traversal</span>
            </div>

            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#0BDFA0]/40 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-[#0BDFA0]/10 text-[#0BDFA0] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FlaskConical size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Automated Cheminformatics</h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed mb-3">
                Parses SMILES/SDF, executes valence checks, generates 2048-bit ECFP4 fingerprints, computes RDKit descriptors, and supports 2D molecular sketching.
              </p>
              <span className="text-[11px] font-mono text-[#0BDFA0] font-semibold">RDKit & 2D Canvas Engine</span>
            </div>

            <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.07] hover:border-[#8B8CF8]/40 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-[#8B8CF8]/10 text-[#8B8CF8] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileText size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Provenance & Research Dossiers</h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed mb-3">
                Generates deterministic PDF, CSV, and JSON dossiers with SHA-256 model checksums, feature breakdowns, and reproducible audit logs.
              </p>
              <span className="text-[11px] font-mono text-[#8B8CF8] font-semibold">Cryptographic Audit Trails</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 6: AI/ML Architecture ─────────────────────────── */}
      <section id="ml-engine" className="py-20 border-t border-white/[0.06] bg-[#05070B] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold text-[#8B8CF8] uppercase tracking-wider">Predictive Modeling</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mt-2 mb-4">
              AI/ML Architecture & Temporal Validation
            </h2>
            <p className="text-[#9AACBE] text-base leading-relaxed">
              Engineered with strict temporal validation splits to evaluate historical models against future resistance phenomena without data leakage.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-[#0B1017] border border-white/10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-white/[0.08]">
              <div className="p-4 rounded-lg bg-[#05070B] border border-white/[0.05]">
                <div className="text-xs text-[#7C8A9A] font-mono">PRIMARY ESTIMATOR</div>
                <div className="text-base font-bold text-white mt-1">GBRT Regressor</div>
                <div className="text-xs text-[#9AACBE] mt-1">Gradient Boosted Trees (150 estimators, max depth 5)</div>
              </div>
              <div className="p-4 rounded-lg bg-[#05070B] border border-white/[0.05]">
                <div className="text-xs text-[#7C8A9A] font-mono">ENSEMBLE ESTIMATOR</div>
                <div className="text-base font-bold text-white mt-1">Random Forest Ensemble</div>
                <div className="text-xs text-[#9AACBE] mt-1">Variance reduction across dense fingerprint bits</div>
              </div>
              <div className="p-4 rounded-lg bg-[#05070B] border border-white/[0.05]">
                <div className="text-xs text-[#7C8A9A] font-mono">UNCERTAINTY CALIBRATOR</div>
                <div className="text-base font-bold text-white mt-1">Inductive Conformal</div>
                <div className="text-xs text-[#9AACBE] mt-1">Non-conformity score quantile intervals (80%/90%/95%)</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">13-Step Checkpointed Inference Pipeline</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs font-mono text-[#9AACBE]">
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">1. INPUT_VALIDATION</div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">2. ENTITY_RESOLUTION</div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">3. CHEMICAL_STANDARDIZATION</div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">4. FEATURE_GENERATION</div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">5. SCHEMA_VALIDATION</div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">6. MODEL_LOAD</div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">7. INFERENCE_EXECUTION</div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">8. OOD_EVALUATION</div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">9. UNCERTAINTY_CALIBRATION</div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">10. HEURISTIC_SCORING</div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">11. PERSISTENCE_COMMIT</div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">12. SERIALIZATION</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 7: Molecular Intelligence & Cheminformatics ───── */}
      <section id="molecular" className="py-20 border-t border-white/[0.06] bg-[#070B10] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold text-[#0BDFA0] uppercase tracking-wider">Cheminformatics</span>
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

      {/* ─── Section 8: Step-by-Step Workflow ───────────────────────── */}
      <section id="workflow" className="py-20 border-t border-white/[0.06] bg-[#05070B] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold text-[#38BDF8] uppercase tracking-wider">Operational Workflow</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mt-2 mb-4">
              How ResistanceIQ Works
            </h2>
            <p className="text-[#9AACBE] text-base leading-relaxed">
              A 4-stage traversal taking researchers from crop commodity to validated durability forecast in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-[#0B1017] border border-white/[0.07] relative">
              <div className="w-8 h-8 rounded-full bg-[#0BDFA0]/10 text-[#0BDFA0] font-mono font-bold text-sm flex items-center justify-center mb-3">
                01
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Select Agronomic Context</h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed">
                Choose crop commodity (FAO ICC taxonomy) and target arthropod pest species.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#0B1017] border border-white/[0.07] relative">
              <div className="w-8 h-8 rounded-full bg-[#8B8CF8]/10 text-[#8B8CF8] font-mono font-bold text-sm flex items-center justify-center mb-3">
                02
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Target Biology</h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed">
                Resolve receptor protein, UniProt accession, IRAC Mode of Action, and 3D PDB structure.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#0B1017] border border-white/[0.07] relative">
              <div className="w-8 h-8 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] font-mono font-bold text-sm flex items-center justify-center mb-3">
                03
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Candidate Molecule</h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed">
                Input candidate chemistry via PubChem name search, SMILES entry, SDF upload, or 2D drawer.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#0B1017] border border-white/[0.07] relative">
              <div className="w-8 h-8 rounded-full bg-[#F3B14D]/10 text-[#F3B14D] font-mono font-bold text-sm flex items-center justify-center mb-3">
                04
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">Generate Forecast</h3>
              <p className="text-xs text-[#9AACBE] leading-relaxed">
                Calculate Log10 RR, conformal confidence bounds, OOD check, and export research dossier.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 9: Governance & Technology Stack ───────────────── */}
      <section id="governance" className="py-20 border-t border-white/[0.06] bg-[#070B10] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
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

      {/* ─── Section 10: Call To Action (CTA) ───────────────────────── */}
      <section className="py-20 border-t border-white/[0.06] bg-[#05070B] px-4 sm:px-8 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#0BDFA0]/10 blur-[130px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0BDFA0]/10 border border-[#0BDFA0]/20 text-[#0BDFA0] text-xs font-mono font-semibold tracking-wider uppercase">
            <span>RESEARCHER ACCESS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Accelerate Your Resistance Risk Screening
          </h2>

          <p className="text-[#9AACBE] text-base leading-relaxed max-w-xl mx-auto">
            Evaluate novel biopesticide candidates, simulate multi-generational selection pressure, and export audit-ready research dossiers in seconds.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0BDFA0] hover:bg-[#09c78e] text-[#020609] text-sm font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(11,223,160,0.3)] hover:shadow-[0_0_30px_rgba(11,223,160,0.5)]"
            >
              <span>Launch ResistanceIQ Workspace</span>
              <ArrowRight size={16} />
            </Link>

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
