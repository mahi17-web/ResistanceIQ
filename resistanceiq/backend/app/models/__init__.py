from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column,
    String,
    Text,
    Float,
    Integer,
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship, relationship as orm_relationship
import enum
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    RESEARCHER = "RESEARCHER"
    ANALYST = "ANALYST"
    VIEWER = "VIEWER"


class ProjectStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    COMPLETED = "COMPLETED"


class RiskTier(str, enum.Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ForecastStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ReportFormat(str, enum.Enum):
    PDF = "PDF"
    CSV = "CSV"


class IngestionStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# ─── 1. Organization ────────────────────────────────────────────────────────
class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(128), nullable=False)
    slug = Column(String(128), unique=True, nullable=False, index=True)
    plan_tier = Column(String(32), default="ENTERPRISE_PRO")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="organization", cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", back_populates="organization", cascade="all, delete-orphan")

    @property
    def plan(self) -> str:
        return self.plan_tier


# ─── 2. User ────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(64), nullable=True)
    last_name = Column(String(64), nullable=True)
    display_name = Column(String(128), nullable=True)
    full_name = Column(String(128), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.ANALYST, nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    email_verified = Column(Boolean, default=False, index=True)
    email_verification_token = Column(String(255), nullable=True, index=True)
    email_verification_expires_at = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    password_reset_token = Column(String(255), nullable=True, index=True)
    password_reset_expires_at = Column(DateTime(timezone=True), nullable=True)
    invitation_token = Column(String(255), nullable=True, index=True)
    invitation_expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    organization = relationship("Organization", back_populates="users")
    activity_logs = relationship("ActivityLog", back_populates="user")

    @property
    def is_verified(self) -> bool:
        return self.email_verified


# ─── 3. Project ─────────────────────────────────────────────────────────────
class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    organization = relationship("Organization", back_populates="projects")
    forecasts = relationship("Forecast", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")


# ─── 4. Molecule ────────────────────────────────────────────────────────────
class Molecule(Base):
    __tablename__ = "molecules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    chemical_name = Column(String(255), nullable=False, index=True)
    smiles = Column(Text, nullable=False)
    pubchem_cid = Column(Integer, nullable=True, index=True)
    iupac_name = Column(Text, nullable=True)
    molecular_formula = Column(String(128), nullable=True)
    molecular_weight = Column(Float, nullable=True)
    logp = Column(Float, nullable=True)
    tpsa = Column(Float, nullable=True)
    hbd_count = Column(Integer, nullable=True)
    hba_count = Column(Integer, nullable=True)
    rotatable_bonds = Column(Integer, nullable=True)
    inchikey = Column(String(32), nullable=True, index=True)
    inchi = Column(Text, nullable=True)
    is_novel = Column(Boolean, default=False)
    standardization_status = Column(String(64), default="STANDARDIZED")
    resolution_method = Column(String(64), default="PUBCHEM_NAME_SEARCH")
    source_identifier = Column(String(128), nullable=True)
    conformer_3d_available = Column(Boolean, default=False)
    synonyms_json = Column(Text, nullable=True)  # JSON array
    svg_2d = Column(Text, nullable=True)
    provenance_source = Column(String(64), default="PUBCHEM")
    retrieved_at = Column(DateTime(timezone=True), default=utc_now)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    forecasts = relationship("Forecast", back_populates="molecule")


# ─── 5. Target ──────────────────────────────────────────────────────────────
class Target(Base):
    __tablename__ = "targets"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, index=True)
    gene_name = Column(String(64), nullable=True, index=True)
    uniprot_id = Column(String(32), nullable=False, index=True)
    protein_name = Column(String(255), nullable=True)
    target_type = Column(String(64), nullable=True)
    organism = Column(String(128), nullable=False)
    organism_id = Column(String(64), nullable=True, index=True)
    moa_scheme = Column(String(16), default="IRAC", index=True)  # IRAC, HRAC, FRAC, NONE
    moa_group = Column(String(32), nullable=True, index=True)
    moa_subgroup = Column(String(32), nullable=True)
    irac_moa_group = Column(String(16), nullable=True, index=True)
    target_class = Column(String(64), nullable=True, index=True)
    structure_source = Column(String(64), default="RCSB_PDB")
    protein_sequence = Column(Text, nullable=True)
    sequence_length = Column(Integer, nullable=True)
    functional_description = Column(Text, nullable=True)
    resistance_mechanism = Column(String(64), default="DIRECT_TARGET", index=True)  # DIRECT_TARGET, METABOLIC_RESISTANCE, PHYSIOLOGICAL, OTHER
    evidence_level = Column(String(32), default="DIRECT")  # DIRECT, SUPPORTED, INFERRED, UNRESOLVED
    source = Column(String(64), default="UniProtKB/Swiss-Prot")
    source_record_id = Column(String(128), nullable=True)
    source_url = Column(String(512), nullable=True)
    binding_pocket_residues = Column(Text, nullable=True)  # JSON formatted array
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    forecasts = relationship("Forecast", back_populates="target")
    structures = relationship("ProteinStructure", back_populates="target", cascade="all, delete-orphan")
    protein_record = relationship("ProteinRecord", back_populates="target", uselist=False, cascade="all, delete-orphan")


# ─── 6. Pest ────────────────────────────────────────────────────────────────
class Pest(Base):
    __tablename__ = "pests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    common_name = Column(String(128), nullable=False)
    species_name = Column(String(128), nullable=False)
    generation_time_days = Column(Integer, nullable=False)
    typical_population_size = Column(BigInteger, nullable=False)
    baseline_mutation_rate = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    forecasts = relationship("Forecast", back_populates="pest")


# ─── 7. Forecast ────────────────────────────────────────────────────────────
class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    molecule_id = Column(String(36), ForeignKey("molecules.id"), nullable=False, index=True)
    target_id = Column(String(36), ForeignKey("targets.id"), nullable=False, index=True)
    pest_id = Column(String(36), ForeignKey("pests.id"), nullable=False, index=True)
    status = Column(SQLEnum(ForecastStatus), default=ForecastStatus.PENDING, nullable=False)
    
    durability_score = Column(Float, nullable=True)
    estimated_years_to_resistance = Column(Float, nullable=True)
    risk_tier = Column(SQLEnum(RiskTier), nullable=True)
    binding_affinity_kcal_mol = Column(Float, nullable=True)
    risk_trajectory_json = Column(Text, nullable=True)
    mutagenesis_hotspots_json = Column(Text, nullable=True)
    model_version = Column(String(32), default="v0.3-mvp")
    
    created_at = Column(DateTime(timezone=True), default=utc_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="forecasts")
    molecule = relationship("Molecule", back_populates="forecasts")
    target = relationship("Target", back_populates="forecasts")
    pest = relationship("Pest", back_populates="forecasts")


# ─── 8. Backtest Case ───────────────────────────────────────────────────────
class BacktestCase(Base):
    __tablename__ = "backtest_cases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    pesticide_name = Column(String(128), nullable=False)
    aprd_id = Column(String(32), nullable=False, index=True)
    pest_name = Column(String(128), nullable=False)
    target_name = Column(String(128), nullable=False)
    deployment_year = Column(Integer, nullable=False)
    actual_years = Column(Float, nullable=False)
    predicted_years = Column(Float, nullable=False)
    error_margin = Column(Float, nullable=False)
    source = Column(String(32), default="APRD")
    created_at = Column(DateTime(timezone=True), default=utc_now)


# ─── 9. Report ──────────────────────────────────────────────────────────────
class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    format = Column(SQLEnum(ReportFormat), default=ReportFormat.PDF, nullable=False)
    size_kb = Column(Integer, default=120)
    storage_path = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    project = relationship("Project", back_populates="reports")


# ─── 10. API Key ────────────────────────────────────────────────────────────
class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    key_prefix = Column(String(16), nullable=False)
    hashed_key = Column(String(255), nullable=False)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    organization = relationship("Organization", back_populates="api_keys")


# ─── 11. Activity Log / Audit Logs ──────────────────────────────────────────
class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True, index=True)
    action = Column(String(64), nullable=False, index=True)
    event_type = Column(String(64), nullable=True, index=True)
    resource_type = Column(String(64), nullable=True)
    resource_id = Column(String(64), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    user = relationship("User", back_populates="activity_logs")
    organization = relationship("Organization")


# ═════════════════════════════════════════════════════════════════════════════
# ─── SCIENTIFIC DATA INGESTION & PROVENANCE LAYER (STEP 3) ─────────────────
# ═════════════════════════════════════════════════════════════════════════════

# ─── 12. Data Source Registry ───────────────────────────────────────────────
class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(String(64), primary_key=True)  # e.g., "APRD", "IRAC", "CHEMBL"
    name = Column(String(128), nullable=False)
    organization = Column(String(128), nullable=False)
    url = Column(String(512), nullable=False)
    license = Column(String(128), nullable=False)
    access_method = Column(String(64), nullable=False)  # "PUBLIC_SEARCH", "DIRECT_DOWNLOAD", "REST_API"
    source_type = Column(String(64), nullable=False)   # "RESISTANCE_REGISTRY", "TAXONOMY", "BIOASSAY"
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    versions = relationship("DatasetVersion", back_populates="source", cascade="all, delete-orphan")
    cases = relationship("ResistanceCase", back_populates="source")


# ─── 13. Dataset Version Tracking ───────────────────────────────────────────
class DatasetVersion(Base):
    __tablename__ = "dataset_versions"

    id = Column(String(64), primary_key=True)  # e.g., "APRD-2026.1", "IRAC-MOA-V11.1"
    data_source_id = Column(String(64), ForeignKey("data_sources.id"), nullable=False, index=True)
    dataset_name = Column(String(128), nullable=False)
    version = Column(String(32), nullable=False)
    retrieved_at = Column(DateTime(timezone=True), default=utc_now)
    checksum = Column(String(64), nullable=False)  # SHA-256
    record_count = Column(Integer, default=0)
    status = Column(String(32), default="ACTIVE")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    source = relationship("DataSource", back_populates="versions")
    ingestion_runs = relationship("IngestionRun", back_populates="dataset_version", cascade="all, delete-orphan")
    cases = relationship("ResistanceCase", back_populates="dataset_version")


# ─── 14. Ingestion Run Audit ────────────────────────────────────────────────
class IngestionRun(Base):
    __tablename__ = "ingestion_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dataset_version_id = Column(String(64), ForeignKey("dataset_versions.id"), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), default=utc_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(SQLEnum(IngestionStatus), default=IngestionStatus.PENDING, nullable=False)
    records_seen = Column(Integer, default=0)
    records_accepted = Column(Integer, default=0)
    records_rejected = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    log_location = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    dataset_version = relationship("DatasetVersion", back_populates="ingestion_runs")
    cases = relationship("ResistanceCase", back_populates="ingestion_run")
    rejections = relationship("DataQualityRejection", back_populates="ingestion_run", cascade="all, delete-orphan")


# ─── 15. Canonical Organism ─────────────────────────────────────────────────
class CanonicalOrganism(Base):
    __tablename__ = "canonical_organisms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    original_name = Column(String(255), nullable=False)
    canonical_name = Column(String(255), nullable=False, index=True)
    scientific_name = Column(String(255), nullable=False)
    common_name = Column(String(255), nullable=True)
    genus = Column(String(128), nullable=True)
    species = Column(String(128), nullable=True)
    family = Column(String(128), nullable=True)
    order = Column(String(128), nullable=True)
    ncbi_taxid = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    cases = relationship("ResistanceCase", back_populates="organism")


# ─── 16. Canonical Pesticide ────────────────────────────────────────────────
class CanonicalPesticide(Base):
    __tablename__ = "canonical_pesticides"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    original_name = Column(String(255), nullable=False)
    active_ingredient = Column(String(255), nullable=False, index=True)
    cas_number = Column(String(32), nullable=True, index=True)
    irac_moa_group = Column(String(16), nullable=True, index=True)  # e.g. "4A", "1B"
    chemical_class = Column(String(128), nullable=True)
    source_identifier = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    cases = relationship("ResistanceCase", back_populates="pesticide")


# ─── 17. Canonical Resistance Case ──────────────────────────────────────────
class ResistanceCase(Base):
    __tablename__ = "resistance_cases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organism_id = Column(String(36), ForeignKey("canonical_organisms.id"), nullable=False, index=True)
    pesticide_id = Column(String(36), ForeignKey("canonical_pesticides.id"), nullable=False, index=True)
    
    resistance_year = Column(Integer, nullable=True, index=True)
    publication_year = Column(Integer, nullable=True)
    country = Column(String(64), nullable=True, index=True)
    location = Column(String(255), nullable=True)
    resistance_type = Column(String(128), nullable=True)  # e.g., "Field Control Failure", "Laboratory Selection"
    
    source_id = Column(String(64), ForeignKey("data_sources.id"), nullable=False, index=True)
    source_record_id = Column(String(128), nullable=False, index=True)
    reference = Column(Text, nullable=True)
    
    bioassay_method = Column(String(128), nullable=True)
    resistance_ratio = Column(Float, nullable=True)
    susceptible_baseline = Column(Float, nullable=True)
    is_duplicate_candidate = Column(Boolean, default=False)
    
    dataset_version_id = Column(String(64), ForeignKey("dataset_versions.id"), nullable=False, index=True)
    ingestion_run_id = Column(String(36), ForeignKey("ingestion_runs.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    organism = relationship("CanonicalOrganism", back_populates="cases")
    pesticide = relationship("CanonicalPesticide", back_populates="cases")
    source = relationship("DataSource", back_populates="cases")
    dataset_version = relationship("DatasetVersion", back_populates="cases")
    ingestion_run = relationship("IngestionRun", back_populates="cases")


# ─── 18. Data Quality Rejection Quarantine ──────────────────────────────────
class DataQualityRejection(Base):
    __tablename__ = "data_quality_rejections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ingestion_run_id = Column(String(36), ForeignKey("ingestion_runs.id"), nullable=False, index=True)
    source_record_id = Column(String(128), nullable=True)
    raw_payload = Column(Text, nullable=False)
    rejection_reason = Column(String(255), nullable=False)
    error_code = Column(String(64), nullable=False, index=True)
    stage = Column(String(32), default="VALIDATION")
    rejected_at = Column(DateTime(timezone=True), default=utc_now)

    ingestion_run = relationship("IngestionRun", back_populates="rejections")


# ═════════════════════════════════════════════════════════════════════════════
# ─── STEP 16: AUTOMATED CROP → THREAT → TARGET → STRUCTURE GRAPH ────────────
# ═════════════════════════════════════════════════════════════════════════════

# ─── 19. Canonical Crop Master ──────────────────────────────────────────────
class Crop(Base):
    __tablename__ = "crops"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    common_name = Column(String(128), nullable=False, index=True)
    scientific_name = Column(String(128), nullable=False, index=True)
    family = Column(String(64), nullable=True)
    genus = Column(String(64), nullable=True)
    species = Column(String(64), nullable=True)
    crop_code = Column(String(32), nullable=True, index=True)  # FAO ICC
    ncbi_tax_id = Column(Integer, nullable=True, index=True)
    taxonomy_status = Column(String(32), default="RESOLVED")  # RESOLVED or UNRESOLVED
    taxonomy_rank = Column(String(32), default="species")
    taxonomy_lineage = Column(Text, nullable=True)  # JSON formatted array
    synonyms = Column(Text, nullable=True)  # JSON formatted array
    source = Column(String(128), default="FAO Indicative Crop Classification (ICC) v1.1")
    source_version = Column(String(32), default="ICC-1.1-2020")
    evidence_level = Column(String(32), default="OFFICIAL_FAO_CLASSIFICATION")
    retrieved_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    threats = relationship("CropThreat", back_populates="crop", cascade="all, delete-orphan")


# ─── 20. Crop Threat Association ────────────────────────────────────────────
class CropThreat(Base):
    __tablename__ = "crop_threats"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    crop_id = Column(String(64), ForeignKey("crops.id"), nullable=False, index=True)
    organism_id = Column(String(64), nullable=False, index=True)  # Links to Pest.id / CanonicalOrganism.id
    organism_name = Column(String(128), nullable=False, index=True)
    common_name = Column(String(128), nullable=True)
    organism_type = Column(String(32), default="insect")  # insect, arachnid, fungus, bacterium, virus, nematode, weed
    ncbi_tax_id = Column(Integer, nullable=True, index=True)
    relationship = Column(String(64), default="PRIMARY_HOST")  # PRIMARY_HOST, SECONDARY_HOST, VECTOR
    source = Column(String(128), default="EPPO Global Database / CABI CPC")
    source_record_id = Column(String(128), nullable=True)
    source_url = Column(String(512), nullable=True)
    source_version = Column(String(32), default="2024.1")
    evidence_level = Column(String(32), default="DIRECT")  # DIRECT, SUPPORTED, INFERRED, UNRESOLVED
    confidence_score = Column(Float, default=1.0)
    citation = Column(Text, nullable=True)
    retrieved_at = Column(DateTime(timezone=True), default=utc_now)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    crop = orm_relationship("Crop", back_populates="threats")


# ─── 21. Protein Record ─────────────────────────────────────────────────────
class ProteinRecord(Base):
    __tablename__ = "protein_records"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    uniprot_accession = Column(String(32), unique=True, nullable=False, index=True)
    target_id = Column(String(64), ForeignKey("targets.id"), nullable=True, index=True)
    protein_name = Column(String(255), nullable=False)
    gene_primary = Column(String(64), nullable=True)
    organism_name = Column(String(128), nullable=False)
    ncbi_tax_id = Column(Integer, nullable=True)
    review_status = Column(String(32), default="REVIEWED", index=True)  # REVIEWED (Swiss-Prot) or UNREVIEWED (TrEMBL)
    entry_version = Column(Integer, nullable=True)
    sequence_version = Column(Integer, nullable=True)
    sequence = Column(Text, nullable=True)
    sequence_length = Column(Integer, nullable=True)
    functional_description = Column(Text, nullable=True)
    active_sites_json = Column(Text, nullable=True)  # JSON formatted (active_site, binding_site, functional_site, resistance_mutation_site)
    cross_references_json = Column(Text, nullable=True)  # JSON formatted
    source = Column(String(64), default="UniProtKB/Swiss-Prot")
    source_version = Column(String(32), default="2024_04")
    retrieved_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    target = relationship("Target", back_populates="protein_record")
    structures = relationship("ProteinStructure", back_populates="protein_record", cascade="all, delete-orphan")


# ─── 22. Protein Structure ──────────────────────────────────────────────────
class ProteinStructure(Base):
    __tablename__ = "protein_structures"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    target_id = Column(String(64), ForeignKey("targets.id"), nullable=False, index=True)
    protein_record_id = Column(String(64), ForeignKey("protein_records.id"), nullable=True, index=True)
    uniprot_accession = Column(String(32), nullable=False, index=True)
    pdb_id = Column(String(32), nullable=True, index=True)  # e.g., "1QON", "3RHW", "6A95"
    entity_id = Column(String(16), default="1")
    chain_id = Column(String(16), default="A")
    structure_type = Column(String(32), nullable=False)  # EXPERIMENTAL, COMPUTED, UNAVAILABLE
    structure_source = Column(String(64), nullable=False)  # RCSB_PDB, ALPHAFOLD_DB, ESMFOLD
    experimental_method = Column(String(64), nullable=True)  # X-RAY DIFFRACTION, CRYO-EM, COMPUTED_ALPHAFOLD2
    resolution = Column(Float, nullable=True)  # In Angstroms (e.g. 2.20)
    mapping_evidence = Column(String(64), default="EXACT_SPECIES_MATCH", index=True)  # EXACT_SPECIES_MATCH, HOMOLOGY_MODEL, ISOFORM_ALIGNMENT, COMPUTED_ALPHAFOLD2, UNAVAILABLE
    structure_url = Column(String(512), nullable=True)
    cif_url = Column(String(512), nullable=True)
    alphafold_model_url = Column(String(512), nullable=True)
    retrieval_date = Column(DateTime(timezone=True), default=utc_now)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    target = relationship("Target", back_populates="structures")
    protein_record = relationship("ProteinRecord", back_populates="structures")


# ─── 23. Knowledge Sync Audit ───────────────────────────────────────────────
class KnowledgeSyncAudit(Base):
    __tablename__ = "knowledge_sync_audits"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    sync_type = Column(String(64), nullable=False)  # ALL, FAO_CROPS, NCBI_TAXONOMY, UNIPROT, RCSB_PDB
    status = Column(String(32), default="COMPLETED")  # COMPLETED, FAILED, PARTIAL
    records_added = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    records_rejected = Column(Integer, default=0)
    error_log = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), default=utc_now)
    completed_at = Column(DateTime(timezone=True), default=utc_now)


# ─── 24. PubChem Local Database Cache ───────────────────────────────────────
class PubChemCache(Base):
    __tablename__ = "pubchem_cache"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    query_key = Column(String(255), nullable=False, index=True)  # Normalized search term or InChIKey/CID
    pubchem_cid = Column(Integer, nullable=False, index=True)
    preferred_name = Column(String(255), nullable=False, index=True)
    iupac_name = Column(Text, nullable=True)
    molecular_formula = Column(String(128), nullable=True)
    molecular_weight = Column(Float, nullable=True)
    canonical_smiles = Column(Text, nullable=False)
    isomeric_smiles = Column(Text, nullable=True)
    inchikey = Column(String(32), nullable=True, index=True)
    inchi = Column(Text, nullable=True)
    xlogp = Column(Float, nullable=True)
    hbd_count = Column(Integer, nullable=True)
    hba_count = Column(Integer, nullable=True)
    rotatable_bonds = Column(Integer, nullable=True)
    synonyms_json = Column(Text, nullable=True)  # JSON array
    has_3d_conformer = Column(Boolean, default=False)
    raw_properties_json = Column(Text, nullable=True)  # JSON blob
    svg_2d = Column(Text, nullable=True)
    retrieved_at = Column(DateTime(timezone=True), default=utc_now)
    created_at = Column(DateTime(timezone=True), default=utc_now)


# ─── 25. Password Reset Codes & Verification Tokens ─────────────────────────
class PasswordResetCode(Base):
    __tablename__ = "password_reset_codes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    code_hash = Column(String(255), nullable=False, index=True)
    reset_token_hash = Column(String(255), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    attempt_count = Column(Integer, default=0, nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    used_at = Column(DateTime(timezone=True), nullable=True, index=True)
    request_id = Column(String(64), nullable=False, index=True)
    ip_hash = Column(String(64), nullable=True)

    user = relationship("User", backref="reset_codes")

