from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator
from app.models import UserRole, ProjectStatus, RiskTier, ForecastStatus, ReportFormat


# ─── Auth & User ─────────────────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: "UserRead"


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    org_id: Optional[str] = None


class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    organization_name: str
    password: str
    confirm_password: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class VerifyEmailRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str
    expires_in_minutes: int = 10


class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class VerifyResetCodeResponse(BaseModel):
    reset_token: str
    expires_in: int = 600
    message: str = "Verification code accepted. Please set your new password."


class ResetPasswordRequest(BaseModel):
    reset_token: Optional[str] = None
    token: Optional[str] = None
    new_password: str

    @model_validator(mode="after")
    def resolve_token(self):
        if not self.reset_token and not self.token:
            raise ValueError("reset_token is required")
        if not self.reset_token and self.token:
            self.reset_token = self.token
        return self


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None


class InviteUserRequest(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.ANALYST


class UserRoleUpdateRequest(BaseModel):
    role: UserRole


class AcceptInviteRequest(BaseModel):
    token: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    role: UserRole = UserRole.ANALYST
    organization_id: str


class OrganizationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    plan_tier: str
    created_at: datetime


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    email: EmailStr
    full_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    role: UserRole
    is_active: bool
    email_verified: bool = False
    is_verified: bool = False
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    organization: Optional[OrganizationRead] = None


# ─── Molecule & Automated Chemical Resolution ───────────────────────────────
class ChemicalSearchCandidate(BaseModel):
    cid: int
    name: str
    iupac_name: Optional[str] = None
    formula: Optional[str] = None
    molecular_weight: Optional[float] = None
    canonical_smiles: Optional[str] = None
    inchikey: Optional[str] = None
    has_3d_conformer: bool = False
    thumbnail_svg: Optional[str] = None


class PubChemCompoundDetail(BaseModel):
    cid: int
    name: str
    iupac_name: Optional[str] = None
    molecular_formula: Optional[str] = None
    molecular_weight: Optional[float] = None
    canonical_smiles: str
    isomeric_smiles: Optional[str] = None
    inchi: Optional[str] = None
    inchikey: Optional[str] = None
    xlogp: Optional[float] = None
    hbd_count: Optional[int] = None
    hba_count: Optional[int] = None
    rotatable_bonds: Optional[int] = None
    synonyms: List[str] = []
    has_3d_conformer: bool = False
    svg_2d: Optional[str] = None
    source: str = "PubChem"
    source_identifier: Optional[str] = None
    retrieved_at: Optional[datetime] = None


class ChemicalSearchResponse(BaseModel):
    query: str
    total_candidates: int
    is_ambiguous: bool
    candidates: List[ChemicalSearchCandidate]
    resolved_compound: Optional[PubChemCompoundDetail] = None
    message: Optional[str] = None


class StructureResolveRequest(BaseModel):
    structure_data: str
    format: Optional[str] = "AUTO"  # AUTO, SMILES, INCHI, MOL, SDF
    chemical_name: Optional[str] = None


class StructureResolveResponse(BaseModel):
    valid: bool
    error: Optional[str] = None
    chemical_name: Optional[str] = None
    canonical_smiles: Optional[str] = None
    molecular_formula: Optional[str] = None
    molecular_weight: Optional[float] = None
    logp: Optional[float] = None
    tpsa: Optional[float] = None
    hbd_count: Optional[int] = None
    hba_count: Optional[int] = None
    rotatable_bonds: Optional[int] = None
    inchi: Optional[str] = None
    inchikey: Optional[str] = None
    is_novel: bool = True
    pubchem_cid: Optional[int] = None
    provenance_source: str = "USER_UPLOAD"
    standardization_status: str = "STANDARDIZED"
    svg_2d: Optional[str] = None
    features_ready: bool = False


class MoleculeCreate(BaseModel):
    chemical_name: str
    smiles: str
    pubchem_cid: Optional[int] = None
    iupac_name: Optional[str] = None
    molecular_formula: Optional[str] = None
    molecular_weight: Optional[float] = None
    logp: Optional[float] = None
    tpsa: Optional[float] = None
    hbd_count: Optional[int] = None
    hba_count: Optional[int] = None
    rotatable_bonds: Optional[int] = None
    inchikey: Optional[str] = None
    inchi: Optional[str] = None
    is_novel: bool = False
    standardization_status: Optional[str] = "STANDARDIZED"
    resolution_method: Optional[str] = "PUBCHEM_NAME_SEARCH"
    source_identifier: Optional[str] = None
    conformer_3d_available: bool = False
    synonyms_json: Optional[str] = None
    svg_2d: Optional[str] = None
    provenance_source: Optional[str] = "PUBCHEM"


class MoleculeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    chemical_name: str
    smiles: str
    pubchem_cid: Optional[int] = None
    iupac_name: Optional[str] = None
    molecular_formula: Optional[str] = None
    molecular_weight: Optional[float] = None
    logp: Optional[float] = None
    tpsa: Optional[float] = None
    hbd_count: Optional[int] = None
    hba_count: Optional[int] = None
    rotatable_bonds: Optional[int] = None
    inchikey: Optional[str] = None
    inchi: Optional[str] = None
    is_novel: bool = False
    standardization_status: Optional[str] = "STANDARDIZED"
    resolution_method: Optional[str] = "PUBCHEM_NAME_SEARCH"
    source_identifier: Optional[str] = None
    conformer_3d_available: bool = False
    svg_2d: Optional[str] = None
    provenance_source: Optional[str] = None
    retrieved_at: Optional[datetime] = None
    created_at: datetime


# ─── Knowledge Graph: Crops, Proteins, Structures ────────────────────────────
class CropRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    common_name: str
    scientific_name: str
    family: Optional[str] = None
    genus: Optional[str] = None
    species: Optional[str] = None
    crop_code: Optional[str] = None
    ncbi_tax_id: Optional[int] = None
    taxonomy_status: Optional[str] = "RESOLVED"
    taxonomy_rank: Optional[str] = "species"
    taxonomy_lineage: Optional[str] = None
    synonyms: Optional[str] = None
    source: Optional[str] = None
    source_version: Optional[str] = None
    evidence_level: Optional[str] = None
    updated_at: Optional[datetime] = None


class CropThreatRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    crop_id: str
    organism_id: str
    organism_name: str
    common_name: Optional[str] = None
    organism_type: Optional[str] = "insect"
    ncbi_tax_id: Optional[int] = None
    relationship: Optional[str] = "PRIMARY_HOST"
    source: Optional[str] = None
    source_record_id: Optional[str] = None
    source_url: Optional[str] = None
    evidence_level: Optional[str] = "DIRECT"
    confidence_score: Optional[float] = 1.0
    citation: Optional[str] = None
    retrieved_at: Optional[datetime] = None


class ProteinStructureRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    target_id: str
    protein_record_id: Optional[str] = None
    uniprot_accession: str
    pdb_id: Optional[str] = None
    entity_id: Optional[str] = "1"
    chain_id: Optional[str] = "A"
    structure_type: str
    structure_source: str
    experimental_method: Optional[str] = None
    resolution: Optional[float] = None
    mapping_evidence: Optional[str] = "EXACT_SPECIES_MATCH"
    structure_url: Optional[str] = None
    cif_url: Optional[str] = None
    alphafold_model_url: Optional[str] = None
    retrieval_date: Optional[datetime] = None


class ProteinRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    uniprot_accession: str
    target_id: Optional[str] = None
    protein_name: str
    gene_primary: Optional[str] = None
    organism_name: str
    ncbi_tax_id: Optional[int] = None
    review_status: Optional[str] = "REVIEWED"
    entry_version: Optional[int] = None
    sequence_version: Optional[int] = None
    sequence: Optional[str] = None
    sequence_length: Optional[int] = None
    functional_description: Optional[str] = None
    active_sites_json: Optional[str] = None
    cross_references_json: Optional[str] = None
    source: Optional[str] = None
    source_version: Optional[str] = None
    retrieved_at: Optional[datetime] = None
    structures: Optional[List[ProteinStructureRead]] = None


# ─── Target & Pest ───────────────────────────────────────────────────────────
class TargetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    gene_name: Optional[str] = None
    uniprot_id: str
    protein_name: Optional[str] = None
    target_type: Optional[str] = None
    organism: str
    organism_id: Optional[str] = None
    moa_scheme: Optional[str] = "IRAC"
    moa_group: Optional[str] = None
    moa_subgroup: Optional[str] = None
    irac_moa_group: Optional[str] = None
    target_class: Optional[str] = None
    structure_source: Optional[str] = "RCSB_PDB"
    protein_sequence: Optional[str] = None
    sequence_length: Optional[int] = None
    functional_description: Optional[str] = None
    resistance_mechanism: Optional[str] = "DIRECT_TARGET"
    evidence_level: Optional[str] = "DIRECT"
    source: Optional[str] = "UniProtKB/Swiss-Prot"
    source_record_id: Optional[str] = None
    source_url: Optional[str] = None
    binding_pocket_residues: Optional[str] = None
    created_at: datetime
    protein_record: Optional[ProteinRecordRead] = None
    structures: Optional[List[ProteinStructureRead]] = None


class PestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    common_name: str
    species_name: str
    generation_time_days: int
    typical_population_size: int
    baseline_mutation_rate: float
    created_at: datetime


# ─── Forecast & Production ML Schemas ─────────────────────────────────────────
class ConformalIntervalSchema(BaseModel):
    alpha: float = 0.10
    q_hat: float
    rr_lower: float
    rr_upper: float


class DomainApplicabilitySchema(BaseModel):
    domain_status: str  # IN_DOMAIN, LOW_SUPPORT, OUT_OF_DOMAIN
    confidence_level: str  # HIGH, MEDIUM, LOW
    max_tanimoto_similarity: float
    moa_represented: bool
    pest_order_represented: bool
    message: str


class ForecastCreate(BaseModel):
    project_id: str
    molecule_id: str
    target_id: str
    pest_id: str
    crop_id: Optional[str] = None
    threat_id: Optional[str] = None
    model_version: Optional[str] = None


class ProductionForecastResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    forecast_id: str
    id: Optional[str] = None
    candidate_id: str
    status: Optional[str] = "COMPLETED"
    compound_identity: Dict[str, Any]
    target_identity: Dict[str, Any]
    model_version: str
    model_algorithm: Optional[str] = "GRADIENT_BOOSTING"
    model_status: Optional[str] = "production"
    prediction: float  # log10(RR)
    resistance_ratio: float  # RR
    durability_horizon: float  # years
    estimated_years_to_resistance: Optional[float] = None
    durability_score: float  # 0.0 - 1.0
    risk_tier: str  # LOW, MODERATE, HIGH, CRITICAL
    prediction_interval: ConformalIntervalSchema
    ood_status: str  # IN_DOMAIN, OUT_OF_DOMAIN
    ood_message: Optional[str] = None
    feature_version: str = "v2.0-ecfp4-descriptors"
    data_version: str = "aprd-resistance-v2"
    created_at: datetime
    risk_trajectory: Optional[List[Dict[str, Any]]] = None
    mutagenesis_hotspots: Optional[List[Dict[str, Any]]] = None


class FeaturePreviewRequest(BaseModel):
    chemical_name: str
    smiles: str
    irac_moa_group: str = "4A"
    pest_name: str = "Myzus persicae"
    pest_order: str = "Hemiptera"
    bioassay_method: str = "Leaf-Dip"


class FeaturePreviewResponse(BaseModel):
    total_features: int = 1052
    feature_version: str = "v2.0-ecfp4-descriptors"
    ecfp4_bits_active: int
    active_bit_indices: List[int]
    physicochemical_descriptors: Dict[str, float]
    biological_features: Dict[str, Any]


class ForecastRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    molecule_id: str
    target_id: str
    pest_id: str
    status: ForecastStatus
    durability_score: Optional[float] = None
    estimated_years_to_resistance: Optional[float] = None
    risk_tier: Optional[RiskTier] = None
    binding_affinity_kcal_mol: Optional[float] = None
    risk_trajectory_json: Optional[str] = None
    mutagenesis_hotspots_json: Optional[str] = None
    model_version: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    # Nested relationships if loaded
    molecule: Optional[MoleculeRead] = None
    target: Optional[TargetRead] = None
    pest: Optional[PestRead] = None


# ─── Project ─────────────────────────────────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    name: str
    description: Optional[str] = None
    status: ProjectStatus
    created_at: datetime
    forecast_count: Optional[int] = 0
    avg_durability: Optional[float] = 0.0


# ─── Backtest ────────────────────────────────────────────────────────────────
class BacktestCaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    pesticide_name: str
    aprd_id: str
    pest_name: str
    target_name: str
    deployment_year: int
    actual_years: float
    predicted_years: float
    error_margin: float
    source: str
    created_at: datetime


class BacktestAccuracySummary(BaseModel):
    total_cases: int
    mean_absolute_error: float
    within_1yr_pct: float
    within_3yr_pct: float
    within_5yr_pct: float
    model_version: str
    cases: List[BacktestCaseRead]


# ─── Reports ─────────────────────────────────────────────────────────────────
class ReportCreate(BaseModel):
    project_id: str
    format: ReportFormat = ReportFormat.PDF


class ReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    file_name: str
    format: ReportFormat
    size_kb: int
    storage_path: Optional[str] = None
    created_at: datetime


# ─── Dashboard Summary ───────────────────────────────────────────────────────
class DashboardSummary(BaseModel):
    total_projects: int
    total_forecasts: int
    avg_durability_score: float
    validated_cases_count: int
    active_projects: List[ProjectRead]
    recent_forecasts: List[ForecastRead]


# ─── System Health ───────────────────────────────────────────────────────────
class SystemHealth(BaseModel):
    status: str
    version: str
    environment: str
    database_connected: bool
    ml_service_status: str
    timestamp: datetime


# ─── Knowledge Graph Sync & Status ──────────────────────────────────────────
class KnowledgeSyncRequest(BaseModel):
    sync_type: Optional[str] = "ALL"  # ALL, FAO_CROPS, NCBI_TAXONOMY, UNIPROT, RCSB_PDB


class KnowledgeGraphStatusRead(BaseModel):
    status: str
    last_sync_time: Optional[datetime] = None
    total_crops: int
    total_threats: int
    total_targets: int
    total_proteins: int
    total_structures: int
    records_added: int = 0
    records_updated: int = 0
    records_rejected: int = 0
    recent_errors: List[str] = Field(default_factory=list)
