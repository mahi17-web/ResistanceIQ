import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  Bug,
  Dna,
  Atom,
  FlaskConical,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api/client.ts';
import { PredictionResult, Crop, CropThreat, Target, ProteinStructure } from '../api/types.ts';

export const NewCandidatePage: React.FC = () => {
  const navigate = useNavigate();

  // Selected State
  const [selectedCropId, setSelectedCropId] = useState('');
  const [selectedThreatId, setSelectedThreatId] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [chemicalName, setChemicalName] = useState('');
  const [smiles, setSmiles] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [previewResult, setPreviewResult] = useState<PredictionResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Queries
  const { data: crops } = useQuery({ queryKey: ['crops'], queryFn: () => api.getCrops() });
  const { data: cropThreats } = useQuery({
    queryKey: ['cropThreats', selectedCropId],
    queryFn: () => (selectedCropId ? api.getCropThreats(selectedCropId) : Promise.resolve([])),
    enabled: !!selectedCropId,
  });

  const { data: targetList } = useQuery({
    queryKey: ['threatTargets', selectedThreatId],
    queryFn: () => (selectedThreatId ? api.getThreatTargets(selectedThreatId) : api.getTargets()),
    enabled: true,
  });

  const { data: targetStructures } = useQuery({
    queryKey: ['targetStructures', selectedTargetId],
    queryFn: () => (selectedTargetId ? api.getTargetStructures(selectedTargetId) : Promise.resolve([])),
    enabled: !!selectedTargetId,
  });

  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: api.getProjects });
  const { data: models } = useQuery({ queryKey: ['models'], queryFn: api.getAvailableModels });

  const activeModel = models?.[0]?.version || 'v1.0.0-ridge-ecfp4';
  const activeModelStatus = models?.[0]?.status || 'DEVELOPMENT ONLY';

  // Auto-select first crop when loaded
  useEffect(() => {
    if (crops && crops.length > 0 && !selectedCropId) {
      setSelectedCropId(crops[0].id);
    }
  }, [crops, selectedCropId]);

  // Auto-select first threat when cropThreats loaded
  useEffect(() => {
    if (cropThreats && cropThreats.length > 0) {
      setSelectedThreatId(cropThreats[0].organism_id);
    }
  }, [cropThreats]);

  // Auto-select first target when targetList loaded
  useEffect(() => {
    if (targetList && targetList.length > 0) {
      setSelectedTargetId(targetList[0].id);
    }
  }, [targetList]);

  const selectedCrop = crops?.find((c) => c.id === selectedCropId);
  const selectedThreat = cropThreats?.find((t) => t.organism_id === selectedThreatId);
  const selectedTarget = targetList?.find((t) => t.id === selectedTargetId) || targetList?.[0];

  // Live Model Preview Mutation
  const evaluateMutation = useMutation({
    mutationFn: async () => {
      setPreviewError(null);
      const result = await api.evaluateCandidate({
        chemical_name: chemicalName,
        smiles: smiles,
        irac_moa_group: selectedTarget?.irac_moa_group || '4A',
        pest_name: selectedThreat?.organism_name || 'Myzus persicae',
        pest_order: 'Hemiptera',
        model_version: activeModel,
      });
      return result;
    },
    onSuccess: (data) => {
      setPreviewResult(data);
    },
    onError: (err: any) => {
      setPreviewError(err.message || 'Evaluation failed.');
    },
  });

  const createCandidateMutation = useMutation({
    mutationFn: async () => {
      const molecule = await api.createMolecule({
        chemical_name: chemicalName,
        smiles: smiles,
      });

      const forecast = await api.createForecast({
        project_id: selectedProjectId || (projects && projects[0]?.id) || '',
        molecule_id: molecule.id,
        target_id: selectedTargetId || (targetList && targetList[0]?.id) || '',
        pest_id: selectedThreat?.organism_id || 'pst_aphid_01',
        crop_id: selectedCropId,
        threat_id: selectedThreat?.id,
      });

      return forecast;
    },
    onSuccess: () => {
      navigate('/comparison');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chemicalName || !smiles) return;
    createCandidateMutation.mutate();
  };

  const handleRunEvaluationPreview = () => {
    if (!chemicalName || !smiles) return;
    evaluateMutation.mutate();
  };

  return (
    <div className="page-wrap py-12">
      <div className="mb-12">
        <span className="section-title text-[#0BDFA0]">Automated Scientific Knowledge System</span>
        <h1 className="display-md mt-2">New Candidate Ingestion & Simulation</h1>
        <p className="text-sm text-[#9AACBE] mt-1 max-w-2xl">
          Automated cascade: Select an agricultural crop to dynamically resolve verified threat organisms,
          biological receptors, Swiss-Prot UniProt sequences, and PDB coordinate structures.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Knowledge Graph and Biological Parameters */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Crop & Threat Knowledge */}
          <div className="p-8 rounded-xl bg-[#0B1017] border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#0BDFA0]/10 flex items-center justify-center text-[#0BDFA0]">
                <Sprout size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">1. Crop Taxonomy & Threat Host Matrix</h2>
                <p className="text-xs text-[#7C8A9A]">FAO Indicative Crop Classification (ICC v1.1) & NCBI Taxonomy</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#7C8A9A] uppercase tracking-wider mb-2">
                  Agricultural Crop Master
                </label>
                <select
                  value={selectedCropId}
                  onChange={(e) => setSelectedCropId(e.target.value)}
                  className="w-full h-11 px-4 rounded-lg bg-[#05070B] border border-white/[0.08] text-sm text-[#F1F5F9] focus:outline-none focus:border-[#0BDFA0]"
                >
                  {crops?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.common_name} ({c.scientific_name}) [ICC {c.crop_code}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#7C8A9A] uppercase tracking-wider mb-2">
                  Verified Threat Organism
                </label>
                <select
                  value={selectedThreatId}
                  onChange={(e) => setSelectedThreatId(e.target.value)}
                  className="w-full h-11 px-4 rounded-lg bg-[#05070B] border border-white/[0.08] text-sm text-[#F1F5F9] focus:outline-none focus:border-[#0BDFA0]"
                >
                  {cropThreats && cropThreats.length > 0 ? (
                    cropThreats.map((t) => (
                      <option key={t.id} value={t.organism_id}>
                        {t.common_name || t.organism_name} ({t.organism_name})
                      </option>
                    ))
                  ) : (
                    <option value="">No verified threat mapped</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Biological Receptor & Protein Structure */}
          <div className="p-8 rounded-xl bg-[#0B1017] border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#8B8CF8]/10 flex items-center justify-center text-[#8B8CF8]">
                <Dna size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">2. Validated Target & Structure Intelligence</h2>
                <p className="text-xs text-[#7C8A9A]">Swiss-Prot UniProtKB & RCSB PDB coordinate archives</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#7C8A9A] uppercase tracking-wider mb-2">
                  Target Receptor Site
                </label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full h-11 px-4 rounded-lg bg-[#05070B] border border-white/[0.08] text-sm text-[#F1F5F9] focus:outline-none focus:border-[#0BDFA0]"
                >
                  {targetList?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (UniProt: {t.uniprot_id}) · IRAC {t.irac_moa_group || '4A'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Automatic Structure Details Panel */}
              {selectedTarget && (
                <div className="p-4 rounded-lg bg-[#05070B] border border-white/[0.04] space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[#0BDFA0]">UniProt: {selectedTarget.uniprot_id}</span>
                    <span className="text-[#7C8A9A]">Gene: {selectedTarget.gene_name || 'ace-1'}</span>
                    <span className="badge bg-[#8B8CF8]/10 text-[#8B8CF8] px-2 py-0.5 rounded">
                      Length: {selectedTarget.sequence_length || 647} aa
                    </span>
                  </div>

                  <p className="text-[#9AACBE] pt-1">
                    {selectedTarget.functional_description || 'Essential physiological receptor mediating neurochemical signaling.'}
                  </p>

                  <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                    <span className="text-[#7C8A9A]">3D Structure Availability:</span>
                    <div className="flex items-center gap-2">
                      {targetStructures && targetStructures.length > 0 ? (
                        targetStructures.map((s) => (
                          <span
                            key={s.id}
                            className={`px-2 py-0.5 rounded font-mono ${
                              s.structure_type === 'EXPERIMENTAL'
                                ? 'bg-[#0BDFA0]/10 text-[#0BDFA0]'
                                : 'bg-[#8B8CF8]/10 text-[#8B8CF8]'
                            }`}
                          >
                            {s.structure_type}: {s.pdb_id || s.uniprot_accession} {s.resolution ? `(${s.resolution}Å)` : ''}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#7C8A9A]">Protein structure unavailable</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Chemical Structure */}
          <div className="p-8 rounded-xl bg-[#0B1017] border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#0BDFA0]/10 flex items-center justify-center text-[#0BDFA0]">
                <FlaskConical size={18} />
              </div>
              <h2 className="text-lg font-semibold">3. Candidate Chemical Identification</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#7C8A9A] uppercase tracking-wider mb-2">
                  Candidate Chemical Identifier
                </label>
                <input
                  type="text"
                  value={chemicalName}
                  onChange={(e) => setChemicalName(e.target.value)}
                  placeholder="e.g. Imidacloprid Analog BW-5520"
                  required
                  className="w-full h-11 px-4 rounded-lg bg-[#05070B] border border-white/[0.08] text-sm text-[#F1F5F9] focus:outline-none focus:border-[#0BDFA0]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#7C8A9A] uppercase tracking-wider mb-2">
                  SMILES String
                </label>
                <textarea
                  value={smiles}
                  onChange={(e) => setSmiles(e.target.value)}
                  placeholder="e.g. C1CN(C(=N1)NC(=O)N)CC2=CN=C(C=C2)Cl"
                  required
                  rows={3}
                  className="w-full p-4 rounded-lg bg-[#05070B] border border-white/[0.08] text-sm font-mono text-[#F1F5F9] focus:outline-none focus:border-[#0BDFA0]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRunEvaluationPreview}
                  disabled={!chemicalName || !smiles || evaluateMutation.isPending}
                  className="btn btn-secondary text-xs flex items-center gap-1.5"
                >
                  <Sparkles size={14} className="text-[#0BDFA0]" />
                  {evaluateMutation.isPending ? 'Calculating ML Scoring...' : 'Run Quick Applicability Check'}
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Live Model Preview */}
          {previewResult && (
            <div className="p-6 rounded-xl bg-[#0B1017] border border-[#0BDFA0]/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#0BDFA0]" />
                  <h3 className="text-sm font-semibold text-[#F1F5F9]">Inference Engine Scoring Result</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0BDFA0]/10 text-[#0BDFA0]">
                  {previewResult.domain_applicability.domain_status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-white/[0.04] text-xs">
                <div>
                  <span className="text-[#7C8A9A]">Predicted Resistance Ratio</span>
                  <div className="text-lg font-mono font-bold text-[#F1F5F9] mt-0.5">
                    {previewResult.predicted_resistance_ratio}x
                  </div>
                </div>
                <div>
                  <span className="text-[#7C8A9A]">90% Conformal Interval</span>
                  <div className="text-lg font-mono font-bold text-[#0BDFA0] mt-0.5">
                    [{previewResult.conformal_interval.rr_lower}x, {previewResult.conformal_interval.rr_upper}x]
                  </div>
                </div>
                <div>
                  <span className="text-[#7C8A9A]">Risk Tier Classification</span>
                  <div className="text-lg font-mono font-bold text-[#F3B14D] mt-0.5">
                    {previewResult.risk_tier}
                  </div>
                </div>
                <div>
                  <span className="text-[#7C8A9A]">Durability Horizon</span>
                  <div className="text-lg font-mono font-bold text-[#8B8CF8] mt-0.5">
                    {previewResult.estimated_years_to_resistance} yrs
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewError && (
            <div className="p-4 rounded-lg bg-[#E85D7A]/10 border border-[#E85D7A]/30 flex items-center gap-3 text-xs text-[#E85D7A]">
              <ShieldAlert size={16} />
              <span>{previewError}</span>
            </div>
          )}
        </div>

        {/* Right 1 Column: Summary & Submission */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-[#0B1017] border border-white/[0.06]">
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-[#7C8A9A]">
              Evaluation Configuration
            </h3>

            <div className="space-y-3 text-xs mb-6">
              <div className="flex justify-between py-2 border-b border-white/[0.04]">
                <span className="text-[#7C8A9A]">Selected Crop</span>
                <span className="font-mono text-[#F1F5F9]">{selectedCrop?.common_name || 'Tomato'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.04]">
                <span className="text-[#7C8A9A]">Threat Organism</span>
                <span className="font-mono text-[#F3B14D]">{selectedThreat?.common_name || 'Green Peach Aphid'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.04]">
                <span className="text-[#7C8A9A]">Target Receptor</span>
                <span className="font-mono text-[#8B8CF8]">{selectedTarget?.name || 'AChE1'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.04]">
                <span className="text-[#7C8A9A]">Model Version</span>
                <span className="font-mono text-[#0BDFA0]">{activeModel}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={createCandidateMutation.isPending || !chemicalName || !smiles}
              className="w-full btn btn-primary justify-center"
            >
              {createCandidateMutation.isPending ? (
                'Processing...'
              ) : (
                <>
                  <span>Ingest & Forecast</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
