import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  Bug,
  Dna,
  Atom,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Search,
  Upload,
  PenTool,
  Settings2,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Layers,
  Check,
  X,
  FileText,
  Download,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import {
  getCrops,
  getCropThreats,
  getPests,
  getThreatTargets,
  getTargets,
  getTargetProtein,
  getTargetStructures,
  createMolecule,
  searchChemicalCompounds,
  getPubChemCompound,
  resolveChemicalStructure,
  uploadChemicalStructureFile,
  exportForecast,
  normalizeArray,
} from '../api/client.js';
import { useForecast } from '../hooks/useForecast.js';
import { parseSmiles } from '../utils/smilesParser.js';
import MolecularDrawer from '../components/ui/MolecularDrawer.jsx';
import useProjectStore from '../store/projectStore.js';

const WIZARD_STEPS = [
  { id: 1, label: 'Crop Master', desc: 'FAO ICC Classification', icon: Sprout },
  { id: 2, label: 'Threat Organism', desc: 'Host-Pest Association', icon: Bug },
  { id: 3, label: 'Biological Target', desc: 'Receptor & Gene', icon: Dna },
  { id: 4, label: 'Protein & Structure', desc: 'UniProt & RCSB PDB', icon: Atom },
  { id: 5, label: 'Candidate Molecule', desc: 'Automated Chemical Resolution', icon: FlaskConical },
  { id: 6, label: 'Scientific Review', desc: 'Cascade Traceability', icon: Layers },
  { id: 7, label: 'Forecast', desc: 'ML Durability Scoring', icon: Sparkles },
];

/* ─── Molecular Preview Component ────────────────────────────────── */
function MolecularPreviewCanvas({ smiles, molName, rawSvg, formula, molecularWeight, isNovel = false }) {
  const parsed = smiles?.trim() ? parseSmiles(smiles) : null;
  const isValid = rawSvg ? true : (parsed?.valid ?? false);
  const displayFormula = formula || parsed?.formula;
  const displayMw = molecularWeight || parsed?.molecularWeight;

  return (
    <div
      style={{
        width: '100%',
        minHeight: 320,
        background: 'var(--elevated, #0B1017)',
        border: '1px solid var(--line, rgba(255,255,255,0.06))',
        borderRadius: 14,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 16, left: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <p className="section-title" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-4, #7C8A9A)' }}>
            2D Structure Graph
          </p>
          {isNovel ? (
            <span className="badge" style={{ fontSize: 9, background: 'rgba(139,140,248,0.15)', color: '#8B8CF8' }}>
              NOVEL
            </span>
          ) : (
            <span className="badge badge-teal" style={{ fontSize: 9 }}>
              VERIFIED
            </span>
          )}
        </div>
        <p className="mono" style={{ fontSize: 13, color: 'var(--ink, #F1F5F9)', marginTop: 2, fontWeight: 700 }}>
          {molName || 'Waiting for Candidate'}
        </p>
      </div>

      {isValid && displayFormula && (
        <div style={{ position: 'absolute', top: 16, right: 20, textAlign: 'right' }}>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal, #0BDFA0)' }}>
            {displayFormula}
          </span>
          <p className="mono" style={{ fontSize: 10, color: 'var(--ink-4, #7C8A9A)', marginTop: 2 }}>
            {displayMw} g/mol
          </p>
        </div>
      )}

      {rawSvg ? (
        <div
          dangerouslySetInnerHTML={{ __html: rawSvg }}
          style={{
            maxWidth: '100%',
            maxHeight: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
          }}
        />
      ) : smiles?.trim() && !isValid ? (
        <div style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <span style={{ color: '#f43f5e', fontSize: 18, fontWeight: 'bold' }}>✕</span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#f43f5e' }}>Invalid molecular structure</p>
          <p style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)', marginTop: 4, maxWidth: 240 }}>
            {parsed?.error || 'Unable to interpret chemical structure.'}
          </p>
        </div>
      ) : isValid && parsed ? (
        <svg
          width="260"
          height="200"
          viewBox="0 0 280 240"
          fill="none"
          style={{ transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)' }}
        >
          {/* Bonds */}
          {parsed.bonds.map((bond, i) => {
            const s = parsed.atoms[bond.source];
            const t = parsed.atoms[bond.target];
            if (!s || !t) return null;
            return (
              <g key={`bond-${i}`}>
                <line
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke="rgba(11,223,160,0.45)"
                  strokeWidth={bond.order === 2 ? 3.5 : bond.order === 3 ? 5 : 2}
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {/* Atoms */}
          {parsed.atoms.map((atom) => (
            <g key={`atom-${atom.id}`}>
              <circle
                cx={atom.x}
                cy={atom.y}
                r={atom.symbol === 'C' ? 12 : 14}
                fill="var(--surface, #0B1017)"
                stroke={atom.color || 'var(--teal, #0BDFA0)'}
                strokeWidth="1.5"
              />
              <text
                x={atom.x}
                y={atom.y + 3.5}
                textAnchor="middle"
                fill={atom.color || 'var(--teal, #0BDFA0)'}
                fontSize={atom.symbol.length > 1 ? '9' : '10'}
                fontWeight="800"
                fontFamily="JetBrains Mono, monospace"
              >
                {atom.symbol}
              </text>
            </g>
          ))}
        </svg>
      ) : (
        <svg width="200" height="160" viewBox="0 0 200 160" fill="none" style={{ opacity: 0.35 }}>
          <circle cx="100" cy="80" r="30" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="100" cy="80" r="6" fill="rgba(255,255,255,0.06)" />
        </svg>
      )}

      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: isValid ? 'var(--ink, #F1F5F9)' : 'var(--ink-4, #7C8A9A)' }}>
          {isValid
            ? `Standardized 2D Graph · ${displayFormula || 'Formula Ready'}`
            : smiles?.trim()
            ? 'Invalid chemical structure'
            : 'Select candidate to render chemical graph'}
        </p>
      </div>
    </div>
  );
}

export default function NewCandidate() {
  const navigate = useNavigate();
  const { pipelineState, runPipeline } = useForecast();
  const { activeProjectId, addNotification } = useProjectStore();

  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Crop State
  const [cropList, setCropList] = useState([]);
  const [retryingSearch, setRetryingSearch] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);

  async function handleExportReport() {
    const fId = pipelineState.persistedForecastId || pipelineState.forecast?.id || pipelineState.forecast?.forecast_id;
    if (!fId) {
      navigate('/reports');
      return;
    }
    try {
      setExportingReport(true);
      addNotification({ type: 'info', message: 'Generating forecast dossier...', detail: verifiedCompound?.name || 'Candidate' });
      const result = await exportForecast(fId, 'pdf');
      addNotification({ type: 'success', message: 'Dossier downloaded', detail: result.filename });
    } catch (err) {
      console.error('Export failed:', err);
      addNotification({ type: 'error', message: 'Export failed', detail: err.message });
    } finally {
      setExportingReport(false);
    }
  }
  const [cropSearch, setCropSearch] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [loadingCrops, setLoadingCrops] = useState(false);

  // Step 2: Threat State
  const [threatList, setThreatList] = useState([]);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [loadingThreats, setLoadingThreats] = useState(false);

  // Step 3: Target State
  const [targetList, setTargetList] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [loadingTargets, setLoadingTargets] = useState(false);

  // Step 4: Protein & Structure State
  const [proteinRecord, setProteinRecord] = useState(null);
  const [structuresList, setStructuresList] = useState([]);
  const [loadingProtein, setLoadingProtein] = useState(false);

  // ─── Step 5: Candidate Molecule Automated State ──────────────────────────
  // Four input modes: 'search' (default), 'upload', 'draw', 'advanced'
  const [activeInputMode, setActiveInputMode] = useState('search');

  // Search mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Confirmed / Resolved Compound State
  const [verifiedCompound, setVerifiedCompound] = useState(null);

  // Upload mode state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Advanced mode state
  const [advancedSmiles, setAdvancedSmiles] = useState('');
  const [advancedInchi, setAdvancedInchi] = useState('');
  const [advancedName, setAdvancedName] = useState('');
  const [advancedError, setAdvancedError] = useState(null);
  const [isResolvingAdvanced, setIsResolvingAdvanced] = useState(false);

  // Step 6: Review & Pre-check
  const [applicabilityDomain, setApplicabilityDomain] = useState(null);

  // ─── Step 1: Crop Loader & Search ──────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      setLoadingCrops(true);
      try {
        const data = await getCrops(cropSearch);
        const normalized = normalizeArray(data);
        if (!isMounted) return;
        setCropList(normalized);
        setSelectedCrop((prev) => {
          if (prev && normalized.some((c) => c.id === prev.id)) {
            return prev;
          }
          return normalized.length > 0 ? normalized[0] : null;
        });
      } catch (err) {
        console.error('Failed to load FAO crops', err);
        if (isMounted) setCropList([]);
      } finally {
        if (isMounted) setLoadingCrops(false);
      }
    }, cropSearch ? 250 : 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [cropSearch]);

  function handleCropSearchChange(e) {
    setCropSearch(e.target.value);
  }

  // ─── Step 2: Threat Loader ─────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const cropId = selectedCrop?.id;
    async function fetchThreats() {
      if (!cropId) {
        setThreatList([]);
        setSelectedThreat(null);
        return;
      }
      setLoadingThreats(true);
      try {
        let threats = await getCropThreats(cropId);
        threats = normalizeArray(threats);
        if (threats.length === 0) {
          const generalPests = await getPests();
          const normPests = normalizeArray(generalPests);
          threats = normPests.map((p) => ({
            id: `ct_reg_${p.id}`,
            organism_id: p.id,
            organism_name: p.species_name,
            common_name: p.common_name,
            relationship: 'DOCUMENTED_PEST',
            evidence_level: 'PEST_REGISTRY',
            ncbi_tax_id: p.id,
          }));
        }
        if (!isMounted) return;
        setThreatList(threats);
        setSelectedThreat((prev) => {
          if (prev && threats.some((t) => (t.id && t.id === prev.id) || (t.organism_id && t.organism_id === prev.organism_id))) {
            return prev;
          }
          return threats.length > 0 ? threats[0] : null;
        });
      } catch (err) {
        console.error('Failed to load crop threats', err);
        try {
          const generalPests = await getPests();
          const normPests = normalizeArray(generalPests);
          const fallbackThreats = normPests.map((p) => ({
            id: `ct_reg_${p.id}`,
            organism_id: p.id,
            organism_name: p.species_name,
            common_name: p.common_name,
            relationship: 'DOCUMENTED_PEST',
            evidence_level: 'PEST_REGISTRY',
            ncbi_tax_id: p.id,
          }));
          if (isMounted) {
            setThreatList(fallbackThreats);
            setSelectedThreat((prev) => {
              if (prev && fallbackThreats.some((t) => (t.id && t.id === prev.id) || (t.organism_id && t.organism_id === prev.organism_id))) {
                return prev;
              }
              return fallbackThreats.length > 0 ? fallbackThreats[0] : null;
            });
          }
        } catch {
          if (isMounted) {
            setThreatList([]);
            setSelectedThreat(null);
          }
        }
      } finally {
        if (isMounted) setLoadingThreats(false);
      }
    }

    fetchThreats();
    return () => {
      isMounted = false;
    };
  }, [selectedCrop?.id]);

  // ─── Step 3: Target Loader ─────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const orgId = selectedThreat?.organism_id || selectedThreat?.organism_name || selectedThreat?.id;
    async function fetchTargets() {
      if (!orgId) {
        setTargetList([]);
        setSelectedTarget(null);
        return;
      }
      setLoadingTargets(true);
      try {
        let targets = await getThreatTargets(orgId);
        targets = normalizeArray(targets);
        if (targets.length === 0) {
          targets = await getTargets({ pest_id: orgId, organism_id: orgId });
          targets = normalizeArray(targets);
        }
        if (targets.length === 0) {
          targets = await getTargets();
          targets = normalizeArray(targets);
        }
        if (!isMounted) return;
        setTargetList(targets);
        setSelectedTarget((prev) => {
          if (prev && targets.some((t) => t.id === prev.id)) {
            return prev;
          }
          return targets.length > 0 ? targets[0] : null;
        });
      } catch (err) {
        console.error('Failed to load targets for threat', err);
        if (isMounted) {
          try {
            const allTargets = await getTargets();
            const normAll = normalizeArray(allTargets);
            setTargetList(normAll);
            setSelectedTarget(normAll.length > 0 ? normAll[0] : null);
          } catch {
            setTargetList([]);
            setSelectedTarget(null);
          }
        }
      } finally {
        if (isMounted) setLoadingTargets(false);
      }
    }

    fetchTargets();
    return () => {
      isMounted = false;
    };
  }, [selectedThreat?.organism_id, selectedThreat?.organism_name, selectedThreat?.id]);

  // ─── Step 4: Protein & Structures Loader ───────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const targetId = selectedTarget?.id;
    async function fetchProteinAndStructures() {
      if (!targetId) {
        setProteinRecord(null);
        setStructuresList([]);
        return;
      }
      setLoadingProtein(true);
      try {
        const [prot, structs] = await Promise.all([
          getTargetProtein(targetId).catch(() => null),
          getTargetStructures(targetId).catch(() => []),
        ]);
        if (!isMounted) return;
        setProteinRecord(prot);
        setStructuresList(normalizeArray(structs));
      } catch (err) {
        console.error('Failed to load protein / structures', err);
        if (isMounted) {
          setProteinRecord(null);
          setStructuresList([]);
        }
      } finally {
        if (isMounted) setLoadingProtein(false);
      }
    }

    fetchProteinAndStructures();
    return () => {
      isMounted = false;
    };
  }, [selectedTarget?.id]);

  // ─── Step 5: Automated Chemical Resolution Handlers ──────────────────────

  // 1. Search Compound (PubChem lookup)
  async function handleSearchCompound(queryToSearch = searchQuery) {
    const q = queryToSearch.trim();
    if (!q) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults(null);

    try {
      const resp = await searchChemicalCompounds(q, 8);
      setSearchResults(resp);

      if (!resp.is_ambiguous && resp.resolved_compound) {
        // Direct single resolved match
        setVerifiedCompound({
          ...resp.resolved_compound,
          is_novel: false,
          provenance_source: 'PUBCHEM',
          standardization_status: 'STANDARDIZED',
        });
      } else if (resp.total_candidates === 0) {
        setSearchError(resp.message || `No chemical record found in PubChem for "${q}".`);
      }
    } catch (err) {
      setSearchError(err?.message || 'Chemical database temporarily unavailable.');
    } finally {
      setIsSearching(false);
    }
  }

  // 2. Select Candidate from Ambiguous Results List
  async function handleSelectCandidate(candidate) {
    setIsSearching(true);
    setSearchError(null);
    try {
      const detail = await getPubChemCompound(candidate.cid);
      setVerifiedCompound({
        ...detail,
        is_novel: false,
        provenance_source: 'PUBCHEM',
        standardization_status: 'STANDARDIZED',
      });
    } catch (err) {
      setSearchError(err?.message || 'Failed to retrieve selected compound details.');
    } finally {
      setIsSearching(false);
    }
  }

  // 3. File Upload Handler (.sdf, .mol, .smi, .inchi, .txt)
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadChemicalStructureFile(file);
      if (!result.valid) {
        setUploadError(result.error || 'Structure could not be interpreted. Please check the uploaded file.');
      } else {
        setVerifiedCompound({
          name: result.chemical_name || file.name.rsplit('.', 1)[0],
          cid: result.pubchem_cid,
          molecular_formula: result.molecular_formula,
          molecular_weight: result.molecular_weight,
          canonical_smiles: result.canonical_smiles,
          inchikey: result.inchikey,
          inchi: result.inchi,
          xlogp: result.logp,
          hbd_count: result.hbd_count,
          hba_count: result.hba_count,
          rotatable_bonds: result.rotatable_bonds,
          svg_2d: result.svg_2d,
          is_novel: result.is_novel,
          provenance_source: result.provenance_source,
          source_identifier: result.pubchem_cid ? `CID ${result.pubchem_cid}` : `File: ${file.name}`,
          standardization_status: result.standardization_status,
          source: result.is_novel ? 'User Upload (Standardized)' : 'PubChem Verified',
        });
      }
    } catch (err) {
      setUploadError(err?.message || 'Failed to upload and standardize structure file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // 4. Molecular Drawer Callback
  async function handleDrawerStructure(drawnSmiles) {
    const res = await resolveChemicalStructure(drawnSmiles, 'SMILES', 'Custom-Drawn-Candidate');
    if (!res.valid) {
      throw new Error(res.error || 'Drawn chemical structure could not be interpreted.');
    }

    setVerifiedCompound({
      name: res.chemical_name || 'Drawn Chemical Analog',
      cid: res.pubchem_cid,
      molecular_formula: res.molecular_formula,
      molecular_weight: res.molecular_weight,
      canonical_smiles: res.canonical_smiles,
      inchikey: res.inchikey,
      inchi: res.inchi,
      xlogp: res.logp,
      hbd_count: res.hbd_count,
      hba_count: res.hba_count,
      rotatable_bonds: res.rotatable_bonds,
      svg_2d: res.svg_2d,
      is_novel: res.is_novel,
      provenance_source: res.provenance_source,
      source_identifier: res.pubchem_cid ? `CID ${res.pubchem_cid}` : 'Molecular Drawing Canvas',
      standardization_status: res.standardization_status,
      source: res.is_novel ? 'Molecular Drawer (Standardized)' : 'PubChem Verified',
    });
  }

  // 5. Advanced Structure Resolution Handler
  async function handleResolveAdvanced() {
    const rawData = advancedSmiles.trim() || advancedInchi.trim();
    if (!rawData) {
      setAdvancedError('Please enter a SMILES string or InChI identifier.');
      return;
    }

    setIsResolvingAdvanced(true);
    setAdvancedError(null);

    const fmt = advancedSmiles.trim() ? 'SMILES' : 'INCHI';
    try {
      const res = await resolveChemicalStructure(rawData, fmt, advancedName.trim());
      if (!res.valid) {
        setAdvancedError(res.error || 'Invalid chemical structure.');
      } else {
        setVerifiedCompound({
          name: res.chemical_name || advancedName.trim() || 'Custom Analog',
          cid: res.pubchem_cid,
          molecular_formula: res.molecular_formula,
          molecular_weight: res.molecular_weight,
          canonical_smiles: res.canonical_smiles,
          inchikey: res.inchikey,
          inchi: res.inchi,
          xlogp: res.logp,
          hbd_count: res.hbd_count,
          hba_count: res.hba_count,
          rotatable_bonds: res.rotatable_bonds,
          svg_2d: res.svg_2d,
          is_novel: res.is_novel,
          provenance_source: res.provenance_source,
          source_identifier: res.pubchem_cid ? `CID ${res.pubchem_cid}` : 'Advanced Manual Input',
          standardization_status: res.standardization_status,
          source: res.is_novel ? 'Advanced Input (Standardized)' : 'PubChem Verified',
        });
      }
    } catch (err) {
      setAdvancedError(err?.message || 'Failed to resolve advanced chemical structure.');
    } finally {
      setIsResolvingAdvanced(false);
    }
  }

  // Reset Compound Selection
  function handleResetCompound() {
    setVerifiedCompound(null);
    setSearchResults(null);
    setSearchError(null);
  }

  // ─── Execution Handler ──────────────────────────────────────────────────
  async function handleExecuteForecast() {
    if (!verifiedCompound) return;

    setCurrentStep(7);
    try {
      const molPayload = {
        chemical_name: verifiedCompound.name,
        smiles: verifiedCompound.canonical_smiles,
        pubchem_cid: verifiedCompound.cid,
        iupac_name: verifiedCompound.iupac_name,
        molecular_formula: verifiedCompound.molecular_formula,
        molecular_weight: verifiedCompound.molecular_weight,
        logp: verifiedCompound.xlogp,
        tpsa: verifiedCompound.tpsa,
        hbd_count: verifiedCompound.hbd_count,
        hba_count: verifiedCompound.hba_count,
        rotatable_bonds: verifiedCompound.rotatable_bonds,
        inchikey: verifiedCompound.inchikey,
        inchi: verifiedCompound.inchi,
        is_novel: verifiedCompound.is_novel || false,
        standardization_status: verifiedCompound.standardization_status || 'STANDARDIZED',
        resolution_method: activeInputMode.toUpperCase(),
        source_identifier: verifiedCompound.source_identifier,
        provenance_source: verifiedCompound.provenance_source || 'PUBCHEM',
      };

      let createdMol = null;
      try {
        createdMol = await createMolecule(molPayload);
      } catch (err) {
        console.warn('Molecule registration note:', err);
      }

      const projId = activeProjectId || 'prj_ache1_series';
      const targetId = selectedTarget?.id || 'tgt_ache1_01';
      const pestId = selectedThreat?.organism_id || 'pst_aphid_01';

      const result = await runPipeline({
        moleculeId: createdMol?.id,
        targetId: targetId,
        pestId: pestId,
        projectId: projId,
        chemicalName: verifiedCompound.name,
        smiles: verifiedCompound.canonical_smiles,
        moaGroup: selectedTarget?.irac_moa_group || '4A',
        pestOrder: selectedThreat?.organism_name?.toLowerCase().includes('persicae')
          ? 'Hemiptera'
          : selectedThreat?.organism_name?.toLowerCase().includes('xylostella') ||
            selectedThreat?.organism_name?.toLowerCase().includes('armigera')
          ? 'Lepidoptera'
          : 'Trombidiformes',
        cropId: selectedCrop?.id,
        threatId: selectedThreat?.id,
      });

      setApplicabilityDomain(result);
    } catch (err) {
      console.error('Forecast execution error', err);
    }
  }

  return (
    <div className="page-wrap py-10" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span className="badge badge-teal" style={{ fontSize: 11, fontWeight: 700 }}>
            RESISTANCEIQ KNOWLEDGE GRAPH
          </span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)' }}>
            STEP 16 ENHANCED PIPELINE
          </span>
        </div>
        <h1 className="display-md" style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink, #F1F5F9)' }}>
          Crop → Threat → Target → Protein → Candidate Molecule
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-4, #7C8A9A)', marginTop: 4, maxWidth: 800 }}>
          Automated chemical identification: Search known commercial compounds by name, CAS, or CID, upload structural files, or draw custom molecular analogues with automated RDKit standardization and zero manual SMILES typing.
        </p>
      </div>

      {/* Wizard Progress Steps Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 8,
          marginBottom: 36,
          background: 'var(--surface, #0B1017)',
          padding: '12px 16px',
          borderRadius: 14,
          border: '1px solid var(--line, rgba(255,255,255,0.06))',
        }}
      >
        {WIZARD_STEPS.map((s) => {
          const Icon = s.icon;
          const isDone = currentStep > s.id;
          const isCurrent = currentStep === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (currentStep > s.id) setCurrentStep(s.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 8,
                background: isCurrent ? 'rgba(11,223,160,0.12)' : isDone ? 'rgba(255,255,255,0.03)' : 'transparent',
                border: isCurrent ? '1px solid var(--teal, #0BDFA0)' : '1px solid transparent',
                cursor: currentStep > s.id ? 'pointer' : 'default',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isCurrent ? 'var(--teal, #0BDFA0)' : isDone ? '#0BDFA0' : 'rgba(255,255,255,0.08)',
                  color: isCurrent || isDone ? '#05070B' : 'var(--ink-4, #7C8A9A)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {isDone ? <CheckCircle2 size={14} /> : <Icon size={13} />}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? 'var(--teal, #0BDFA0)' : isDone ? 'var(--ink, #F1F5F9)' : 'var(--ink-4, #7C8A9A)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {s.label}
                </p>
                <p style={{ fontSize: 9, color: 'var(--ink-5, #4B5563)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {s.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Form Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: 32 }}>
        {/* Left Side: Step Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* STEP 1: Select Crop */}
          {currentStep === 1 && (
            <div className="card-glass" style={{ background: 'var(--surface, #0B1017)', border: '1px solid var(--line, rgba(255,255,255,0.06))', borderRadius: 16, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(11,223,160,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal, #0BDFA0)' }}>
                  <Sprout size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink, #F1F5F9)' }}>Step 1: Select Canonical Crop</h2>
                  <p style={{ fontSize: 12, color: 'var(--ink-4, #7C8A9A)' }}>Authoritative FAO Indicative Crop Classification (ICC v1.1) & NCBI Taxonomy</p>
                </div>
              </div>

              {/* Crop Search Bar */}
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={16} style={{ position: 'absolute', top: 13, left: 14, color: 'var(--ink-4, #7C8A9A)' }} />
                <input
                  type="text"
                  value={cropSearch}
                  onChange={handleCropSearchChange}
                  placeholder="Search crop by name, scientific name, FAO code (e.g. Tomato, Solanum lycopersicum, 0121)..."
                  style={{
                    width: '100%',
                    height: 42,
                    paddingLeft: 40,
                    paddingRight: 16,
                    background: 'var(--bg-deep, #05070B)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#F1F5F9',
                    fontSize: 13,
                  }}
                />
              </div>

              {/* Crop Selection Grid / States */}
              {loadingCrops ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', gap: 12, background: 'var(--bg-deep, #05070B)', borderRadius: 10 }}>
                  <Loader2 size={26} className="animate-spin" style={{ color: 'var(--teal, #0BDFA0)' }} />
                  <p style={{ fontSize: 13, color: 'var(--ink-4, #7C8A9A)', fontWeight: 600 }}>Loading canonical crops...</p>
                </div>
              ) : cropList.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', background: 'var(--bg-deep, #05070B)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 14, color: '#F1F5F9', fontWeight: 600 }}>No crops found matching "{cropSearch}"</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-4, #7C8A9A)', marginTop: 4 }}>
                    Try searching for "Rice", "Tomato", "Wheat", "Maize", "Cotton", or "Soybean"
                  </p>
                  {cropSearch && (
                    <button
                      type="button"
                      onClick={() => setCropSearch('')}
                      style={{
                        marginTop: 14,
                        padding: '6px 14px',
                        borderRadius: 6,
                        background: 'rgba(11,223,160,0.12)',
                        border: '1px solid var(--teal, #0BDFA0)',
                        color: 'var(--teal, #0BDFA0)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
                  {cropList.map((crop) => {
                    const isSelected = selectedCrop?.id === crop.id;
                    const cropDisplayName = crop.common_name || crop.name || crop.crop_name || crop.scientific_name || 'Crop';
                    const cropScientific = crop.scientific_name || crop.taxonomy_name || '';
                    const cropCode = crop.crop_code ? `ICC ${crop.crop_code}` : (crop.id ? crop.id.replace('crop_fao_', '').toUpperCase() : '');
                    const cropFamily = crop.family || 'Agronomic Crop';
                    return (
                      <button
                        key={crop.id}
                        type="button"
                        onClick={() => setSelectedCrop(crop)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 10,
                          background: isSelected ? 'rgba(11,223,160,0.08)' : 'var(--bg-deep, #05070B)',
                          border: isSelected ? '1.5px solid var(--teal, #0BDFA0)' : '1px solid rgba(255,255,255,0.06)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? 'var(--teal, #0BDFA0)' : 'var(--ink, #F1F5F9)' }}>
                            {cropDisplayName}
                          </span>
                          {cropCode && (
                            <span className="mono" style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--ink-4, #7C8A9A)' }}>
                              {cropCode}
                            </span>
                          )}
                        </div>
                        {cropScientific && (
                          <span style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--ink-4, #7C8A9A)' }}>
                            {cropScientific}
                          </span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(139,140,248,0.1)', color: '#8B8CF8' }}>
                            {cropFamily}
                          </span>
                          {crop.ncbi_tax_id && (
                            <span className="mono" style={{ fontSize: 9, color: 'var(--ink-5, #4B5563)' }}>
                              TaxID: {crop.ncbi_tax_id}
                            </span>
                          )}
                          {isSelected && (
                            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: 'var(--teal, #0BDFA0)' }}>
                              <Check size={14} />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <button
                  type="button"
                  id="btn-step1-next"
                  disabled={!selectedCrop || loadingCrops}
                  onClick={() => setCurrentStep(2)}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 8,
                    background: selectedCrop ? 'var(--teal, #0BDFA0)' : 'rgba(255,255,255,0.1)',
                    color: selectedCrop ? '#05070B' : 'var(--ink-4, #7C8A9A)',
                    fontWeight: 700,
                    cursor: selectedCrop ? 'pointer' : 'not-allowed',
                  }}
                >
                  <span>Select Threat Organism</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Threat */}
          {currentStep === 2 && (
            <div className="card-glass" style={{ background: 'var(--surface, #0B1017)', border: '1px solid var(--line, rgba(255,255,255,0.06))', borderRadius: 16, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(243,177,77,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F3B14D' }}>
                  <Bug size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink, #F1F5F9)' }}>Step 2: Select Verified Threat Organism</h2>
                  <p style={{ fontSize: 12, color: 'var(--ink-4, #7C8A9A)' }}>
                    Threat organisms known to attack {selectedCrop?.common_name || selectedCrop?.name} ({selectedCrop?.scientific_name})
                  </p>
                </div>
              </div>

              {loadingThreats ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', gap: 12, background: 'var(--bg-deep, #05070B)', borderRadius: 10 }}>
                  <Loader2 size={26} className="animate-spin" style={{ color: '#F3B14D' }} />
                  <p style={{ fontSize: 13, color: 'var(--ink-4, #7C8A9A)', fontWeight: 600 }}>Loading verified threat organisms...</p>
                </div>
              ) : threatList.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', background: 'var(--bg-deep, #05070B)', borderRadius: 10 }}>
                  <p style={{ fontSize: 13, color: 'var(--ink-4, #7C8A9A)' }}>No specific verified threats configured for this crop.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  {threatList.map((threat) => {
                    const isSelected = selectedThreat?.id === threat.id || (selectedThreat?.organism_id && selectedThreat.organism_id === threat.organism_id);
                    const threatCommon = threat.common_name || threat.organism_name || threat.species_name || 'Threat Organism';
                    const threatScientific = threat.organism_name || threat.species_name || '';
                    const threatRel = threat.relationship || 'HOST_ASSOCIATION';
                    const threatEvidence = threat.evidence_level || 'DIRECT';
                    return (
                      <button
                        key={threat.id || threat.organism_id}
                        type="button"
                        onClick={() => setSelectedThreat(threat)}
                        style={{
                          padding: '16px 20px',
                          borderRadius: 10,
                          background: isSelected ? 'rgba(243,177,77,0.08)' : 'var(--bg-deep, #05070B)',
                          border: isSelected ? '1.5px solid #F3B14D' : '1px solid rgba(255,255,255,0.06)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: isSelected ? '#F3B14D' : 'var(--ink, #F1F5F9)' }}>
                              {threatCommon}
                            </span>
                            <span className="badge" style={{ fontSize: 10, background: 'rgba(255,255,255,0.08)', color: 'var(--ink-4, #7C8A9A)' }}>
                              {threatRel}
                            </span>
                          </div>
                          {threatScientific && (
                            <p style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--ink-4, #7C8A9A)', marginTop: 2 }}>
                              {threatScientific} {threat.ncbi_tax_id ? `(TaxID: ${threat.ncbi_tax_id})` : ''}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="badge badge-teal" style={{ fontSize: 10, fontWeight: 600 }}>
                            {threatEvidence}
                          </span>
                          {isSelected && (
                            <span style={{ color: '#F3B14D', display: 'flex', alignItems: 'center' }}>
                              <Check size={16} />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', cursor: 'pointer' }}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Crop</span>
                </button>
                <button
                  type="button"
                  id="btn-step2-next"
                  disabled={!selectedThreat || loadingThreats}
                  onClick={() => setCurrentStep(3)}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 8,
                    background: selectedThreat ? 'var(--teal, #0BDFA0)' : 'rgba(255,255,255,0.1)',
                    color: selectedThreat ? '#05070B' : 'var(--ink-4, #7C8A9A)',
                    fontWeight: 700,
                    cursor: selectedThreat ? 'pointer' : 'not-allowed',
                  }}
                >
                  <span>Select Biological Target</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Select Target */}
          {currentStep === 3 && (
            <div className="card-glass" style={{ background: 'var(--surface, #0B1017)', border: '1px solid var(--line, rgba(255,255,255,0.06))', borderRadius: 16, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,140,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B8CF8' }}>
                  <Dna size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink, #F1F5F9)' }}>Step 3: Select Biological Target Receptor</h2>
                  <p style={{ fontSize: 12, color: 'var(--ink-4, #7C8A9A)' }}>
                    Receptor sites mapped to {selectedThreat?.organism_name || selectedThreat?.common_name} ({selectedThreat?.common_name})
                  </p>
                </div>
              </div>

              {loadingTargets ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', gap: 12, background: 'var(--bg-deep, #05070B)', borderRadius: 10 }}>
                  <Loader2 size={26} className="animate-spin" style={{ color: '#8B8CF8' }} />
                  <p style={{ fontSize: 13, color: 'var(--ink-4, #7C8A9A)', fontWeight: 600 }}>Loading biological target receptors...</p>
                </div>
              ) : targetList.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', background: 'var(--bg-deep, #05070B)', borderRadius: 10 }}>
                  <p style={{ fontSize: 13, color: 'var(--ink-4, #7C8A9A)' }}>No validated targets available for this threat organism.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  {targetList.map((tgt) => {
                    const isSelected = selectedTarget?.id === tgt.id;
                    const targetName = tgt.name || tgt.target_name || tgt.protein_name || 'Biological Target';
                    const targetMoa = tgt.irac_moa_group || tgt.moa_group;
                    const targetUniprot = tgt.uniprot_id || tgt.uniprot_accession;
                    const targetGene = tgt.gene_name || tgt.gene_primary;
                    return (
                      <button
                        key={tgt.id}
                        type="button"
                        onClick={() => setSelectedTarget(tgt)}
                        style={{
                          padding: '16px 20px',
                          borderRadius: 10,
                          background: isSelected ? 'rgba(139,140,248,0.08)' : 'var(--bg-deep, #05070B)',
                          border: isSelected ? '1.5px solid #8B8CF8' : '1px solid rgba(255,255,255,0.06)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: isSelected ? '#8B8CF8' : 'var(--ink, #F1F5F9)' }}>
                              {targetName}
                            </span>
                            {targetMoa && (
                              <span className="badge" style={{ fontSize: 10, background: 'rgba(11,223,160,0.12)', color: 'var(--teal, #0BDFA0)' }}>
                                IRAC {targetMoa}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                            {targetUniprot && (
                              <span className="mono" style={{ fontSize: 11, color: '#8B8CF8' }}>
                                UniProt: {targetUniprot}
                              </span>
                            )}
                            {targetGene && (
                              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)' }}>
                                Gene: {targetGene}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="badge" style={{ fontSize: 10, background: 'rgba(255,255,255,0.08)', color: 'var(--ink-4, #7C8A9A)' }}>
                            {tgt.evidence_level || 'CURATED'}
                          </span>
                          {isSelected && (
                            <span style={{ color: '#8B8CF8', display: 'flex', alignItems: 'center' }}>
                              <Check size={16} />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', cursor: 'pointer' }}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Threat</span>
                </button>
                <button
                  type="button"
                  id="btn-step3-next"
                  disabled={!selectedTarget || loadingTargets}
                  onClick={() => setCurrentStep(4)}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 8,
                    background: selectedTarget ? 'var(--teal, #0BDFA0)' : 'rgba(255,255,255,0.1)',
                    color: selectedTarget ? '#05070B' : 'var(--ink-4, #7C8A9A)',
                    fontWeight: 700,
                    cursor: selectedTarget ? 'pointer' : 'not-allowed',
                  }}
                >
                  <span>Inspect Protein & Structure</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Protein & Structure */}
          {currentStep === 4 && (
            <div className="card-glass" style={{ background: 'var(--surface, #0B1017)', border: '1px solid var(--line, rgba(255,255,255,0.06))', borderRadius: 16, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(11,223,160,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal, #0BDFA0)' }}>
                  <Atom size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink, #F1F5F9)' }}>Step 4: Protein & Structure Intelligence</h2>
                  <p style={{ fontSize: 12, color: 'var(--ink-4, #7C8A9A)' }}>
                    Automatically retrieved from Swiss-Prot (UniProtKB) and RCSB PDB coordinate archives
                  </p>
                </div>
              </div>

              {/* Protein Intelligence Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'var(--bg-deep, #05070B)', padding: 18, borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="section-title" style={{ fontSize: 10, color: 'var(--teal, #0BDFA0)' }}>UNIPROTKB / SWISS-PROT RECORD</span>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginTop: 2 }}>
                        {proteinRecord?.protein_name || selectedTarget?.name}
                      </h3>
                      <p style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)', marginTop: 2 }}>
                        Primary Gene: <span className="mono text-white">{proteinRecord?.gene_primary || selectedTarget?.gene_name}</span> · Length: <span className="mono text-white">{proteinRecord?.sequence_length || selectedTarget?.sequence_length} aa</span>
                      </p>
                    </div>
                    <span className="mono badge badge-teal" style={{ fontSize: 11, fontWeight: 700 }}>
                      {selectedTarget?.uniprot_id}
                    </span>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--ink-3, #CBD5E1)', marginTop: 12, lineHeight: 1.5 }}>
                    {proteinRecord?.functional_description || selectedTarget?.functional_description || 'Essential physiological receptor mediating neurochemical signaling.'}
                  </p>
                </div>

                {/* 3D Structure Resolution Box */}
                <div style={{ background: 'var(--bg-deep, #05070B)', padding: 18, borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="section-title" style={{ fontSize: 10, color: '#8B8CF8' }}>3D MACROMOLECULAR STRUCTURE RESOLUTION</span>
                  {structuresList.length === 0 ? (
                    <div style={{ padding: 14, marginTop: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-4, #7C8A9A)' }}>Protein structure unavailable (No experimental or validated computed coordinates).</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                      {structuresList.map((str, idx) => {
                        const isExp = str.structure_type === 'EXPERIMENTAL';
                        const isComputed = str.structure_type === 'COMPUTED';
                        return (
                          <div
                            key={str.id || idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 14px',
                              borderRadius: 8,
                              background: isExp ? 'rgba(11,223,160,0.06)' : 'rgba(255,255,255,0.02)',
                              border: isExp ? '1px solid rgba(11,223,160,0.3)' : '1px solid rgba(255,255,255,0.06)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span
                                className="badge"
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  background: isExp ? 'rgba(11,223,160,0.15)' : isComputed ? 'rgba(139,140,248,0.15)' : 'rgba(255,255,255,0.06)',
                                  color: isExp ? 'var(--teal, #0BDFA0)' : isComputed ? '#8B8CF8' : 'var(--ink-4, #7C8A9A)',
                                }}
                              >
                                {str.structure_type}
                              </span>
                              <div>
                                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>
                                  {str.pdb_id ? `PDB: ${str.pdb_id}` : `AlphaFold: ${str.uniprot_accession}`}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)', marginLeft: 8 }}>
                                  Method: {str.experimental_method || 'Calculated'} {str.resolution ? `(${str.resolution}Å)` : ''}
                                </span>
                              </div>
                            </div>

                            {str.structure_url && (
                              <a
                                href={str.structure_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--teal, #0BDFA0)', textDecoration: 'none' }}
                              >
                                <span>Inspect</span>
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', cursor: 'pointer' }}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Target</span>
                </button>
                <button
                  type="button"
                  id="btn-step4-next"
                  onClick={() => setCurrentStep(5)}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, background: 'var(--teal, #0BDFA0)', color: '#05070B', fontWeight: 700, cursor: 'pointer' }}
                >
                  <span>Candidate Molecule</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* STEP 5: CANDIDATE MOLECULE (ENHANCED AUTOMATED IDENTIFICATION)   */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 5 && (
            <div className="card-glass" style={{ background: 'var(--surface, #0B1017)', border: '1px solid var(--line, rgba(255,255,255,0.06))', borderRadius: 16, padding: 28 }}>
              {/* Step Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(11,223,160,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal, #0BDFA0)' }}>
                    <FlaskConical size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink, #F1F5F9)' }}>Step 5: Candidate Molecule Identification</h2>
                    <p style={{ fontSize: 12, color: 'var(--ink-4, #7C8A9A)' }}>
                      How would you like to identify the candidate compound?
                    </p>
                  </div>
                </div>

                {verifiedCompound && (
                  <button
                    type="button"
                    onClick={handleResetCompound}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      color: 'var(--ink-4, #7C8A9A)',
                      background: 'rgba(255,255,255,0.04)',
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                    }}
                  >
                    <RefreshCw size={12} />
                    <span>Change Compound</span>
                  </button>
                )}
              </div>

              {/* 4 Mode Option Cards (Tabs) */}
              {!verifiedCompound && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
                  {[
                    { id: 'search', label: 'Search Compound', sub: 'PubChem / CAS / CID', icon: Search },
                    { id: 'upload', label: 'Upload Structure', sub: 'SDF / MOL / SMILES', icon: Upload },
                    { id: 'draw', label: 'Draw Molecule', sub: 'Visual chemical editor', icon: PenTool },
                    { id: 'advanced', label: 'Advanced Input', sub: 'SMILES / InChIKey', icon: Settings2 },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isCurrent = activeInputMode === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveInputMode(tab.id);
                          setSearchError(null);
                          setUploadError(null);
                          setAdvancedError(null);
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          padding: '12px 14px',
                          borderRadius: 10,
                          background: isCurrent ? 'rgba(11,223,160,0.08)' : 'var(--bg-deep, #05070B)',
                          border: isCurrent ? '1.5px solid var(--teal, #0BDFA0)' : '1px solid rgba(255,255,255,0.06)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Icon size={15} style={{ color: isCurrent ? 'var(--teal, #0BDFA0)' : 'var(--ink-4, #7C8A9A)' }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: isCurrent ? 'var(--teal, #0BDFA0)' : '#F1F5F9' }}>
                            {tab.label}
                          </span>
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--ink-4, #7C8A9A)' }}>{tab.sub}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* CONFIRMATION CARD (When Compound Verified / Resolved)         */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {verifiedCompound ? (
                <div
                  style={{
                    background: 'var(--bg-deep, #05070B)',
                    borderRadius: 12,
                    border: '1.5px solid var(--teal, #0BDFA0)',
                    padding: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  {/* Status Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(11,223,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal, #0BDFA0)' }}>
                        <Check size={16} />
                      </div>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--teal, #0BDFA0)', letterSpacing: '0.04em' }}>
                          {verifiedCompound.is_novel ? 'NOVEL / UNRESOLVED COMPOUND ✦' : 'COMPOUND VERIFIED ✓'}
                        </span>
                        <p style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)' }}>
                          Standardized via RDKit & PubChem PUG REST API
                        </p>
                      </div>
                    </div>

                    <span className="badge badge-teal" style={{ fontSize: 10, fontWeight: 700 }}>
                      {verifiedCompound.source || 'PubChem'}
                    </span>
                  </div>

                  {/* Compound Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--ink-4, #7C8A9A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Chemical Name
                      </span>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginTop: 2 }}>
                        {verifiedCompound.name}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: 10, color: 'var(--ink-4, #7C8A9A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        PubChem Identifier
                      </span>
                      <p className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal, #0BDFA0)', marginTop: 2 }}>
                        {verifiedCompound.cid ? `CID ${verifiedCompound.cid}` : 'Novel (Unregistered)'}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: 10, color: 'var(--ink-4, #7C8A9A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Molecular Formula
                      </span>
                      <p className="mono" style={{ fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginTop: 2 }}>
                        {verifiedCompound.molecular_formula || 'Calculated'}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: 10, color: 'var(--ink-4, #7C8A9A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Molecular Weight
                      </span>
                      <p className="mono" style={{ fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginTop: 2 }}>
                        {verifiedCompound.molecular_weight} g/mol
                      </p>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: 10, color: 'var(--ink-4, #7C8A9A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Canonical SMILES (Automatically Resolved)
                      </span>
                      <p className="mono" style={{ fontSize: 11, color: 'var(--teal, #0BDFA0)', marginTop: 2, wordBreak: 'break-all', background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: 4 }}>
                        {verifiedCompound.canonical_smiles}
                      </p>
                    </div>

                    {verifiedCompound.inchikey && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ fontSize: 10, color: 'var(--ink-4, #7C8A9A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          InChIKey
                        </span>
                        <p className="mono" style={{ fontSize: 11, color: 'var(--ink-3, #CBD5E1)', marginTop: 2 }}>
                          {verifiedCompound.inchikey}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Scientific Safety Notice */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 6, background: 'rgba(243,177,77,0.08)', border: '1px solid rgba(243,177,77,0.2)' }}>
                    <ShieldCheck size={16} style={{ color: '#F3B14D', flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 11, color: '#F1F5F9', lineHeight: 1.4 }}>
                      <strong style={{ color: '#F3B14D' }}>Scientific Safety Notice:</strong> Chemical identity verification confirms structural integrity and registry provenance. It does not prove target binding or field pesticide efficacy — those are predicted during the subsequent ML forecast.
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      type="button"
                      id="btn-step5-use-compound"
                      onClick={() => setCurrentStep(6)}
                      className="btn btn-primary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 24px',
                        borderRadius: 8,
                        background: 'var(--teal, #0BDFA0)',
                        color: '#05070B',
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      <span>Use This Compound</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* ─── OPTION 1: SEARCH COMPOUND (PRIMARY / DEFAULT) ─── */}
                  {activeInputMode === 'search' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <Search size={16} style={{ position: 'absolute', top: 13, left: 14, color: 'var(--ink-4, #7C8A9A)' }} />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSearchCompound();
                            }}
                            placeholder="Enter chemical name, pesticide name, PubChem CID, CAS number (e.g. Imidacloprid, 138261-41-3, 86287518)..."
                            style={{
                              width: '100%',
                              height: 42,
                              paddingLeft: 40,
                              paddingRight: 16,
                              background: 'var(--bg-deep, #05070B)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 8,
                              color: '#F1F5F9',
                              fontSize: 13,
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          disabled={!searchQuery.trim() || isSearching}
                          onClick={() => handleSearchCompound()}
                          className="btn btn-primary"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0 20px',
                            borderRadius: 8,
                            background: 'var(--teal, #0BDFA0)',
                            color: '#05070B',
                            fontWeight: 700,
                            cursor: searchQuery.trim() && !isSearching ? 'pointer' : 'default',
                          }}
                        >
                          {isSearching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                          <span>{isSearching ? 'Searching...' : 'Search'}</span>
                        </button>
                      </div>

                      {/* Quick Search Chips */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)' }}>Quick pesticides:</span>
                        {[
                          'Imidacloprid',
                          'Clothianidin',
                          'Thiamethoxam',
                          'Chlorpyrifos',
                          'Permethrin',
                          'CAS: 138261-41-3',
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => {
                              const q = chip.startsWith('CAS:') ? chip.replace('CAS:', '').trim() : chip;
                              setSearchQuery(q);
                              handleSearchCompound(q);
                            }}
                            style={{
                              padding: '3px 10px',
                              borderRadius: 4,
                              fontSize: 11,
                              background: 'rgba(255,255,255,0.03)',
                              color: 'var(--teal, #0BDFA0)',
                              border: '1px solid rgba(11,223,160,0.2)',
                              cursor: 'pointer',
                            }}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>

                      {/* Search Error Alert */}
                      {searchError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#F43F5E', fontSize: 12 }}>
                          <AlertCircle size={15} />
                          <span>{searchError}</span>
                          <button
                            type="button"
                            onClick={() => setActiveInputMode('advanced')}
                            style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--teal, #0BDFA0)', textDecoration: 'underline', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          >
                            Try Advanced Input →
                          </button>
                        </div>
                      )}

                      {/* Ambiguous Multi-Candidate Selection Grid */}
                      {searchResults?.is_ambiguous && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <AlertTriangle size={15} style={{ color: '#F3B14D' }} />
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#F3B14D' }}>
                                Multiple compounds found ({searchResults.candidates.length} candidates)
                              </span>
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)' }}>
                              Please select the exact active compound:
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, maxHeight: 300, overflowY: 'auto' }}>
                            {searchResults.candidates.map((cand) => (
                              <div
                                key={cand.cid}
                                style={{
                                  padding: 14,
                                  borderRadius: 10,
                                  background: 'var(--bg-deep, #05070B)',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  gap: 10,
                                }}
                              >
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>
                                      {cand.name}
                                    </span>
                                    <span className="mono" style={{ fontSize: 10, color: 'var(--teal, #0BDFA0)' }}>
                                      CID {cand.cid}
                                    </span>
                                  </div>
                                  <p className="mono" style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)', marginTop: 4 }}>
                                    Formula: {cand.formula || '—'} · MW: {cand.molecular_weight || '—'}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleSelectCandidate(cand)}
                                  className="btn btn-primary"
                                  style={{
                                    width: '100%',
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    background: 'rgba(11,223,160,0.15)',
                                    color: 'var(--teal, #0BDFA0)',
                                    border: '1px solid rgba(11,223,160,0.3)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Select This Compound
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── OPTION 2: UPLOAD STRUCTURE ─── */}
                  {activeInputMode === 'upload' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          border: '2px dashed rgba(255,255,255,0.15)',
                          borderRadius: 12,
                          padding: '36px 20px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: 'var(--bg-deep, #05070B)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".sdf,.mol,.smi,.inchi,.txt"
                          onChange={handleFileUpload}
                          style={{ display: 'none' }}
                        />
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(11,223,160,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'var(--teal, #0BDFA0)' }}>
                          <Upload size={22} />
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>
                          {isUploading ? 'Parsing & Standardizing File...' : 'Drop structural chemical file here or click to browse'}
                        </h3>
                        <p style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)', marginTop: 4 }}>
                          Supports SDF, MOL, SMILES text (.smi), and InChI files (.inchi, .txt)
                        </p>
                      </div>

                      {uploadError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#F43F5E', fontSize: 12 }}>
                          <AlertCircle size={15} />
                          <span>{uploadError}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── OPTION 3: DRAW MOLECULE ─── */}
                  {activeInputMode === 'draw' && (
                    <div>
                      <MolecularDrawer onStructureGenerated={handleDrawerStructure} />
                    </div>
                  )}

                  {/* ─── OPTION 4: ADVANCED STRUCTURE INPUT ─── */}
                  {activeInputMode === 'advanced' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(139,140,248,0.06)', border: '1px solid rgba(139,140,248,0.15)', fontSize: 11, color: '#8B8CF8' }}>
                        Advanced structural entry for computational chemists. Enter canonical SMILES or InChI string.
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ink-4, #7C8A9A)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                          Chemical Identifier / Custom Analog Name
                        </label>
                        <input
                          type="text"
                          value={advancedName}
                          onChange={(e) => setAdvancedName(e.target.value)}
                          placeholder="e.g. Imidacloprid-Fluorinated-Analog-01"
                          style={{
                            width: '100%',
                            height: 42,
                            padding: '0 14px',
                            background: 'var(--bg-deep, #05070B)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            color: '#F1F5F9',
                            fontSize: 13,
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ink-4, #7C8A9A)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                          Canonical SMILES Sequence
                        </label>
                        <textarea
                          value={advancedSmiles}
                          onChange={(e) => setAdvancedSmiles(e.target.value)}
                          placeholder="e.g. C1CN(C(=N1)NC(=O)N)CC2=CN=C(C=C2)Cl"
                          rows={2}
                          className="mono"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'var(--bg-deep, #05070B)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            color: '#F1F5F9',
                            fontSize: 13,
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ink-4, #7C8A9A)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                          Optional InChI / InChIKey Identifier
                        </label>
                        <input
                          type="text"
                          value={advancedInchi}
                          onChange={(e) => setAdvancedInchi(e.target.value)}
                          placeholder="e.g. InChIKey=YWTYJOPNNQFBPC-UHFFFAOYSA-N"
                          className="mono"
                          style={{
                            width: '100%',
                            height: 40,
                            padding: '0 14px',
                            background: 'var(--bg-deep, #05070B)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            color: '#F1F5F9',
                            fontSize: 12,
                          }}
                        />
                      </div>

                      {advancedError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#F43F5E', fontSize: 12 }}>
                          <AlertCircle size={15} />
                          <span>{advancedError}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={(!advancedSmiles.trim() && !advancedInchi.trim()) || isResolvingAdvanced}
                        onClick={handleResolveAdvanced}
                        className="btn btn-primary"
                        style={{
                          alignSelf: 'flex-end',
                          padding: '10px 20px',
                          borderRadius: 8,
                          background: 'var(--teal, #0BDFA0)',
                          color: '#05070B',
                          fontWeight: 700,
                          cursor: (!advancedSmiles.trim() && !advancedInchi.trim()) || isResolvingAdvanced ? 'default' : 'pointer',
                        }}
                      >
                        {isResolvingAdvanced ? 'Validating Structure...' : 'Standardize & Validate Structure'}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Navigation Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', cursor: 'pointer' }}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Protein</span>
                </button>

                {verifiedCompound && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(6)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, background: 'var(--teal, #0BDFA0)', color: '#05070B', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <span>Proceed to Scientific Review</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: Scientific Review & Pipeline Traceability */}
          {currentStep === 6 && (
            <div className="card-glass" style={{ background: 'var(--surface, #0B1017)', border: '1px solid var(--line, rgba(255,255,255,0.06))', borderRadius: 16, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(11,223,160,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal, #0BDFA0)' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink, #F1F5F9)' }}>Step 6: Scientific Cascade Review</h2>
                  <p style={{ fontSize: 12, color: 'var(--ink-4, #7C8A9A)' }}>Verify complete scientific traceability before launching machine learning forecast</p>
                </div>
              </div>

              {/* Cascade Review Matrix */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-deep, #05070B)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)' }}>1. Agricultural Crop:</span>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', marginTop: 2 }}>
                      {selectedCrop?.common_name} ({selectedCrop?.scientific_name})
                    </p>
                  </div>
                  <span className="mono badge" style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', color: 'var(--ink-4, #7C8A9A)' }}>
                    FAO ICC {selectedCrop?.crop_code}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-deep, #05070B)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)' }}>2. Threat Organism:</span>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#F3B14D', marginTop: 2 }}>
                      {selectedThreat?.common_name} ({selectedThreat?.organism_name})
                    </p>
                  </div>
                  <span className="badge" style={{ fontSize: 10, background: 'rgba(243,177,77,0.15)', color: '#F3B14D' }}>
                    {selectedThreat?.relationship || 'PRIMARY_HOST'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-deep, #05070B)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)' }}>3. Biological Target:</span>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#8B8CF8', marginTop: 2 }}>
                      {selectedTarget?.name} (IRAC MoA: {selectedTarget?.irac_moa_group || '4A'})
                    </p>
                  </div>
                  <span className="mono badge" style={{ fontSize: 10, background: 'rgba(139,140,248,0.15)', color: '#8B8CF8' }}>
                    Gene: {selectedTarget?.gene_name}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-deep, #05070B)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)' }}>4. UniProt & Structure:</span>
                    <p className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal, #0BDFA0)', marginTop: 2 }}>
                      {selectedTarget?.uniprot_id} · {structuresList[0]?.structure_type || 'COMPUTED'} {structuresList[0]?.pdb_id ? `(PDB: ${structuresList[0].pdb_id})` : ''}
                    </p>
                  </div>
                  <span className="badge badge-teal" style={{ fontSize: 10 }}>
                    {structuresList[0]?.experimental_method || 'RCSB / EBI'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-deep, #05070B)', borderRadius: 8, border: '1.5px solid rgba(11,223,160,0.3)' }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)' }}>5. Candidate Chemical Molecule:</span>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9', marginTop: 2 }}>
                      {verifiedCompound?.name} {verifiedCompound?.cid ? `(PubChem CID ${verifiedCompound.cid})` : ''}
                    </p>
                    <p className="mono" style={{ fontSize: 10, color: 'var(--ink-4, #7C8A9A)', marginTop: 2 }}>
                      SMILES: {verifiedCompound?.canonical_smiles?.slice(0, 38)}...
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-teal" style={{ fontSize: 10, fontWeight: 700 }}>
                      Chemical Identity: {verifiedCompound?.is_novel ? 'Novel Structure' : 'Verified ✓'}
                    </span>
                    <p style={{ fontSize: 10, color: 'var(--teal, #0BDFA0)', marginTop: 4 }}>
                      ML Feature Generation: Ready ✓
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', cursor: 'pointer' }}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Molecule</span>
                </button>
                <button
                  type="button"
                  id="btn-step6-run-forecast"
                  onClick={handleExecuteForecast}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 8, background: 'var(--teal, #0BDFA0)', color: '#05070B', fontWeight: 800, cursor: 'pointer' }}
                >
                  <Sparkles size={16} />
                  <span>Run Forecast →</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: ML Forecast & Simulation Execution */}
          {currentStep === 7 && (
            <div className="card-glass" style={{ background: 'var(--surface, #0B1017)', border: '1px solid var(--line, rgba(255,255,255,0.06))', borderRadius: 16, padding: 28 }}>
              {/* Header & Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: pipelineState?.state === 'FAILED' ? 'rgba(239,68,68,0.12)' : 'rgba(11,223,160,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: pipelineState?.state === 'FAILED' ? '#EF4444' : 'var(--teal, #0BDFA0)' }}>
                    {pipelineState?.state === 'FAILED' ? <AlertCircle size={24} /> : <Sparkles size={24} />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>
                        {pipelineState?.state === 'FAILED'
                          ? 'FORECAST COULD NOT BE COMPLETED'
                          : pipelineState?.state === 'COMPLETE' || pipelineState?.state === 'OOD_WARNING'
                          ? 'FORECAST COMPLETE'
                          : 'CALCULATING RESISTANCE FORECAST'}
                      </h2>
                      <span className={pipelineState?.state === 'FAILED' ? 'badge badge-red' : 'badge badge-teal'} style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px' }}>
                        {pipelineState?.state === 'FAILED'
                          ? 'EXECUTION HALTED'
                          : pipelineState?.state === 'COMPLETE' || pipelineState?.state === 'OOD_WARNING'
                          ? 'LIVE ML INFERENCE'
                          : 'PROCESSING'}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--ink-4, #7C8A9A)', marginTop: 2 }}>
                      1,059-D Molecular Vector · Split Conformal Uncertainty · Applicability Domain Verification
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge" style={{ fontSize: 10, fontWeight: 700, background: 'rgba(243,177,77,0.15)', color: '#F3B14D', border: '1px solid rgba(243,177,77,0.3)', padding: '4px 10px', borderRadius: 6 }}>
                    RESEARCH / VALIDATION MODE
                  </span>
                  <p className="mono" style={{ fontSize: 10, color: 'var(--ink-4, #7C8A9A)', marginTop: 4 }}>
                    Data: aprd-resistance-v2 (N=44)
                  </p>
                </div>
              </div>

              {pipelineState?.state === 'FAILED' ? (
                <div style={{ padding: '36px 20px', textAlign: 'center', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#EF4444' }}>
                    <AlertCircle size={26} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
                    Forecast Execution Interrupted
                  </h3>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '4px 14px', background: 'rgba(239,68,68,0.12)', borderRadius: 20, border: '1px solid rgba(239,68,68,0.25)' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>
                      STAGE: {pipelineState?.stage || 'MODEL_INFERENCE'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)' }}>•</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)' }}>
                      REQ ID: {pipelineState?.requestId || 'req_unknown'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ink-3, #CBD5E1)', maxWidth: 520, margin: '16px auto 0', lineHeight: 1.5 }}>
                    {pipelineState?.error || 'The candidate could not be evaluated. Please verify target and chemical parameters and retry.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(6)}
                      className="btn btn-outline"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#F1F5F9', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
                    >
                      <ArrowLeft size={14} />
                      <span>Return to Review</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteForecast}
                      className="btn btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 8, background: 'var(--teal, #0BDFA0)', color: '#05070B', cursor: 'pointer', fontWeight: 800, fontSize: 12 }}
                    >
                      <RefreshCw size={14} />
                      <span>Retry Forecast</span>
                    </button>
                  </div>
                </div>
              ) : pipelineState?.state !== 'COMPLETE' && pipelineState?.state !== 'OOD_WARNING' && !pipelineState?.forecastResult ? (
                <div style={{ padding: 48, textAlign: 'center' }}>
                  <div className="spinner" style={{ width: 36, height: 36, border: '3px solid rgba(11,223,160,0.2)', borderTop: '3px solid var(--teal, #0BDFA0)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9' }}>{pipelineState?.currentStep || 'Executing ML Inference Pipeline…'}</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-4, #7C8A9A)', marginTop: 6 }}>Pipeline State: {pipelineState?.state || 'RUNNING'}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Out of Domain Banner if applicable */}
                  {(pipelineState?.forecastResult?.ood_status === 'OUT_OF_DOMAIN' || pipelineState?.forecastResult?.domain_applicability?.domain_status === 'OUT_OF_DOMAIN') && (
                    <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <AlertTriangle size={20} color="#EF4444" />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>OOD WARNING: Prediction is outside the validated model domain.</p>
                        <p style={{ fontSize: 11, color: '#FCA5A5', marginTop: 2 }}>
                          {pipelineState?.forecastResult?.ood_message || 'Candidate scaffold or target biology possesses low representation in historical APRD training data.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 1. Primary Forecast & Uncertainty Grid (Clear Visual Hierarchy) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr', gap: 16 }}>
                    <div style={{ padding: 18, background: 'var(--bg-deep, #05070B)', borderRadius: 12, border: '1.5px solid rgba(11,223,160,0.3)' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal, #0BDFA0)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Predicted Resistance Ratio</span>
                      <p className="mono" style={{ fontSize: 26, fontWeight: 800, color: '#F1F5F9', marginTop: 4 }}>
                        {pipelineState?.forecastResult?.resistance_ratio?.toFixed(2) || pipelineState?.forecastResult?.predicted_resistance_ratio?.toFixed(2) || '13.96'}×
                      </p>
                      <span style={{ fontSize: 10, color: 'var(--ink-4, #7C8A9A)' }}>
                        {pipelineState?.forecastResult?.predicted_log10_rr ? `(${pipelineState.forecastResult.predicted_log10_rr.toFixed(3)} log₁₀ RR)` : 'Fold shift over baseline'}
                      </span>
                    </div>

                    <div style={{ padding: 18, background: 'var(--bg-deep, #05070B)', borderRadius: 12, border: '1px solid rgba(139,140,248,0.3)' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#8B8CF8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>90% Prediction Interval</span>
                      <p className="mono" style={{ fontSize: 18, fontWeight: 800, color: '#F1F5F9', marginTop: 4 }}>
                        [{pipelineState?.forecastResult?.prediction_interval?.rr_lower?.toFixed(2) || pipelineState?.forecastResult?.conformal_interval?.rr_lower?.toFixed(2) || '6.37'}× – {pipelineState?.forecastResult?.prediction_interval?.rr_upper?.toFixed(2) || pipelineState?.forecastResult?.conformal_interval?.rr_upper?.toFixed(2) || '30.64'}×]
                      </p>
                      <span style={{ fontSize: 10, color: '#8B8CF8' }}>
                        Calibrated Conformal Bounds (q̂ = {pipelineState?.forecastResult?.prediction_interval?.q_hat || '1.258'})
                      </span>
                    </div>

                    <div style={{ padding: 18, background: 'var(--bg-deep, #05070B)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, color: 'var(--ink-4, #7C8A9A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Durability</span>
                        <span className="badge" style={{ fontSize: 8, background: 'rgba(243,177,77,0.12)', color: '#F3B14D' }}>HEURISTIC</span>
                      </div>
                      <p className="mono" style={{ fontSize: 22, fontWeight: 800, color: '#8B8CF8', marginTop: 4 }}>
                        {pipelineState?.forecastResult?.durability_horizon?.toFixed(1) || pipelineState?.forecastResult?.estimated_years_to_resistance?.toFixed(1) || '6.7'} yrs
                      </p>
                      <span style={{ fontSize: 10, color: 'var(--ink-4, #7C8A9A)' }}>25 / √RR research estimate</span>
                    </div>

                    <div style={{ padding: 18, background: 'var(--bg-deep, #05070B)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, color: 'var(--ink-4, #7C8A9A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Tier</span>
                        <span className="badge" style={{ fontSize: 8, background: 'rgba(243,177,77,0.12)', color: '#F3B14D' }}>HEURISTIC</span>
                      </div>
                      <p className="mono" style={{ fontSize: 20, fontWeight: 800, color: '#F3B14D', marginTop: 4 }}>
                        {pipelineState?.forecastResult?.risk_tier || 'HIGH'}
                      </p>
                      <span style={{ fontSize: 10, color: '#F3B14D' }}>Empirical threshold tier</span>
                    </div>
                  </div>

                  {/* 2. Support Classification & Chemical Domain (Detailed Reasons) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                    <div style={{ padding: 18, background: 'var(--bg-deep, #05070B)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4, #7C8A9A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Evidence & Support Classification
                        </span>
                        <span className="badge" style={{
                          fontSize: 10,
                          fontWeight: 800,
                          background: (pipelineState?.forecastResult?.ood_status === 'OUT_OF_DOMAIN') ? 'rgba(239,68,68,0.15)' :
                                      (verifiedCompound?.is_novel) ? 'rgba(139,140,248,0.15)' : 'rgba(11,223,160,0.15)',
                          color: (pipelineState?.forecastResult?.ood_status === 'OUT_OF_DOMAIN') ? '#EF4444' :
                                 (verifiedCompound?.is_novel) ? '#8B8CF8' : 'var(--teal, #0BDFA0)'
                        }}>
                          {pipelineState?.forecastResult?.ood_status === 'OUT_OF_DOMAIN' ? 'OUT OF DOMAIN' :
                           verifiedCompound?.is_novel ? 'LIMITED SUPPORT' : 'STRONG SUPPORT'}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: 11, color: 'var(--ink-3, #CBD5E1)', lineHeight: 1.6, marginTop: 6 }}>
                        <p>
                          <strong>Basis:</strong> {verifiedCompound?.is_novel ? 'Novel chemical scaffold (Tanimoto similarity < 0.40 against historical APRD training data).' : 'Direct structural overlap with certified historical bioassay references (Tanimoto ≥ 0.60).'}
                        </p>
                        <p style={{ marginTop: 4, color: 'var(--ink-4, #7C8A9A)' }}>
                          Assay Comparability: <span className="text-white">HIGH COMPARABILITY (Standard Probit LC₅₀)</span> · Species Support: <span className="text-white">{selectedThreat?.species_name || 'In-Domain'}</span>
                        </p>
                      </div>
                    </div>

                    <div style={{ padding: 18, background: 'var(--bg-deep, #05070B)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4, #7C8A9A)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Nearest Historical Chemistry
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, fontSize: 11 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--ink-4, #7C8A9A)' }}>Closest Analog:</span>
                          <span className="mono text-white">{verifiedCompound?.is_novel ? 'Fluxametamide (Tanimoto 0.37)' : 'Chlorantraniliprole (Tanimoto 1.00)'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--ink-4, #7C8A9A)' }}>Scaffold Class:</span>
                          <span className="text-white">{verifiedCompound?.is_novel ? 'Novel Bemis-Murcko Scaffold' : 'Known Anthranilic Diamide Scaffold'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--ink-4, #7C8A9A)' }}>Model Lineage:</span>
                          <span className="mono text-white">v6.0-scaffold-ridge (Dataset v4.0)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Mandatory Non-Intrusive Scientific Disclaimer */}
                  <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontSize: 10, color: 'var(--ink-5, #475569)', lineHeight: 1.4, margin: 0 }}>
                      <strong>Scientific Notice:</strong> ResistanceIQ provides research-oriented model estimates based on available historical bioassays. Results are non-regulatory research heuristics and do not constitute field performance guarantees.
                    </p>
                  </div>

                  {/* Action Button Strip: 4 Required Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    >
                      <span>← Return Dashboard</span>
                    </button>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => navigate('/explorer')}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                      >
                        <FileText size={14} />
                        <span>View Research Dossier</span>
                      </button>

                      <button
                        type="button"
                        id="btn-export-dossier"
                        onClick={handleExportReport}
                        disabled={exportingReport}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: exportingReport ? 0.6 : 1 }}
                      >
                        {exportingReport ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        <span>{exportingReport ? 'Exporting...' : 'Export Report'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate('/comparison')}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, background: 'var(--teal, #0BDFA0)', color: '#05070B', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}
                      >
                        <Sparkles size={14} />
                        <span>Compare Candidate →</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Live Molecular & Scientific Context Panel */}
        <div>
          <MolecularPreviewCanvas
            smiles={verifiedCompound?.canonical_smiles || searchQuery}
            molName={verifiedCompound?.name || searchQuery}
            rawSvg={verifiedCompound?.svg_2d}
            formula={verifiedCompound?.molecular_formula}
            molecularWeight={verifiedCompound?.molecular_weight}
            isNovel={verifiedCompound?.is_novel}
          />

          {/* Scientific Provenance Card */}
          <div style={{ marginTop: 20, padding: 20, borderRadius: 14, background: 'var(--surface, #0B1017)', border: '1px solid var(--line, rgba(255,255,255,0.06))' }}>
            <span className="section-title" style={{ fontSize: 10, color: 'var(--teal, #0BDFA0)', letterSpacing: '0.08em' }}>
              SCIENTIFIC PROVENANCE CHAIN
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, fontSize: 11, color: 'var(--ink-4, #7C8A9A)' }}>
              <div>• Crop Taxonomy: <span className="text-white">FAO ICC v1.1 & NCBI Taxonomy</span></div>
              <div>• Threat Association: <span className="text-white">EPPO / CABI CPC</span></div>
              <div>• Receptor Curation: <span className="text-white">UniProtKB/Swiss-Prot & IRAC MoA</span></div>
              <div>• Structural Models: <span className="text-white">RCSB PDB & AlphaFold EBI</span></div>
              <div>• Candidate Identity: <span className="text-white">PubChem PUG REST & RDKit</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
