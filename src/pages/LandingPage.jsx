import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Dna,
  FlaskConical,
  ShieldCheck,
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
  Microscope,
  Box,
  Fingerprint,
  Network,
} from 'lucide-react';
import useProjectStore from '../store/projectStore.js';

/* ─── 3D Wireframe Polyhedron Graphic (Left Hero Background) ───────── */
function WireframeSphereLeft() {
  return (
    <svg
      className="absolute -left-12 top-6 w-[280px] h-[280px] pointer-events-none opacity-20 select-none"
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wireGradLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0BDFA0" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8B8CF8" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {/* Outer Polyhedron Ring */}
      <polygon points="150,20 260,80 280,200 200,280 80,270 20,180 40,70" stroke="url(#wireGradLeft)" strokeWidth="1" strokeDasharray="3 3" />
      {/* Inner Lattice Nodes & Triangles */}
      <line x1="150" y1="20" x2="150" y2="150" stroke="url(#wireGradLeft)" strokeWidth="0.9" />
      <line x1="260" y1="80" x2="150" y2="150" stroke="url(#wireGradLeft)" strokeWidth="0.9" />
      <line x1="280" y1="200" x2="150" y2="150" stroke="url(#wireGradLeft)" strokeWidth="0.9" />
      <line x1="200" y1="280" x2="150" y2="150" stroke="url(#wireGradLeft)" strokeWidth="0.9" />
      <line x1="80" y1="270" x2="150" y2="150" stroke="url(#wireGradLeft)" strokeWidth="0.9" />
      <line x1="20" y1="180" x2="150" y2="150" stroke="url(#wireGradLeft)" strokeWidth="0.9" />
      <line x1="40" y1="70" x2="150" y2="150" stroke="url(#wireGradLeft)" strokeWidth="0.9" />

      {/* Internal Cross Bridges */}
      <line x1="40" y1="70" x2="260" y2="80" stroke="#0BDFA0" strokeWidth="0.7" strokeOpacity="0.35" />
      <line x1="20" y1="180" x2="280" y2="200" stroke="#38BDF8" strokeWidth="0.7" strokeOpacity="0.35" />
      <line x1="80" y1="270" x2="260" y2="80" stroke="#8B8CF8" strokeWidth="0.7" strokeOpacity="0.25" strokeDasharray="2 2" />

      {/* Glowing Molecular Vertices */}
      <circle cx="150" cy="20" r="3" fill="#0BDFA0" />
      <circle cx="260" cy="80" r="3" fill="#38BDF8" />
      <circle cx="280" cy="200" r="3" fill="#8B8CF8" />
      <circle cx="200" cy="280" r="3" fill="#0BDFA0" />
      <circle cx="80" cy="270" r="3" fill="#38BDF8" />
      <circle cx="20" cy="180" r="3" fill="#0BDFA0" />
      <circle cx="40" cy="70" r="3" fill="#8B8CF8" />
      <circle cx="150" cy="150" r="4" fill="#0BDFA0" />
    </svg>
  );
}

/* ─── 2D Chemical Structure Vector Component ───────────────────────── */
function ChemicalStructureView({ compoundKey }) {
  if (compoundKey === 'chlorantraniliprole') {
    return (
      <svg className="w-full h-16 text-[#38BDF8]" viewBox="0 0 160 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="35,22 55,12 75,22 75,44 55,54 35,44" stroke="#38BDF8" strokeWidth="1.3" fill="rgba(56,189,248,0.05)" />
        <line x1="75" y1="32" x2="95" y2="32" stroke="#38BDF8" strokeWidth="1.3" />
        <text x="98" y="36" fill="#F1F5F9" fontSize="8.5" fontFamily="monospace" fontWeight="bold">N</text>
        <line x1="108" y1="32" x2="125" y2="22" stroke="#38BDF8" strokeWidth="1.3" />
        <polygon points="125,22 145,32 140,50 120,50 115,32" stroke="#0BDFA0" strokeWidth="1.2" fill="rgba(11,223,160,0.05)" />
        <text x="18" y="25" fill="#F3B14D" fontSize="8" fontFamily="monospace" fontWeight="bold">Br</text>
        <text x="50" y="64" fill="#38BDF8" fontSize="8" fontFamily="monospace" fontWeight="bold">Cl</text>
        <text x="148" y="52" fill="#38BDF8" fontSize="8" fontFamily="monospace" fontWeight="bold">Cl</text>
      </svg>
    );
  }

  if (compoundKey === 'novel_isostere') {
    return (
      <svg className="w-full h-16 text-[#F3B14D]" viewBox="0 0 160 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="30,26 48,15 64,26 58,45 36,45" stroke="#F3B14D" strokeWidth="1.3" fill="rgba(243,177,77,0.05)" />
        <text x="44" y="20" fill="#F1F5F9" fontSize="8" fontFamily="monospace" fontWeight="bold">O</text>
        <text x="60" y="38" fill="#F1F5F9" fontSize="8" fontFamily="monospace" fontWeight="bold">N</text>
        <line x1="64" y1="26" x2="88" y2="26" stroke="#F3B14D" strokeWidth="1.3" />
        <polygon points="88,26 105,15 122,26 122,45 105,56 88,45" stroke="#38BDF8" strokeWidth="1.2" fill="rgba(56,189,248,0.05)" />
        <line x1="122" y1="36" x2="140" y2="36" stroke="#0BDFA0" strokeWidth="1.3" />
        <text x="143" y="40" fill="#0BDFA0" fontSize="8" fontFamily="monospace" fontWeight="bold">NO₂</text>
      </svg>
    );
  }

  // Default: Imidacloprid (Exact match to Reference Screenshot)
  return (
    <svg className="w-full h-16" viewBox="0 0 170 75" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Pyridine ring on left with Cl */}
      <polygon points="38,25 58,14 76,25 76,48 58,59 38,48" stroke="#38BDF8" strokeWidth="1.3" fill="rgba(56,189,248,0.06)" />
      <line x1="43" y1="28" x2="56" y2="20" stroke="#38BDF8" strokeWidth="0.9" strokeOpacity="0.8" />
      <line x1="72" y1="28" x2="72" y2="45" stroke="#38BDF8" strokeWidth="0.9" strokeOpacity="0.8" />
      <line x1="43" y1="45" x2="56" y2="53" stroke="#38BDF8" strokeWidth="0.9" strokeOpacity="0.8" />
      <text x="18" y="28" fill="#38BDF8" fontSize="9" fontFamily="monospace" fontWeight="bold">Cl</text>
      <line x1="28" y1="25" x2="38" y2="25" stroke="#38BDF8" strokeWidth="1.3" />
      <text x="54" y="57" fill="#F1F5F9" fontSize="8" fontFamily="monospace" fontWeight="bold">N</text>

      {/* Linker -CH2- to Imidazolidine */}
      <line x1="76" y1="36" x2="94" y2="36" stroke="#38BDF8" strokeWidth="1.3" />

      {/* Imidazolidine Ring */}
      <polygon points="94,36 108,19 126,26 122,49 102,49" stroke="#0BDFA0" strokeWidth="1.3" fill="rgba(11,223,160,0.06)" />
      <text x="92" y="34" fill="#F1F5F9" fontSize="8" fontFamily="monospace" fontWeight="bold">N</text>
      <text x="124" y="30" fill="#F1F5F9" fontSize="8" fontFamily="monospace" fontWeight="bold">N</text>

      {/* =N-NO2 Group */}
      <line x1="126" y1="26" x2="142" y2="26" stroke="#0BDFA0" strokeWidth="1.4" />
      <line x1="126" y1="29" x2="142" y2="29" stroke="#0BDFA0" strokeWidth="1.4" />
      <text x="144" y="30" fill="#0BDFA0" fontSize="8" fontFamily="monospace" fontWeight="bold">N</text>
      <line x1="152" y1="28" x2="162" y2="39" stroke="#0BDFA0" strokeWidth="1.2" />
      <text x="156" y="50" fill="#0BDFA0" fontSize="8" fontFamily="monospace" fontWeight="bold">NO₂</text>
    </svg>
  );
}

/* ─── Subtle Connected Nodes Graphic inside Console Background ───── */
function ConsoleNetworkBg() {
  return (
    <svg
      className="absolute right-2 top-12 w-32 h-32 pointer-events-none opacity-15 select-none"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line x1="20" y1="30" x2="60" y2="20" stroke="#38BDF8" strokeWidth="0.8" />
      <line x1="60" y1="20" x2="100" y2="40" stroke="#38BDF8" strokeWidth="0.8" />
      <line x1="60" y1="20" x2="50" y2="70" stroke="#0BDFA0" strokeWidth="0.8" />
      <line x1="50" y1="70" x2="90" y2="90" stroke="#0BDFA0" strokeWidth="0.8" />
      <line x1="100" y1="40" x2="90" y2="90" stroke="#8B8CF8" strokeWidth="0.8" />
      <circle cx="20" cy="30" r="2.5" fill="#38BDF8" />
      <circle cx="60" cy="20" r="3" fill="#0BDFA0" />
      <circle cx="100" cy="40" r="2.5" fill="#8B8CF8" />
      <circle cx="50" cy="70" r="3" fill="#38BDF8" />
      <circle cx="90" cy="90" r="3.5" fill="#0BDFA0" />
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
      moa: '4A (nAChR Modulator)',
      smiles: 'C1=CN=C(C)Cl)C=C1NC(=N)NCC2=NC=C(C=C)Cl',
      target: 'Nicotinic Acetylcholine Receptor (nAChR)',
      targetGene: 'nAChR α1/β2 subunit',
      pest: 'Myzus persicae',
      pestCommon: 'Green Peach Aphid',
      predictedLog10RR: 0.24,
      durabilityScore: 86,
      conformal90: '[-0.15, +0.62]',
      domainStatus: 'IN_DOMAIN',
      tanimotoSim: 0.94,
      riskLevel: 'LOW RISK',
      riskColor: '#0BDFA0',
      activeBits: '34/2048',
    },
    chlorantraniliprole: {
      key: 'chlorantraniliprole',
      name: 'Chlorantraniliprole',
      classification: 'Anthranilic Diamide (Bis-Amide)',
      formula: 'C18H14BrCl2N5O2',
      moa: '28 (Ryanodine Receptor Modulator)',
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
      activeBits: '48/2048',
    },
    novel_isostere: {
      key: 'novel_isostere',
      name: 'Iso-Oxazole #402',
      classification: 'Novel Heterocyclic Candidate Scaffold',
      formula: 'C14H16ClN3O3',
      moa: 'Novel Agrochemical Scaffold',
      smiles: 'CC1=NC(=NO1)C2=CC=C(C=C2)CNC(=N[N+](=O)[O-])NCC3=CN=C(C=C3)Cl',
      target: 'Acetylcholinesterase-1 (AChE1)',
      targetGene: 'ace-1 esterase (Q869C3)',
      pest: 'Helicoverpa armigera',
      pestCommon: 'Cotton Bollworm',
      predictedLog10RR: 0.68,
      durabilityScore: 68,
      conformal90: '[+0.21, +1.15]',
      domainStatus: 'BORDERLINE',
      tanimotoSim: 0.59,
      riskLevel: 'MODERATE RISK',
      riskColor: '#F3B14D',
      activeBits: '29/2048',
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
    <div className="min-h-screen bg-[#02070C] text-[#F1F5F9] font-sans antialiased overflow-x-hidden selection:bg-[#0BDFA0]/20 selection:text-[#0BDFA0]">
      {/* ─── 1. Header (Exact Match to Reference) ────────────────────── */}
      <header className="sticky top-0 z-50 h-[68px] border-b border-white/[0.06] bg-[#02070C]/90 backdrop-blur-xl">
        <div className="w-full max-w-[1360px] mx-auto h-full px-6 sm:px-10 lg:px-14 flex items-center justify-between">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 no-underline group select-none flex-shrink-0"
            aria-label="ResistanceIQ Homepage"
          >
            <div className="brand-logo-mark flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#0BDFA0] to-[#38BDF8] shadow-[0_0_12px_rgba(11,223,160,0.3)] transition-transform group-hover:scale-105">
              <Dna size={15} color="#02070C" strokeWidth={2.8} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-bold tracking-tight text-[#F1F5F9] group-hover:text-white transition-colors">
                Resistance<span className="text-[#0BDFA0]">IQ</span>
              </span>
              <span className="hidden md:inline-block text-[9.5px] font-mono font-medium text-[#7C8A9A] uppercase tracking-[0.14em] pl-2 border-l border-white/10">
                SCIENTIFIC INTELLIGENCE
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[13px] font-medium text-[#9AAFC0]">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#capabilities" className="hover:text-white transition-colors">Capabilities</a>
            <a href="#ml-engine" className="hover:text-white transition-colors">ML Architecture</a>
            <a href="#molecular" className="hover:text-white transition-colors">Cheminformatics</a>
            <a href="#workflow" className="hover:text-white transition-colors">How It Works</a>
            <a href="#governance" className="hover:text-white transition-colors">Governance</a>
          </nav>

          {/* Right Header Action */}
          <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
            <button
              onClick={handleOpenWorkspace}
              className="inline-flex items-center gap-1.5 h-[34px] px-3.5 rounded-lg border border-[#0BDFA0]/40 hover:border-[#0BDFA0] text-[#0BDFA0] hover:bg-[#0BDFA0]/10 text-[12px] font-semibold tracking-wide transition-all duration-150 cursor-pointer"
            >
              <span>Open Workspace →</span>
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#9AAFC0] hover:text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#071019] border-b border-white/10 px-6 py-5 space-y-3 text-sm font-medium text-[#9AAFC0]">
          <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white">About</a>
          <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white">Capabilities</a>
          <a href="#ml-engine" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white">ML Architecture</a>
          <a href="#molecular" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white">Cheminformatics</a>
          <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white">How It Works</a>
          <a href="#governance" onClick={() => setMobileMenuOpen(false)} className="block hover:text-white">Governance</a>
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <Link to="/login" className="text-center py-2 rounded-lg bg-white/5 text-white font-semibold">Sign In</Link>
            <button onClick={handleOpenWorkspace} className="w-full py-2.5 rounded-lg bg-[#0BDFA0] text-[#02070C] font-bold">Open Workspace →</button>
          </div>
        </div>
      )}

      {/* ─── 2. Hero Section (Exact Match to Reference Proportions) ───── */}
      <section className="relative pt-8 sm:pt-10 lg:pt-12 pb-10 sm:pb-12 overflow-hidden">
        {/* 3D Polyhedron Wireframe Graphic on Left Background */}
        <WireframeSphereLeft />

        {/* Soft Background Radial Flare */}
        <div className="absolute top-10 right-1/4 w-[400px] h-[260px] bg-[#0BDFA0]/6 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* ─── LEFT COLUMN (~47%) ─── */}
            <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-center">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0BDFA0]/10 border border-[#0BDFA0]/25 text-[#0BDFA0] text-[9.5px] font-mono font-semibold tracking-wider uppercase mb-3.5 self-start">
                <span>SCIENTIFIC INTELLIGENCE PLATFORM - AI-POWERED RESISTANCE FORECASTING</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-[38px] xl:text-[42px] font-extrabold tracking-tight text-white leading-[1.08] mb-3.5 max-w-[480px]">
                Resistance<span className="text-[#0BDFA0]">IQ</span> –<br />
                AI-Powered<br />
                Pesticide Resistance<br />
                Forecasting
              </h1>

              {/* Description */}
              <p className="text-[13.5px] text-[#9AAFC0] leading-[1.5] mb-4.5 max-w-[460px]">
                Scientific Intelligence Platform for computational hypothesis generation, pesticide durability forecasting, molecular target evaluation, and research reproducibility.
              </p>

              {/* Discovery Pipeline Ribbon */}
              <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono font-semibold mb-5 max-w-[500px]">
                <span className="px-2 py-0.5 rounded bg-white/[0.03] text-[#0BDFA0] border border-[#0BDFA0]/20">CROP</span>
                <span className="text-[#7C8A9A] text-[10px]">→</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.03] text-[#38BDF8] border border-[#38BDF8]/20">THREAT</span>
                <span className="text-[#7C8A9A] text-[10px]">→</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.03] text-[#8B8CF8] border border-[#8B8CF8]/20">TARGET</span>
                <span className="text-[#7C8A9A] text-[10px]">→</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.03] text-violet-300 border border-violet-400/20">PROTEIN</span>
                <span className="text-[#7C8A9A] text-[10px]">→</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.03] text-amber-300 border border-amber-400/20">MOLECULE</span>
                <span className="text-[#7C8A9A] text-[10px]">→</span>
                <span className="px-2 py-0.5 rounded bg-[#0BDFA0]/15 text-[#0BDFA0] font-bold border border-[#0BDFA0]/40">FORECAST</span>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleOpenWorkspace}
                  className="inline-flex items-center justify-center gap-1.5 h-[38px] px-5 rounded-lg bg-[#0BDFA0] hover:bg-[#09c78e] text-[#02070C] text-[12.5px] font-bold tracking-wide transition-all duration-150 shadow-[0_0_15px_rgba(11,223,160,0.25)] cursor-pointer"
                >
                  <span>Open Workspace →</span>
                </button>

                <a
                  href="#capabilities"
                  className="inline-flex items-center justify-center gap-1.5 h-[38px] px-4 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 text-[#F1F5F9] text-[12.5px] font-semibold transition-all duration-150"
                >
                  <Sparkles size={13} className="text-[#38BDF8]" />
                  <span>Explore Forecast Intelligence ↓</span>
                </a>
              </div>
            </div>

            {/* ─── RIGHT COLUMN (~53% - Live Inference Console) ─── */}
            <div className="lg:col-span-7 xl:col-span-7 relative">
              {/* Console Dashboard Container */}
              <div className="relative rounded-[14px] border border-cyan-500/20 bg-[#071019] p-4 sm:p-5 shadow-[0_16px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col justify-between">
                {/* Background Network Graphic */}
                <ConsoleNetworkBg />

                <div className="relative z-10 space-y-3.5">
                  {/* Console Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.07]">
                    <div className="font-mono text-[10.5px] font-bold text-[#38BDF8] tracking-wider">
                      RESISTANCEIQ LIVE INFERENCE CONSOLE
                    </div>
                    <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-[#0BDFA0]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0BDFA0] shadow-[0_0_6px_#0BDFA0]" />
                      <span className="font-bold">SYSTEM ONLINE</span>
                    </div>
                  </div>

                  {/* Molecule Selector Tabs */}
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-[10px] text-[#7C8A9A]">Select Molecule:</span>
                    <button
                      onClick={() => setSelectedDemoCompound('imidacloprid')}
                      className={`px-2.5 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                        selectedDemoCompound === 'imidacloprid'
                          ? 'bg-[#0BDFA0]/15 text-[#0BDFA0] border border-[#0BDFA0]/40 font-bold'
                          : 'bg-white/[0.02] text-[#9AAFC0] hover:text-white border border-white/[0.06]'
                      }`}
                    >
                      Imidacloprid
                    </button>
                    <button
                      onClick={() => setSelectedDemoCompound('chlorantraniliprole')}
                      className={`px-2.5 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                        selectedDemoCompound === 'chlorantraniliprole'
                          ? 'bg-[#0BDFA0]/15 text-[#0BDFA0] border border-[#0BDFA0]/40 font-bold'
                          : 'bg-white/[0.02] text-[#9AAFC0] hover:text-white border border-white/[0.06]'
                      }`}
                    >
                      Chlorantraniliprole
                    </button>
                    <button
                      onClick={() => setSelectedDemoCompound('novel_isostere')}
                      className={`px-2.5 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                        selectedDemoCompound === 'novel_isostere'
                          ? 'bg-[#0BDFA0]/15 text-[#0BDFA0] border border-[#0BDFA0]/40 font-bold'
                          : 'bg-white/[0.02] text-[#9AAFC0] hover:text-white border border-white/[0.06]'
                      }`}
                    >
                      Iso-Oxazole #402
                    </button>
                  </div>

                  {/* Candidate Molecule Dossier Panel (3-Column Horizontal Layout) */}
                  <div className="p-3 rounded-xl bg-[#03080E]/90 border border-white/[0.05] grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                    {/* Left: Info */}
                    <div className="md:col-span-4">
                      <div className="text-[9px] font-mono font-bold text-[#0BDFA0] uppercase tracking-wider mb-0.5">CANDIDATE MOLECULE</div>
                      <div className="text-[15px] font-bold text-white leading-tight">{activeDemo.name}</div>
                      <div className="text-[10px] text-[#9AAFC0] mt-0.5">{activeDemo.classification}</div>
                    </div>

                    {/* Center: 2D Chemical Structure Drawing */}
                    <div className="md:col-span-4 flex items-center justify-center py-0.5">
                      <ChemicalStructureView compoundKey={activeDemo.key} />
                    </div>

                    {/* Right: Technical Properties */}
                    <div className="md:col-span-4 text-[10px] font-mono space-y-0.5 text-[#9AAFC0] border-t md:border-t-0 md:border-l border-white/[0.06] md:pl-2.5 pt-1.5 md:pt-0">
                      <div><span className="text-[#7C8A9A]">Formula:</span> <span className="text-white font-semibold">{activeDemo.formula}</span></div>
                      <div><span className="text-[#7C8A9A]">Mode of Action (IRAC):</span> <span className="text-white font-semibold">{activeDemo.moa}</span></div>
                      <div className="truncate"><span className="text-[#7C8A9A]">SMILES:</span> <span className="text-[#38BDF8]">{activeDemo.smiles}</span></div>
                    </div>
                  </div>

                  {/* Target Receptor & Target Organism (Two Equal Cards) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-[#03080E]/90 border border-white/[0.05]">
                      <div className="text-[9px] font-mono font-bold text-[#38BDF8] uppercase tracking-wider mb-0.5">TARGET RECEPTOR</div>
                      <div className="text-[11.5px] font-bold text-white truncate">{activeDemo.target}</div>
                      <div className="text-[9.5px] font-mono text-[#7C8A9A]">{activeDemo.targetGene}</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#03080E]/90 border border-white/[0.05] flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-mono font-bold text-[#F3B14D] uppercase tracking-wider mb-0.5">TARGET ORGANISM</div>
                        <div className="text-[11.5px] font-bold text-white italic">{activeDemo.pest}</div>
                        <div className="text-[9.5px] font-mono text-[#7C8A9A]">{activeDemo.pestCommon}</div>
                      </div>
                      <Bug size={20} className="text-[#0BDFA0]/30 flex-shrink-0 ml-1.5" />
                    </div>
                  </div>

                  {/* Predictive ML Output (4 Metric Columns) */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-[9px] font-mono font-bold text-[#0BDFA0] uppercase tracking-wider mb-2">PREDICTIVE ML OUTPUT</div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center sm:text-left">
                      <div className="p-1.5 sm:border-r border-white/[0.06]">
                        <div className="text-[8.5px] text-[#7C8A9A] font-mono uppercase">RESISTANCE INDEX</div>
                        <div className="text-lg font-bold font-mono text-white mt-0.5">+{activeDemo.predictedLog10RR}</div>
                        <div className="text-[8.5px] text-[#7C8A9A]">Log10 Resistance Ratio</div>
                      </div>

                      <div className="p-1.5 sm:border-r border-white/[0.06]">
                        <div className="text-[8.5px] text-[#7C8A9A] font-mono uppercase">DURABILITY SCORE</div>
                        <div className="text-lg font-bold font-mono text-[#0BDFA0] mt-0.5">
                          {activeDemo.durabilityScore}<span className="text-[9.5px] text-[#7C8A9A]">/100</span>
                        </div>
                        <div className="text-[8.5px] text-[#7C8A9A]">Field Efficacy Horizon</div>
                      </div>

                      <div className="p-1.5 sm:border-r border-white/[0.06]">
                        <div className="text-[8.5px] text-[#7C8A9A] font-mono uppercase">90% CONFORMAL INTERVAL</div>
                        <div className="text-[11px] font-bold font-mono text-white mt-1 truncate">{activeDemo.conformal90}</div>
                        <div className="text-[8.5px] text-[#7C8A9A]">90% Coverage</div>
                      </div>

                      <div className="p-1.5">
                        <div className="text-[8.5px] text-[#7C8A9A] font-mono uppercase">RISK STATUS</div>
                        <div className="text-[11px] font-bold font-mono text-[#0BDFA0] mt-1">{activeDemo.riskLevel}</div>
                        <div className="text-[8.5px] text-[#7C8A9A]">{activeDemo.domainStatus}</div>
                      </div>
                    </div>
                  </div>

                  {/* Technical Signals Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[9.5px] font-mono text-[#7C8A9A]">
                    <span className="text-[#9AAFC0] font-bold">TECHNICAL SIGNALS</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.03] text-[#0BDFA0] border border-[#0BDFA0]/20">▸ ECFP4 ({activeDemo.activeBits})</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.03] text-[#38BDF8] border border-[#38BDF8]/20">▸ TANIMOTO ({activeDemo.tanimotoSim})</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.03] text-[#8B8CF8] border border-[#8B8CF8]/20">▸ CONFORMAL (90%)</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.03] text-[#F3B14D] border border-[#F3B14D]/20">▸ OOD GATING (Active)</span>
                  </div>
                </div>

                {/* Console Footer */}
                <div className="relative z-10 pt-2.5 mt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[9.5px] font-mono text-[#7C8A9A]">
                  <span>MODEL: <span className="text-[#0BDFA0]">v2.0.0-gbrt-ecfp4</span> · ILLUSTRATIVE FORECAST PREVIEW</span>
                  <button
                    onClick={handleOpenWorkspace}
                    className="text-[#0BDFA0] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span>Evaluate Chemistry →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 3. Four Technical Metric Cards (Exact Match to Reference) ── */}
          <div className="mt-10 sm:mt-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {/* Card 1: 1,059-D */}
              <div className="p-4 rounded-xl bg-[#071019] border border-white/[0.06] flex items-center gap-3.5 hover:border-[#0BDFA0]/30 transition-all">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-[#0BDFA0] flex items-center justify-center border border-teal-500/20 flex-shrink-0">
                  <Box size={20} />
                </div>
                <div>
                  <div className="text-lg font-bold font-mono text-[#0BDFA0]">1,059-D</div>
                  <div className="text-[11.5px] font-bold text-white tracking-wide">FEATURE DIMENSIONS</div>
                  <div className="text-[10.5px] text-[#7C8A9A]">High-dimensional molecular space</div>
                </div>
              </div>

              {/* Card 2: 2,048-BIT */}
              <div className="p-4 rounded-xl bg-[#071019] border border-white/[0.06] flex items-center gap-3.5 hover:border-[#8B8CF8]/30 transition-all">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-[#8B8CF8] flex items-center justify-center border border-violet-500/20 flex-shrink-0">
                  <Fingerprint size={20} />
                </div>
                <div>
                  <div className="text-lg font-bold font-mono text-[#8B8CF8]">2,048-BIT</div>
                  <div className="text-[11.5px] font-bold text-white tracking-wide">ECFP4 FINGERPRINTS</div>
                  <div className="text-[10.5px] text-[#7C8A9A]">Morgan circular fingerprints</div>
                </div>
              </div>

              {/* Card 3: 90% BOUNDS */}
              <div className="p-4 rounded-xl bg-[#071019] border border-white/[0.06] flex items-center gap-3.5 hover:border-[#38BDF8]/30 transition-all">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-[#38BDF8] flex items-center justify-center border border-cyan-500/20 flex-shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="text-lg font-bold font-mono text-[#38BDF8]">90% BOUNDS</div>
                  <div className="text-[11.5px] font-bold text-white tracking-wide">CONFORMAL COVERAGE</div>
                  <div className="text-[10.5px] text-[#7C8A9A]">Statistical uncertainty guarantees</div>
                </div>
              </div>

              {/* Card 4: TANIMOTO */}
              <div className="p-4 rounded-xl bg-[#071019] border border-white/[0.06] flex items-center gap-3.5 hover:border-[#F3B14D]/30 transition-all">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-[#F3B14D] flex items-center justify-center border border-amber-500/20 flex-shrink-0">
                  <Network size={20} />
                </div>
                <div>
                  <div className="text-lg font-bold font-mono text-[#F3B14D]">TANIMOTO</div>
                  <div className="text-[11.5px] font-bold text-white tracking-wide">MOLECULAR SIMILARITY</div>
                  <div className="text-[10.5px] text-[#7C8A9A]">Structural similarity engine</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. About Section (Exact Match to Reference) ─────────────── */}
      <section id="about" className="py-16 sm:py-20 border-t border-white/[0.06] bg-[#03080E]">
        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="text-center max-w-[950px] mx-auto mb-12">
            <span className="text-[11px] font-mono font-bold text-[#0BDFA0] uppercase tracking-wider">ABOUT RESISTANCEIQ</span>
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-white tracking-tight mt-2 mb-3.5">
              Computational Intelligence for Agrochemical Durability
            </h2>
            <p className="text-[#9AAFC0] text-xs sm:text-[13.5px] leading-relaxed max-w-[850px] mx-auto">
              ResistanceIQ is an academic and translational research platform engineered to proactively forecast pest resistance phenotypes, screen novel chemistries against mutant target receptors, and establish rigorous uncertainty bounds before field application.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="p-5 sm:p-6 rounded-2xl bg-[#071019] border border-white/[0.06] hover:border-[#0BDFA0]/30 transition-all flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-[#0BDFA0] flex items-center justify-center mb-4 border border-teal-500/20">
                  <Database size={18} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2 tracking-wide">UNIFIED SCIENTIFIC KNOWLEDGE</h3>
                <p className="text-[11.5px] text-[#9AAFC0] leading-relaxed">
                  Connects agricultural ontologies (FAO, ICC, IRAC MoA), protein sequences (UniProt), coordinate structures (AlphaFold/PDB), and decades of toxicological bioassays (APRD, ChEMBL).
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-[#071019] border border-white/[0.06] hover:border-[#8B8CF8]/30 transition-all flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-[#8B8CF8] flex items-center justify-center mb-4 border border-violet-500/20">
                  <Cpu size={18} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2 tracking-wide">MACHINE-LEARNING INFERENCE</h3>
                <p className="text-[11.5px] text-[#9AAFC0] leading-relaxed">
                  Gradient Boosted Regression Trees and Random Forest ensembles trained on 1,059-dimensional feature vectors containing Morgan/ECFP4 fingerprints and descriptors.
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-[#071019] border border-white/[0.06] hover:border-[#38BDF8]/30 transition-all flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-[#38BDF8] flex items-center justify-center mb-4 border border-cyan-500/20">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2 tracking-wide">CONFORMAL ERROR BOUNDS</h3>
                <p className="text-[11.5px] text-[#9AAFC0] leading-relaxed">
                  Distribution-free uncertainty estimation providing mathematically guaranteed 80%, 90%, and 95% confidence intervals, paired with Tanimoto training-manifold distance checks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. Scientific Intelligence Modules (Exact Match to Reference) */}
      <section id="capabilities" className="py-16 sm:py-20 border-t border-white/[0.06] bg-[#02070C]">
        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="text-center max-w-[950px] mx-auto mb-12">
            <span className="text-[11px] font-mono font-bold text-[#0BDFA0] uppercase tracking-wider">SCIENTIFIC INTELLIGENCE MODULES</span>
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-white tracking-tight mt-2 mb-3.5">
              Six Core Modules Powering Evidence-Based Discovery
            </h2>
            <p className="text-[#9AAFC0] text-xs sm:text-[13.5px] leading-relaxed">
              Six core computational modules supporting hypothesis generation, cheminformatics validation, and regulatory reproducibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-5 sm:p-6 rounded-2xl bg-[#071019] border border-white/[0.06] hover:border-[#0BDFA0]/40 transition-all flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-mono font-bold text-[#0BDFA0] mb-2">01</div>
                <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#0BDFA0]" />
                  <span>Resistance Forecasting</span>
                </h3>
                <p className="text-[11.5px] text-[#9AAFC0] leading-relaxed mb-3">
                  Predicts Resistance Ratio (Log10 RR) and durability scores calibrated across 40+ years of toxicological bioassays using temporal train/test splits.
                </p>
              </div>
              <span className="text-[10.5px] font-mono text-[#0BDFA0] font-semibold">GBRT + Random Forest Ensemble</span>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-[#071019] border border-white/[0.06] hover:border-[#8B8CF8]/40 transition-all flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-mono font-bold text-[#8B8CF8] mb-2">02</div>
                <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <Atom size={16} className="text-[#8B8CF8]" />
                  <span>Molecular Intelligence</span>
                </h3>
                <p className="text-[11.5px] text-[#9AAFC0] leading-relaxed mb-3">
                  Parses SMILES/SDF, executes valence checks, generates 2048-bit ECFP4 circular fingerprints, computes RDKit descriptors, and supports 2D molecular sketching.
                </p>
              </div>
              <span className="text-[10.5px] font-mono text-[#8B8CF8] font-semibold">2048-Bit Morgan / ECFP4</span>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-[#071019] border border-white/[0.06] hover:border-[#38BDF8]/40 transition-all flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-mono font-bold text-[#38BDF8] mb-2">03</div>
                <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <Microscope size={16} className="text-[#38BDF8]" />
                  <span>Target & Protein Intelligence</span>
                </h3>
                <p className="text-[11.5px] text-[#9AAFC0] leading-relaxed mb-3">
                  Ontological traversal connecting arthropod pests to UniProt receptor sequences, AlphaFold 3D coordinates, and IRAC biochemical modes of action.
                </p>
              </div>
              <span className="text-[10.5px] font-mono text-[#38BDF8] font-semibold">UniProt & AlphaFold Traversal</span>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-[#071019] border border-white/[0.06] hover:border-[#F3B14D]/40 transition-all flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-mono font-bold text-[#F3B14D] mb-2">04</div>
                <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <GitBranch size={16} className="text-[#F3B14D]" />
                  <span>Scientific Provenance</span>
                </h3>
                <p className="text-[11.5px] text-[#9AAFC0] leading-relaxed mb-3">
                  Cryptographic model verification with SHA-256 artifact hashes, dataset manifests, and deterministic seed logging for audit traceability.
                </p>
              </div>
              <span className="text-[10.5px] font-mono text-[#F3B14D] font-semibold">SHA-256 Model Checksums</span>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-[#071019] border border-white/[0.06] hover:border-[#0BDFA0]/40 transition-all flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-mono font-bold text-[#0BDFA0] mb-2">05</div>
                <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <FileText size={16} className="text-[#0BDFA0]" />
                  <span>Research Reproducibility</span>
                </h3>
                <p className="text-[11.5px] text-[#9AAFC0] leading-relaxed mb-3">
                  Generates deterministic PDF, CSV, and JSON dossiers containing complete feature breakdowns, conformal intervals, and audit histories.
                </p>
              </div>
              <span className="text-[10.5px] font-mono text-[#0BDFA0] font-semibold">Audit-Ready Dossier Exports</span>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-[#071019] border border-white/[0.06] hover:border-[#8B8CF8]/40 transition-all flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-mono font-bold text-[#8B8CF8] mb-2">06</div>
                <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                  <FlaskConical size={16} className="text-[#8B8CF8]" />
                  <span>Candidate Evaluation</span>
                </h3>
                <p className="text-[11.5px] text-[#9AAFC0] leading-relaxed mb-3">
                  Multi-criteria candidate prioritization ranking efficacy against target mutations while screening out-of-distribution scaffolds via Tanimoto distance.
                </p>
              </div>
              <span className="text-[10.5px] font-mono text-[#8B8CF8] font-semibold">Tanimoto Manifold Gating</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. How It Works (7-Stage Discovery Pipeline) ───────────── */}
      <section id="workflow" className="py-16 sm:py-20 border-t border-white/[0.06] bg-[#03080E]">
        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="text-center max-w-[850px] mx-auto mb-12">
            <span className="text-[11px] font-mono font-bold text-[#38BDF8] uppercase tracking-wider">OPERATIONAL PIPELINE</span>
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-white tracking-tight mt-2 mb-3.5">
              How ResistanceIQ Works
            </h2>
            <p className="text-[#9AAFC0] text-xs sm:text-[13.5px] leading-relaxed">
              A 7-stage discovery timeline connecting agricultural crop taxonomy down to molecular coordinate structures and conformal durability forecasts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3.5 rounded-xl bg-[#071019] border border-white/[0.06] text-center flex flex-col items-center justify-between min-h-[130px]">
              <div className="w-6 h-6 rounded-full bg-[#0BDFA0]/10 text-[#0BDFA0] font-mono font-bold text-[10px] flex items-center justify-center mb-1">01</div>
              <Sprout size={16} className="text-[#0BDFA0] mb-1" />
              <div className="text-[11px] font-bold text-white">01 CROP</div>
              <div className="text-[9.5px] text-[#7C8A9A]">FAO ICC Taxonomy</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#071019] border border-white/[0.06] text-center flex flex-col items-center justify-between min-h-[130px]">
              <div className="w-6 h-6 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] font-mono font-bold text-[10px] flex items-center justify-center mb-1">02</div>
              <Bug size={16} className="text-[#38BDF8] mb-1" />
              <div className="text-[11px] font-bold text-white">02 THREAT</div>
              <div className="text-[9.5px] text-[#7C8A9A]">Arthropod Species</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#071019] border border-white/[0.06] text-center flex flex-col items-center justify-between min-h-[130px]">
              <div className="w-6 h-6 rounded-full bg-[#8B8CF8]/10 text-[#8B8CF8] font-mono font-bold text-[10px] flex items-center justify-center mb-1">03</div>
              <Atom size={16} className="text-[#8B8CF8] mb-1" />
              <div className="text-[11px] font-bold text-white">03 TARGET</div>
              <div className="text-[9.5px] text-[#7C8A9A]">IRAC MoA Receptor</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#071019] border border-white/[0.06] text-center flex flex-col items-center justify-between min-h-[130px]">
              <div className="w-6 h-6 rounded-full bg-violet-400/10 text-violet-300 font-mono font-bold text-[10px] flex items-center justify-center mb-1">04</div>
              <Dna size={16} className="text-violet-300 mb-1" />
              <div className="text-[11px] font-bold text-white">04 PROTEIN</div>
              <div className="text-[9.5px] text-[#7C8A9A]">UniProt & 3D PDB</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#071019] border border-white/[0.06] text-center flex flex-col items-center justify-between min-h-[130px]">
              <div className="w-6 h-6 rounded-full bg-amber-400/10 text-amber-300 font-mono font-bold text-[10px] flex items-center justify-center mb-1">05</div>
              <FlaskConical size={16} className="text-amber-300 mb-1" />
              <div className="text-[11px] font-bold text-white">05 MOLECULE</div>
              <div className="text-[9.5px] text-[#7C8A9A]">SMILES / SDF / Draw</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#071019] border border-white/[0.06] text-center flex flex-col items-center justify-between min-h-[130px]">
              <div className="w-6 h-6 rounded-full bg-cyan-400/10 text-cyan-300 font-mono font-bold text-[10px] flex items-center justify-center mb-1">06</div>
              <Compass size={16} className="text-cyan-300 mb-1" />
              <div className="text-[11px] font-bold text-white">06 REVIEW</div>
              <div className="text-[9.5px] text-[#7C8A9A]">Tanimoto OOD Gating</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0BDFA0]/10 border border-[#0BDFA0]/30 text-center flex flex-col items-center justify-between min-h-[130px]">
              <div className="w-6 h-6 rounded-full bg-[#0BDFA0] text-[#02070C] font-mono font-bold text-[10px] flex items-center justify-center mb-1">07</div>
              <BarChart3 size={16} className="text-[#0BDFA0] mb-1" />
              <div className="text-[11px] font-bold text-[#0BDFA0]">07 FORECAST</div>
              <div className="text-[9.5px] text-[#9AAFC0]">Conformal Bounds</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. ML Architecture Pipeline ────────────────────────────── */}
      <section id="ml-engine" className="py-16 sm:py-20 border-t border-white/[0.06] bg-[#02070C]">
        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="text-center max-w-[850px] mx-auto mb-12">
            <span className="text-[11px] font-mono font-bold text-[#8B8CF8] uppercase tracking-wider">INFERENCE ARCHITECTURE</span>
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-white tracking-tight mt-2 mb-3.5">
              Machine Learning Pipeline & Uncertainty Calibration
            </h2>
            <p className="text-[#9AAFC0] text-xs sm:text-[13.5px] leading-relaxed">
              Technical representation of the 1,059-D feature engineering, ensemble regression, and inductive conformal prediction flow.
            </p>
          </div>

          <div className="p-5 sm:p-7 rounded-2xl bg-[#071019] border border-white/[0.06] space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-[#03080E] border border-white/[0.05] min-h-[110px] flex flex-col justify-center">
                <div className="text-[9.5px] font-mono text-[#0BDFA0] font-bold uppercase">MOLECULAR REP</div>
                <div className="text-[11px] font-bold text-white mt-1">SMILES Parser</div>
                <div className="text-[9.5px] text-[#7C8A9A] mt-0.5">Canonical Forms</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#03080E] border border-white/[0.05] min-h-[110px] flex flex-col justify-center">
                <div className="text-[9.5px] font-mono text-[#38BDF8] font-bold uppercase">ECFP4 FINGERPRINT</div>
                <div className="text-[11px] font-bold text-white mt-1">2,048 Bits</div>
                <div className="text-[9.5px] text-[#7C8A9A] mt-0.5">Morgan Radius 2</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#03080E] border border-white/[0.05] min-h-[110px] flex flex-col justify-center">
                <div className="text-[9.5px] font-mono text-[#8B8CF8] font-bold uppercase">FEATURE PROCESS</div>
                <div className="text-[11px] font-bold text-white mt-1">1,059-D Vector</div>
                <div className="text-[9.5px] text-[#7C8A9A] mt-0.5">RDKit Descriptors</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#03080E] border border-white/[0.05] min-h-[110px] flex flex-col justify-center">
                <div className="text-[9.5px] font-mono text-violet-300 font-bold uppercase">ML INFERENCE</div>
                <div className="text-[11px] font-bold text-white mt-1">GBRT + RF</div>
                <div className="text-[9.5px] text-[#7C8A9A] mt-0.5">Ensemble Trees</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#03080E] border border-white/[0.05] min-h-[110px] flex flex-col justify-center">
                <div className="text-[9.5px] font-mono text-amber-300 font-bold uppercase">CONFORMAL BOUNDS</div>
                <div className="text-[11px] font-bold text-white mt-1">80% / 90% / 95%</div>
                <div className="text-[9.5px] text-[#7C8A9A] mt-0.5">Quantile Intervals</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0BDFA0]/10 border border-[#0BDFA0]/30 min-h-[110px] flex flex-col justify-center">
                <div className="text-[9.5px] font-mono text-[#0BDFA0] font-bold uppercase">RESISTANCE FORECAST</div>
                <div className="text-[11px] font-bold text-[#0BDFA0] mt-1">Log10 RR Shift</div>
                <div className="text-[9.5px] text-[#9AAFC0] mt-0.5">Durability Score</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3.5 border-t border-white/[0.06] text-xs font-mono text-[#9AAFC0]">
              <div className="p-3 rounded-xl bg-[#03080E] border border-white/[0.04]">
                <div className="text-[#7C8A9A]">TEMPORAL BENCHMARK</div>
                <div className="text-white font-semibold mt-0.5">Train: 1980–2012 | Test: 2018–2026</div>
              </div>
              <div className="p-3 rounded-xl bg-[#03080E] border border-white/[0.04]">
                <div className="text-[#7C8A9A]">OOD MANIFOLD GATING</div>
                <div className="text-white font-semibold mt-0.5">Tanimoto Max Similarity Filter</div>
              </div>
              <div className="p-3 rounded-xl bg-[#03080E] border border-white/[0.04]">
                <div className="text-[#7C8A9A]">UNCERTAINTY METHOD</div>
                <div className="text-white font-semibold mt-0.5">Inductive Conformal Prediction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. Cheminformatics Core ─────────────────────────────────── */}
      <section id="molecular" className="py-16 sm:py-20 border-t border-white/[0.06] bg-[#03080E]">
        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="text-center max-w-[850px] mx-auto mb-12">
            <span className="text-[11px] font-mono font-bold text-[#0BDFA0] uppercase tracking-wider">CHEMINFORMATICS CORE</span>
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-white tracking-tight mt-2 mb-3.5">
              Molecular Intelligence & Chemical Resolution
            </h2>
            <p className="text-[#9AAFC0] text-xs sm:text-[13.5px] leading-relaxed">
              Automated chemical ingestion supporting SMILES string validation, SDF file upload, PubChem database synchronization, and live 2D structure sketching.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7 space-y-3.5">
              <div className="p-4.5 rounded-2xl bg-[#071019] border border-white/[0.06]">
                <h3 className="text-[13px] font-bold text-white mb-1">2048-Bit Morgan / ECFP4 Fingerprints</h3>
                <p className="text-[11.5px] text-[#9AAFC0] leading-relaxed">
                  Encodes circular topological atomic environments at radius 2, capturing specific pharmacophore motifs that drive bioassay activity.
                </p>
              </div>

              <div className="p-4.5 rounded-2xl bg-[#071019] border border-white/[0.06]">
                <h3 className="text-[13px] font-bold text-white mb-1">Physicochemical Descriptors</h3>
                <p className="text-[11.5px] text-[#9AAFC0] leading-relaxed">
                  Real-time computation of Molecular Weight (MW), Wildman-Crippen LogP, Topological Polar Surface Area (TPSA), H-Bond Donors/Acceptors, and Rotatable Bonds.
                </p>
              </div>

              <div className="p-4.5 rounded-2xl bg-[#071019] border border-white/[0.06]">
                <h3 className="text-[13px] font-bold text-white mb-1">Automated Resolution & Valence Verification</h3>
                <p className="text-[11.5px] text-[#9AAFC0] leading-relaxed">
                  Sanitizes kekule forms, verifies atom valences, flags unphysical bridgeheads, and normalizes aromaticity.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 p-5 rounded-2xl bg-[#071019] border border-white/[0.06] space-y-2.5 font-mono text-xs">
              <div className="text-[#0BDFA0] font-bold pb-2 border-b border-white/[0.08] tracking-wider text-[10.5px]">
                CHEMICAL RESOLVER // SAMPLE FEATURE EXTRACT
              </div>
              <div className="space-y-2 text-[#9AAFC0] text-[10.5px]">
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span>Active Ingredient:</span>
                  <span className="text-white font-semibold">Imidacloprid (CID 86287518)</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span>Molecular Weight:</span>
                  <span className="text-white font-semibold">255.66 g/mol</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span>Calculated LogP:</span>
                  <span className="text-white font-semibold">0.57</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span>TPSA:</span>
                  <span className="text-white font-semibold">63.02 Å²</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span>H-Bond Donors / Acceptors:</span>
                  <span className="text-white font-semibold">1 / 5</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-white/[0.04]">
                  <span>Rotatable Bonds:</span>
                  <span className="text-white font-semibold">2</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>ECFP4 Active Bits:</span>
                  <span className="text-[#0BDFA0] font-bold">34 / 2048</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9. Governance & Trust Section ──────────────────────────── */}
      <section id="governance" className="py-16 sm:py-20 border-t border-white/[0.06] bg-[#02070C]">
        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Scientific Governance */}
            <div className="p-6 rounded-2xl bg-[#071019] border border-white/[0.06]">
              <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">SCIENTIFIC GOVERNANCE & TRUST</span>
              <h2 className="text-lg font-bold text-white mt-1 mb-3.5">Locked Benchmark Artifact & Integrity</h2>
              <div className="space-y-2.5 font-mono text-[11px] text-[#9AAFC0]">
                <div className="flex justify-between py-1 border-b border-white/[0.06]">
                  <span>Model Identifier:</span>
                  <span className="text-white font-semibold">v2.0.0-gbrt-ecfp4.joblib</span>
                </div>
                <div className="py-1 border-b border-white/[0.06]">
                  <div className="text-[#7C8A9A] mb-0.5">SHA-256 Checksum:</div>
                  <div className="text-[#0BDFA0] break-all font-semibold">6fc915fa26716dc4a06bad71f586af95ee071acf11e9a5b8acdc5171fed55622</div>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.06]">
                  <span>Operational Mode:</span>
                  <span className="text-amber-300 font-bold">RESEARCH / VALIDATION MODE</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Governance Status:</span>
                  <span className="text-amber-300 font-bold">REQUIRES VALIDATION</span>
                </div>
              </div>
              <p className="text-[10.5px] text-[#7C8A9A] mt-4 leading-relaxed">
                ResistanceIQ is an academic/translational research tool designed for hypothesis prioritization. Computational predictions must be experimentally validated via standardized bioassays prior to operational decision-making.
              </p>
            </div>

            {/* Production Technology Stack */}
            <div className="p-6 rounded-2xl bg-[#071019] border border-white/[0.06]">
              <span className="text-[11px] font-mono font-bold text-[#8B8CF8] uppercase tracking-wider">ENTERPRISE ARCHITECTURE</span>
              <h2 className="text-lg font-bold text-white mt-1 mb-3.5">Production Technology Stack</h2>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[#03080E] border border-white/[0.05]">
                  <div className="font-bold text-white text-[11.5px] mb-0.5">FastAPI Backend</div>
                  <div className="text-[10px] text-[#7C8A9A]">Python 3.11, Uvicorn, ASGI</div>
                </div>
                <div className="p-3 rounded-xl bg-[#03080E] border border-white/[0.05]">
                  <div className="font-bold text-white text-[11.5px] mb-0.5">React 19 & Vite 6</div>
                  <div className="text-[10px] text-[#7C8A9A]">TailwindCSS, Lucide, Recharts</div>
                </div>
                <div className="p-3 rounded-xl bg-[#03080E] border border-white/[0.05]">
                  <div className="font-bold text-white text-[11.5px] mb-0.5">Cheminformatics Core</div>
                  <div className="text-[10px] text-[#7C8A9A]">RDKit, Scikit-learn, NumPy</div>
                </div>
                <div className="p-3 rounded-xl bg-[#03080E] border border-white/[0.05]">
                  <div className="font-bold text-white text-[11.5px] mb-0.5">Cloud Infrastructure</div>
                  <div className="text-[10px] text-[#7C8A9A]">Render Docker + Vercel Edge</div>
                </div>
                <div className="p-3 rounded-xl bg-[#03080E] border border-white/[0.05]">
                  <div className="font-bold text-white text-[11.5px] mb-0.5">Database Layer</div>
                  <div className="text-[10px] text-[#7C8A9A]">PostgreSQL / SQLAlchemy 2.0</div>
                </div>
                <div className="p-3 rounded-xl bg-[#03080E] border border-white/[0.05]">
                  <div className="font-bold text-white text-[11.5px] mb-0.5">Enterprise Auth</div>
                  <div className="text-[10px] text-[#7C8A9A]">JWT, Bcrypt, RBAC, OTP</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10. Final Call To Action ───────────────────────────────── */}
      <section className="py-16 sm:py-20 border-t border-white/[0.06] bg-[#03080E] text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-[#0BDFA0]/6 blur-[130px] rounded-full pointer-events-none -z-10" />

        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="max-w-[700px] mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0BDFA0]/10 border border-[#0BDFA0]/20 text-[#0BDFA0] text-[10.5px] font-mono font-semibold tracking-wider uppercase">
              <span>ENTER THE RESISTANCEIQ INTELLIGENCE LAYER</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-white tracking-tight leading-tight">
              Enter the ResistanceIQ Intelligence Layer
            </h2>

            <p className="text-[#9AAFC0] text-xs sm:text-[13.5px] leading-relaxed max-w-[540px] mx-auto">
              Transform pesticide resistance research into an evidence-driven computational workflow.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2.5">
              <button
                onClick={handleOpenWorkspace}
                className="inline-flex items-center gap-1.5 h-[42px] px-7 rounded-lg bg-[#0BDFA0] hover:bg-[#09c78e] text-[#02070C] text-[13px] font-bold tracking-wide transition-all shadow-[0_0_18px_rgba(11,223,160,0.25)] cursor-pointer"
              >
                <span>OPEN WORKSPACE →</span>
              </button>

              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 h-[42px] px-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-[13px] font-semibold transition-all"
              >
                <span>Create Researcher Account</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 11. Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#02070C] py-12 text-xs text-[#7C8A9A]">
        <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#0BDFA0] to-[#38BDF8] flex items-center justify-center">
                  <Dna size={13} color="#02070C" strokeWidth={2.6} />
                </div>
                <span className="text-[14.5px] font-bold text-white tracking-tight">
                  Resistance<span className="text-[#0BDFA0]">IQ</span>
                </span>
              </div>
              <p className="text-[#9AAFC0] text-[11px] leading-relaxed max-w-sm">
                AI-Powered Pesticide Resistance Forecasting & Scientific Intelligence Platform for computational hypothesis generation and resistance risk screening.
              </p>
              <div className="text-[10px] text-[#7C8A9A] font-mono">
                Operational Mode: RESEARCH / VALIDATION MODE · Governance: REQUIRES VALIDATION
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-mono font-bold text-white uppercase tracking-wider mb-2.5">Platform</h3>
              <ul className="space-y-1.5 text-[11.5px]">
                <li><Link to="/login" className="hover:text-[#0BDFA0] transition-colors">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-[#0BDFA0] transition-colors">Create Account</Link></li>
                <li><Link to="/forgot-password" className="hover:text-[#0BDFA0] transition-colors">Password Recovery</Link></li>
                <li><a href="https://resistanceiq-api.onrender.com/docs" target="_blank" rel="noopener noreferrer" className="hover:text-[#0BDFA0] transition-colors inline-flex items-center gap-1">FastAPI Docs <ExternalLink size={9} /></a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-mono font-bold text-white uppercase tracking-wider mb-2.5">Scientific References</h3>
              <ul className="space-y-1.5 text-[11.5px]">
                <li><a href="https://irac-online.org" target="_blank" rel="noopener noreferrer" className="hover:text-[#0BDFA0] transition-colors inline-flex items-center gap-1">IRAC Mode of Action <ExternalLink size={9} /></a></li>
                <li><a href="https://www.uniprot.org" target="_blank" rel="noopener noreferrer" className="hover:text-[#0BDFA0] transition-colors inline-flex items-center gap-1">UniProtKB <ExternalLink size={9} /></a></li>
                <li><a href="https://pubchem.ncbi.nlm.nih.gov" target="_blank" rel="noopener noreferrer" className="hover:text-[#0BDFA0] transition-colors inline-flex items-center gap-1">PubChem Compounds <ExternalLink size={9} /></a></li>
                <li><a href="https://www.fao.org" target="_blank" rel="noopener noreferrer" className="hover:text-[#0BDFA0] transition-colors inline-flex items-center gap-1">FAO ICC Classification <ExternalLink size={9} /></a></li>
              </ul>
            </div>
          </div>

          <div className="pt-5 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-[10.5px]">
            <div>
              © {new Date().getFullYear()} ResistanceIQ Platform. Built for scientific reproducibility and non-commercial research screening.
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#0BDFA0] font-mono font-semibold">v2.0.0 Production</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
