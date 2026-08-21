export type UserRole = 'ADMIN' | 'ANALYST' | 'VIEWER';
export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
export type RiskTier = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type ForecastStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'OUT_OF_DOMAIN';
export type ReportFormat = 'PDF' | 'CSV';

export interface User {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan_tier: string;
  created_at: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  created_at: string;
  forecast_count?: number;
  avg_durability?: number;
}

export interface Molecule {
  id: string;
  chemical_name: string;
  smiles: string;
  pubchem_cid?: number;
  iupac_name?: string;
  molecular_formula?: string;
  molecular_weight?: number;
  logp?: number;
  tpsa?: number;
  hbd_count?: number;
  hba_count?: number;
  rotatable_bonds?: number;
  inchikey?: string;
  inchi?: string;
  is_novel?: boolean;
  standardization_status?: string;
  resolution_method?: string;
  source_identifier?: string;
  svg_2d?: string;
  provenance_source?: string;
  created_at: string;
}

export interface ChemicalSearchCandidate {
  cid: number;
  name: string;
  iupac_name?: string;
  formula?: string;
  molecular_weight?: number;
  canonical_smiles?: string;
  inchikey?: string;
  has_3d_conformer?: boolean;
  thumbnail_svg?: string;
}

export interface PubChemCompoundDetail {
  cid: number;
  name: string;
  iupac_name?: string;
  molecular_formula?: string;
  molecular_weight?: number;
  canonical_smiles: string;
  isomeric_smiles?: string;
  inchi?: string;
  inchikey?: string;
  xlogp?: number;
  hbd_count?: number;
  hba_count?: number;
  rotatable_bonds?: number;
  synonyms?: string[];
  has_3d_conformer?: boolean;
  svg_2d?: string;
  source?: string;
  source_identifier?: string;
  retrieved_at?: string;
}

export interface ChemicalSearchResponse {
  query: string;
  total_candidates: number;
  is_ambiguous: boolean;
  candidates: ChemicalSearchCandidate[];
  resolved_compound?: PubChemCompoundDetail;
  message?: string;
}

export interface StructureResolveResponse {
  valid: boolean;
  error?: string;
  chemical_name?: string;
  canonical_smiles?: string;
  molecular_formula?: string;
  molecular_weight?: number;
  logp?: number;
  tpsa?: number;
  hbd_count?: number;
  hba_count?: number;
  rotatable_bonds?: number;
  inchi?: string;
  inchikey?: string;
  is_novel?: boolean;
  pubchem_cid?: number;
  provenance_source?: string;
  standardization_status?: string;
  svg_2d?: string;
  features_ready?: boolean;
}

export interface Crop {
  id: string;
  common_name: string;
  scientific_name: string;
  family?: string;
  genus?: string;
  species?: string;
  crop_code?: string;
  ncbi_tax_id?: number;
  taxonomy_status?: string;
  taxonomy_rank?: string;
  taxonomy_lineage?: string;
  synonyms?: string;
  source?: string;
  source_version?: string;
  evidence_level?: string;
  updated_at?: string;
}

export interface CropThreat {
  id: string;
  crop_id: string;
  organism_id: string;
  organism_name: string;
  common_name?: string;
  organism_type?: string;
  ncbi_tax_id?: number;
  relationship?: string;
  source?: string;
  evidence_level?: string;
  confidence_score?: number;
  citation?: string;
  retrieved_at?: string;
}

export interface ProteinStructure {
  id: string;
  target_id: string;
  protein_record_id?: string;
  uniprot_accession: string;
  pdb_id?: string;
  chain_id?: string;
  structure_type: 'EXPERIMENTAL' | 'COMPUTED' | 'UNAVAILABLE';
  structure_source: string;
  experimental_method?: string;
  resolution?: number;
  structure_url?: string;
  cif_url?: string;
  alphafold_model_url?: string;
  retrieval_date?: string;
}

export interface ProteinRecord {
  id: string;
  uniprot_accession: string;
  target_id?: string;
  protein_name: string;
  gene_primary?: string;
  organism_name: string;
  ncbi_tax_id?: number;
  sequence?: string;
  sequence_length?: number;
  functional_description?: string;
  active_sites_json?: string;
  cross_references_json?: string;
  source?: string;
  source_version?: string;
  retrieved_at?: string;
  structures?: ProteinStructure[];
}

export interface Target {
  id: string;
  name: string;
  gene_name?: string;
  uniprot_id: string;
  protein_name?: string;
  target_type?: string;
  organism: string;
  organism_id?: string;
  irac_moa_group?: string;
  structure_source?: string;
  sequence_length?: number;
  functional_description?: string;
  resistance_mechanism?: string;
  evidence_level?: string;
  source?: string;
  binding_pocket_residues?: string;
  created_at: string;
  protein_record?: ProteinRecord;
  structures?: ProteinStructure[];
}

export interface Pest {
  id: string;
  common_name: string;
  species_name: string;
  generation_time_days: number;
  typical_population_size: number;
  baseline_mutation_rate: number;
  created_at: string;
}

export interface TrajectoryPoint {
  year: number;
  resistance_probability: number;
}

export interface MutagenesisHotspot {
  residue: string;
  delta_delta_g: number;
  risk: 'low' | 'moderate' | 'high' | 'critical';
}

export interface ConformalInterval {
  alpha: number;
  q_hat: number;
  rr_lower: number;
  rr_upper: number;
}

export interface DomainApplicability {
  domain_status: 'IN_DOMAIN' | 'LIMITED_SUPPORT' | 'OUT_OF_DOMAIN';
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  max_tanimoto_similarity: number;
  moa_represented: boolean;
  pest_order_represented: boolean;
  message: string;
}

export interface PredictionResult {
  status: string;
  model_version: string;
  model_type: string;
  predicted_log10_rr: number;
  predicted_resistance_ratio: number;
  estimated_years_to_resistance: number;
  durability_score: number;
  risk_tier: RiskTier;
  conformal_interval: ConformalInterval;
  domain_applicability: DomainApplicability;
  features_used: Record<string, any>;
  generated_at: string;
}

export interface ModelInfo {
  model_id?: string;
  model_version?: string;
  version?: string;
  algorithm: string;
  status: string;
  artifact_sha256: string;
  metrics: Record<string, any>;
  feature_version?: string;
  dataset_version?: string;
  health_status?: string;
}

export interface ProductionForecastResponse {
  forecast_id: string;
  candidate_id: string;
  compound_identity: Record<string, any>;
  target_identity: Record<string, any>;
  model_version: string;
  model_algorithm?: string;
  model_status?: string;
  prediction: number;
  resistance_ratio: number;
  durability_horizon: number;
  durability_score: number;
  risk_tier: string;
  prediction_interval: ConformalInterval;
  ood_status: string;
  ood_message?: string;
  feature_version: string;
  data_version: string;
  created_at: string;
  risk_trajectory?: TrajectoryPoint[];
  mutagenesis_hotspots?: MutagenesisHotspot[];
}

export interface Forecast {
  id: string;
  project_id: string;
  molecule_id: string;
  target_id: string;
  pest_id: string;
  status: ForecastStatus;
  durability_score?: number;
  estimated_years_to_resistance?: number;
  risk_tier?: RiskTier;
  binding_affinity_kcal_mol?: number;
  risk_trajectory_json?: string;
  mutagenesis_hotspots_json?: string;
  model_version?: string;
  created_at: string;
  completed_at?: string;
  molecule?: Molecule;
  target?: Target;
  pest?: Pest;
}

export interface BacktestCase {
  id: string;
  pesticide_name: string;
  aprd_id: string;
  pest_name: string;
  target_name: string;
  deployment_year: number;
  actual_years: number;
  predicted_years: number;
  error_margin: number;
  source: string;
  created_at: string;
}

export interface BacktestAccuracySummary {
  total_cases: number;
  mean_absolute_error: number;
  within_1yr_pct: number;
  within_3yr_pct: number;
  within_5yr_pct: number;
  model_version: string;
  cases: BacktestCase[];
}

export interface Report {
  id: string;
  project_id: string;
  file_name: string;
  format: ReportFormat;
  size_kb: number;
  storage_path?: string;
  created_at: string;
}

export interface DashboardSummary {
  total_projects: number;
  total_forecasts: number;
  avg_durability_score: number;
  validated_cases_count: number;
  active_projects: Project[];
  recent_forecasts: Forecast[];
}

export interface SystemHealth {
  status: string;
  version: string;
  environment: string;
  database_connected: boolean;
  ml_service_status: string;
  timestamp: string;
}
