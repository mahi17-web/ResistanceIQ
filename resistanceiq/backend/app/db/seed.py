"""
ResistanceIQ — Development Seed Data Fixture
============================================
IMPORTANT:
This data is explicitly marked as DEVELOPMENT / STAGING SEED DATA.
It provides structured initial records for local testing and UI validation.
It does NOT represent final empirical predictions or deployed ML models.
"""

import json
from datetime import datetime, timezone
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import (
    Organization,
    User,
    UserRole,
    Project,
    ProjectStatus,
    Molecule,
    Target,
    Pest,
    Forecast,
    ForecastStatus,
    RiskTier,
    BacktestCase,
    Report,
    ReportFormat,
    ApiKey,
)
from app.core.config import settings
from sqlalchemy import text


def ensure_schema_upgrades():
    """
    Applies non-destructive schema migrations for missing columns across SQLite and PostgreSQL.
    """
    Base.metadata.create_all(bind=engine)
    is_postgres = "postgres" in engine.dialect.name

    table_columns = {
        "molecules": [
            ("pubchem_cid", "INTEGER"),
            ("iupac_name", "TEXT"),
            ("molecular_formula", "VARCHAR(128)"),
            ("tpsa", "FLOAT"),
            ("rotatable_bonds", "INTEGER"),
            ("inchikey", "VARCHAR(32)"),
            ("inchi", "TEXT"),
            ("is_novel", "BOOLEAN DEFAULT FALSE" if is_postgres else "BOOLEAN DEFAULT 0"),
            ("standardization_status", "VARCHAR(64) DEFAULT 'STANDARDIZED'"),
            ("resolution_method", "VARCHAR(64) DEFAULT 'PUBCHEM_NAME_SEARCH'"),
            ("source_identifier", "VARCHAR(128)"),
            ("conformer_3d_available", "BOOLEAN DEFAULT FALSE" if is_postgres else "BOOLEAN DEFAULT 0"),
            ("synonyms_json", "TEXT"),
            ("svg_2d", "TEXT"),
            ("retrieved_at", "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME"),
        ],
        "crop_threats": [
            ("crop_id", "VARCHAR(64)"),
            ("organism_id", "VARCHAR(64)"),
            ("organism_name", "VARCHAR(128)"),
            ("common_name", "VARCHAR(128)"),
            ("organism_type", "VARCHAR(32) DEFAULT 'insect'"),
            ("ncbi_tax_id", "INTEGER"),
            ("relationship", "VARCHAR(64) DEFAULT 'PRIMARY_HOST'"),
            ("source", "VARCHAR(128)"),
            ("source_record_id", "VARCHAR(128)"),
            ("source_url", "VARCHAR(512)"),
            ("source_version", "VARCHAR(32) DEFAULT '2024.1'"),
            ("evidence_level", "VARCHAR(32) DEFAULT 'DIRECT'"),
            ("confidence_score", "FLOAT DEFAULT 1.0"),
            ("citation", "TEXT"),
            ("retrieved_at", "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME"),
            ("created_at", "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME"),
        ],
        "crops": [
            ("family", "VARCHAR(64)"),
            ("genus", "VARCHAR(64)"),
            ("species", "VARCHAR(64)"),
            ("crop_code", "VARCHAR(32)"),
            ("ncbi_tax_id", "INTEGER"),
            ("taxonomy_status", "VARCHAR(32) DEFAULT 'RESOLVED'"),
            ("taxonomy_rank", "VARCHAR(32) DEFAULT 'species'"),
            ("taxonomy_lineage", "TEXT"),
            ("synonyms", "TEXT"),
            ("source", "VARCHAR(128)"),
            ("source_version", "VARCHAR(32)"),
            ("evidence_level", "VARCHAR(32)"),
            ("retrieved_at", "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME"),
            ("updated_at", "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME"),
        ],
        "targets": [
            ("moa_scheme", "VARCHAR(32)"),
            ("moa_group", "VARCHAR(32)"),
            ("moa_subgroup", "VARCHAR(32)"),
            ("organism_id", "VARCHAR(64)"),
            ("protein_name", "VARCHAR(255)"),
            ("evidence_level", "VARCHAR(32)"),
        ],
        "users": [
            ("first_name", "VARCHAR(64)"),
            ("last_name", "VARCHAR(64)"),
            ("display_name", "VARCHAR(128)"),
            ("email_verified", "BOOLEAN DEFAULT FALSE" if is_postgres else "BOOLEAN DEFAULT 0"),
            ("email_verification_token", "VARCHAR(255)"),
            ("email_verification_expires_at", "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME"),
            ("last_login_at", "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME"),
            ("password_reset_token", "VARCHAR(255)"),
            ("password_reset_expires_at", "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME"),
            ("invitation_token", "VARCHAR(255)"),
            ("invitation_expires_at", "TIMESTAMP WITH TIME ZONE" if is_postgres else "DATETIME"),
        ],
        "activity_logs": [
            ("organization_id", "VARCHAR(36)"),
            ("event_type", "VARCHAR(64)"),
            ("resource_type", "VARCHAR(64)"),
            ("resource_id", "VARCHAR(64)"),
            ("ip_address", "VARCHAR(45)"),
            ("user_agent", "VARCHAR(255)"),
        ],
    }

    with engine.connect() as conn:
        for table, cols in table_columns.items():
            try:
                if is_postgres:
                    for col_name, col_type in cols:
                        try:
                            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                        except Exception as e_col:
                            print(f"PG column check note ({table}.{col_name}): {e_col}")
                else:
                    existing_cols = [row[1] for row in conn.execute(text(f"PRAGMA table_info({table})")).fetchall()]
                    for col_name, col_type in cols:
                        if col_name not in existing_cols:
                            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            except Exception as e_tbl:
                print(f"Note on table migration ({table}): {e_tbl}")


def init_database_and_canonical_graph():
    """
    Ensures all database tables exist and canonical reference data is initialized:
    - FAO Indicative Crop Classification (ICC v1.1)
    - Validated Crop-Threat Associations
    - Curated Biological Target Receptors & UniProt Sequences
    - Macromolecular 3D Structures (PDB / AlphaFold)
    - Canonical Agricultural Pests
    - Standard Baseline Molecules
    This runs in ALL environments on server startup (development, staging, production).
    """
    Base.metadata.create_all(bind=engine)
    ensure_schema_upgrades()

    db = SessionLocal()
    try:
        from app.models import Crop, Pest, Target, Molecule, CropThreat, Project, ProjectStatus
        from app.ingestion.knowledge_graph_builder import KnowledgeGraphBuilder

        # 1. Pests
        if db.query(Pest).count() == 0:
            pests = [
                Pest(
                    id="pst_aphid_01",
                    common_name="Green Peach Aphid",
                    species_name="Myzus persicae",
                    generation_time_days=10,
                    typical_population_size=50000000,
                    baseline_mutation_rate=2.5e-8,
                ),
                Pest(
                    id="pst_mite_02",
                    common_name="Two-Spotted Spider Mite",
                    species_name="Tetranychus urticae",
                    generation_time_days=8,
                    typical_population_size=120000000,
                    baseline_mutation_rate=4.1e-8,
                ),
                Pest(
                    id="pst_moth_03",
                    common_name="Diamondback Moth",
                    species_name="Plutella xylostella",
                    generation_time_days=18,
                    typical_population_size=30000000,
                    baseline_mutation_rate=1.8e-8,
                ),
                Pest(
                    id="pst_bollworm_04",
                    common_name="Cotton Bollworm",
                    species_name="Helicoverpa armigera",
                    generation_time_days=32,
                    typical_population_size=15000000,
                    baseline_mutation_rate=1.2e-8,
                ),
                Pest(
                    id="pst_armyworm_05",
                    common_name="Fall Armyworm",
                    species_name="Spodoptera frugiperda",
                    generation_time_days=28,
                    typical_population_size=20000000,
                    baseline_mutation_rate=1.5e-8,
                ),
                Pest(
                    id="pst_planthopper_07",
                    common_name="Brown Planthopper (BPH)",
                    species_name="Nilaparvata lugens",
                    generation_time_days=25,
                    typical_population_size=40000000,
                    baseline_mutation_rate=2.0e-8,
                ),
            ]
            db.add_all(pests)
            db.commit()

        # 2. Canonical Knowledge Graph (Crops, Threats, Targets, Proteins, Structures)
        if db.query(Crop).count() == 0 or db.query(CropThreat).count() == 0 or db.query(Target).count() == 0:
            print("Initializing Canonical Knowledge Graph (FAO, EPPO, UniProt, RCSB PDB)...")
            builder = KnowledgeGraphBuilder(db=db)
            builder.sync_all("ALL")

        # 3. Baseline Molecules
        if db.query(Molecule).count() == 0:
            molecules = [
                Molecule(
                    id="mol_imidacloprid",
                    chemical_name="Imidacloprid",
                    smiles="C1CN(C(=N1)NC(=O)N)CC2=CN=C(C=C2)Cl",
                    molecular_weight=255.66,
                    logp=0.57,
                    pubchem_cid=86287518,
                    provenance_source="PUBCHEM",
                    standardization_status="STANDARDIZED",
                ),
                Molecule(
                    id="mol_chlorantraniliprole",
                    chemical_name="Chlorantraniliprole",
                    smiles="CC1=C(C(=CC=C1)NC(=O)C2=NN(C(=C2)C3=NC=CC=C3)C4=CC(=CC=C4Cl)Cl)NC(=O)C(C)(C)C",
                    molecular_weight=483.15,
                    logp=2.76,
                    pubchem_cid=644260,
                    provenance_source="PUBCHEM",
                    standardization_status="STANDARDIZED",
                ),
                Molecule(
                    id="mol_abamectin",
                    chemical_name="Abamectin",
                    smiles="CC1CC2CC(C(=O)O2)CC(=CC3C(C(C(=CC4C(C(C(=O)O4)C1O)O)C)O)O)C",
                    molecular_weight=873.09,
                    logp=4.4,
                    pubchem_cid=6434889,
                    provenance_source="PUBCHEM",
                    standardization_status="STANDARDIZED",
                ),
                Molecule(
                    id="mol_spinosad",
                    chemical_name="Spinosad",
                    smiles="CCC1CC=C(C2C1C3C=C(CC3C(=O)O2)C4CC(CC(O4)C)N(C)C)C",
                    molecular_weight=731.98,
                    logp=4.0,
                    pubchem_cid=183015,
                    provenance_source="PUBCHEM",
                    standardization_status="STANDARDIZED",
                ),
            ]
            db.add_all(molecules)
            db.commit()

        # 4. Default Project if none exists
        if db.query(Project).count() == 0:
            default_proj = Project(
                id="prj_ache1_series",
                name="Resistance Discovery Series",
                description="Primary candidate evaluation and resistance forecasting series",
                status=ProjectStatus.ACTIVE,
            )
            db.add(default_proj)
            db.commit()

    except Exception as e:
        print(f"Note during canonical database initialization: {e}")
    finally:
        db.close()


def seed_development_data():
    if not settings.ALLOW_DEV_SEEDING or settings.APP_ENV.lower() == "production":
        return

    ensure_schema_upgrades()
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Organization).first():
            print("Development database already contains base records. Ensuring Knowledge Graph is synchronized...")
            from app.ingestion.knowledge_graph_builder import KnowledgeGraphBuilder
            builder = KnowledgeGraphBuilder(db=db)
            builder.sync_all("ALL")
            return

        print("Seeding ResistanceIQ development database...")

        # 1. Organization
        org = Organization(
            id="org_bindwell_001",
            name="Bindwell BioSciences",
            slug="bindwell-bio",
            plan_tier="ENTERPRISE_PRO",
        )
        db.add(org)

        # 2. Users
        default_pwd = get_password_hash("ResistanceIQ2026!")
        users = [
            User(
                id="usr_001",
                organization_id=org.id,
                email="priya@bindwell.bio",
                hashed_password=default_pwd,
                full_name="Dr. Priya Mehta",
                role=UserRole.ADMIN,
            ),
            User(
                id="usr_002",
                organization_id=org.id,
                email="arjun@bindwell.bio",
                hashed_password=default_pwd,
                full_name="Dr. Arjun Sharma",
                role=UserRole.ANALYST,
            ),
            User(
                id="usr_003",
                organization_id=org.id,
                email="lena@bindwell.bio",
                hashed_password=default_pwd,
                full_name="Dr. Lena Fischer",
                role=UserRole.ANALYST,
            ),
            User(
                id="usr_004",
                organization_id=org.id,
                email="rohan@bindwell.bio",
                hashed_password=default_pwd,
                full_name="Rohan Patel",
                role=UserRole.VIEWER,
            ),
        ]
        db.add_all(users)

        # 3. Targets
        targets = [
            Target(
                id="tgt_ache1_01",
                name="Acetylcholinesterase 1 (AChE1)",
                uniprot_id="Q9BMJ1",
                organism="Myzus persicae",
                structure_source="PDB:1QON / ESMFold",
                binding_pocket_residues=json.dumps(["W86", "G119", "Y133", "E202", "S203", "E334", "H447", "F290"]),
            ),
            Target(
                id="tgt_glucl_02",
                name="Glutamate-gated Chloride Channel (GluCl-α)",
                uniprot_id="Q17342",
                organism="Tetranychus urticae",
                structure_source="PDB:3RHW / AlphaFold2",
                binding_pocket_residues=json.dumps(["G314", "L256", "T285", "I289", "F290"]),
            ),
            Target(
                id="tgt_vgsc_03",
                name="Voltage-Gated Sodium Channel (VGSC Domain II)",
                uniprot_id="Q94759",
                organism="Plutella xylostella",
                structure_source="PDB:6A90 / Homology",
                binding_pocket_residues=json.dumps(["M918", "L1014", "T929", "F1020", "V410"]),
            ),
            Target(
                id="tgt_ryr_04",
                name="Ryanodine Receptor (RyR Transmembrane)",
                uniprot_id="A0A1I9KND8",
                organism="Helicoverpa armigera",
                structure_source="Cryo-EM 3.2Å / PDB:5J8V",
                binding_pocket_residues=json.dumps(["I4790", "G4946", "E4120", "Y4650"]),
            ),
        ]
        db.add_all(targets)

        # 4. Pests
        pests = [
            Pest(
                id="pst_aphid_01",
                common_name="Green Peach Aphid",
                species_name="Myzus persicae",
                generation_time_days=10,
                typical_population_size=50000000,
                baseline_mutation_rate=2.5e-8,
            ),
            Pest(
                id="pst_mite_02",
                common_name="Two-Spotted Spider Mite",
                species_name="Tetranychus urticae",
                generation_time_days=8,
                typical_population_size=120000000,
                baseline_mutation_rate=4.1e-8,
            ),
            Pest(
                id="pst_moth_03",
                common_name="Diamondback Moth",
                species_name="Plutella xylostella",
                generation_time_days=18,
                typical_population_size=30000000,
                baseline_mutation_rate=1.8e-8,
            ),
            Pest(
                id="pst_bollworm_04",
                common_name="Cotton Bollworm",
                species_name="Helicoverpa armigera",
                generation_time_days=32,
                typical_population_size=15000000,
                baseline_mutation_rate=1.2e-8,
            ),
        ]
        db.add_all(pests)

        # 5. Molecules
        molecules = [
            Molecule(
                id="mol_bw_4477a",
                chemical_name="BW-4477A",
                smiles="CC1=CC(=O)N(C1=O)C2=CC=C(C=C2)OC3=NC=C(C=C3)C(F)(F)F",
                molecular_weight=366.25,
                logp=3.12,
                provenance_source="BINDWELL_PIPELINE",
            ),
            Molecule(
                id="mol_bw_2241",
                chemical_name="BW-2241",
                smiles="COC1=CC=C(C=C1)N2C(=O)C3=C(N=C(N3)C4=CC=C(C=C4)Cl)C2=O",
                molecular_weight=412.82,
                logp=3.85,
                provenance_source="BINDWELL_PIPELINE",
            ),
            Molecule(
                id="mol_bw_3109",
                chemical_name="BW-3109",
                smiles="FC(F)(F)C1=CC=C(C=C1)NC(=O)C2=CC(=NO2)C3=CC=CC=C32",
                molecular_weight=350.29,
                logp=2.94,
                provenance_source="BINDWELL_PIPELINE",
            ),
            Molecule(
                id="mol_bw_9921x",
                chemical_name="BW-9921X",
                smiles="CC(C)N1CCN(CC1)C2=NC=C(C=N2)C3=CC=C(C=C3)S(=O)(=O)C(F)(F)F",
                molecular_weight=430.45,
                logp=2.21,
                provenance_source="BINDWELL_PIPELINE",
            ),
        ]
        db.add_all(molecules)

        # 6. Projects
        projects = [
            Project(
                id="prj_ache1_series",
                organization_id=org.id,
                name="AChE1 Inhibitor Series",
                description="Comparative resistance durability analysis of AChE1-targeting novel scaffolds against Myzus persicae.",
                status=ProjectStatus.ACTIVE,
            ),
            Project(
                id="prj_glucl_blockers",
                organization_id=org.id,
                name="GluCl Channel Blockers",
                description="High-affinity allosteric antagonists designed to bypass macrocyclic lactone target-site cross resistance in Tetranychus urticae.",
                status=ProjectStatus.ACTIVE,
            ),
            Project(
                id="prj_pyrethroid_repl",
                organization_id=org.id,
                name="Pyrethroid Replacement",
                description="Next-generation VGSC channel modulators designed to overcome kdr mutation profiles in Plutella xylostella.",
                status=ProjectStatus.COMPLETED,
            ),
        ]
        db.add_all(projects)

        # 7. Forecasts
        curve_4477a = [{"year": y, "resistance_probability": round(0.02 * (1.5 ** y), 3)} for y in range(1, 11)]
        hotspots_4477a = [
            {"residue": "G119S", "delta_delta_g": 3.42, "risk": "critical"},
            {"residue": "F331W", "delta_delta_g": 1.85, "risk": "moderate"},
            {"residue": "F290V", "delta_delta_g": 2.15, "risk": "high"},
            {"residue": "W86A",  "delta_delta_g": 0.45, "risk": "low"},
            {"residue": "Y133F", "delta_delta_g": 0.90, "risk": "low"},
        ]

        forecasts = [
            Forecast(
                id="fc_4477a_01",
                project_id="prj_ache1_series",
                molecule_id="mol_bw_4477a",
                target_id="tgt_ache1_01",
                pest_id="pst_aphid_01",
                status=ForecastStatus.COMPLETED,
                durability_score=0.81,
                estimated_years_to_resistance=8.4,
                risk_tier=RiskTier.LOW,
                binding_affinity_kcal_mol=-9.6,
                risk_trajectory_json=json.dumps(curve_4477a),
                mutagenesis_hotspots_json=json.dumps(hotspots_4477a),
                model_version="v0.3-mvp",
                completed_at=datetime.now(timezone.utc),
            ),
            Forecast(
                id="fc_2241_02",
                project_id="prj_ache1_series",
                molecule_id="mol_bw_2241",
                target_id="tgt_ache1_01",
                pest_id="pst_aphid_01",
                status=ForecastStatus.COMPLETED,
                durability_score=0.58,
                estimated_years_to_resistance=4.7,
                risk_tier=RiskTier.MODERATE,
                binding_affinity_kcal_mol=-8.8,
                risk_trajectory_json=json.dumps([{"year": y, "resistance_probability": round(0.08 * (1.4 ** y), 3)} for y in range(1, 11)]),
                mutagenesis_hotspots_json=json.dumps(hotspots_4477a),
                model_version="v0.3-mvp",
                completed_at=datetime.now(timezone.utc),
            ),
            Forecast(
                id="fc_3109_03",
                project_id="prj_pyrethroid_repl",
                molecule_id="mol_bw_3109",
                target_id="tgt_vgsc_03",
                pest_id="pst_moth_03",
                status=ForecastStatus.COMPLETED,
                durability_score=0.43,
                estimated_years_to_resistance=3.1,
                risk_tier=RiskTier.HIGH,
                binding_affinity_kcal_mol=-7.9,
                risk_trajectory_json=json.dumps([{"year": y, "resistance_probability": round(0.14 * (1.35 ** y), 3)} for y in range(1, 11)]),
                mutagenesis_hotspots_json=json.dumps(hotspots_4477a),
                model_version="v0.3-mvp",
                completed_at=datetime.now(timezone.utc),
            ),
            Forecast(
                id="fc_9921x_04",
                project_id="prj_glucl_blockers",
                molecule_id="mol_bw_9921x",
                target_id="tgt_glucl_02",
                pest_id="pst_mite_02",
                status=ForecastStatus.COMPLETED,
                durability_score=0.69,
                estimated_years_to_resistance=6.8,
                risk_tier=RiskTier.LOW,
                binding_affinity_kcal_mol=-9.1,
                risk_trajectory_json=json.dumps([{"year": y, "resistance_probability": round(0.04 * (1.45 ** y), 3)} for y in range(1, 11)]),
                mutagenesis_hotspots_json=json.dumps(hotspots_4477a),
                model_version="v0.3-mvp",
                completed_at=datetime.now(timezone.utc),
            ),
        ]
        db.add_all(forecasts)

        # 8. Historical Backtest Benchmark Dataset
        backtest_cases = [
            BacktestCase(id="bc_01", pesticide_name="Pirimicarb", aprd_id="APRD-0042", pest_name="Myzus persicae", target_name="AChE1", deployment_year=1970, actual_years=5.2, predicted_years=4.8, error_margin=-0.4, source="APRD"),
            BacktestCase(id="bc_02", pesticide_name="Imidacloprid", aprd_id="APRD-0118", pest_name="Myzus persicae", target_name="nAChR", deployment_year=1991, actual_years=9.1, predicted_years=8.3, error_margin=-0.8, source="APRD"),
            BacktestCase(id="bc_03", pesticide_name="Abamectin", aprd_id="APRD-0205", pest_name="Tetranychus urticae", target_name="GluCl", deployment_year=1985, actual_years=4.0, predicted_years=4.9, error_margin=0.9, source="APRD"),
            BacktestCase(id="bc_04", pesticide_name="Permethrin", aprd_id="APRD-0311", pest_name="Plutella xylostella", target_name="VGSC", deployment_year=1977, actual_years=2.8, predicted_years=3.4, error_margin=0.6, source="APRD"),
            BacktestCase(id="bc_05", pesticide_name="Chlorantraniliprole", aprd_id="APRD-0489", pest_name="Plutella xylostella", target_name="RyR", deployment_year=2008, actual_years=6.5, predicted_years=5.8, error_margin=-0.7, source="IRAC"),
            BacktestCase(id="bc_06", pesticide_name="Spiromesifen", aprd_id="APRD-0512", pest_name="Tetranychus urticae", target_name="ACC", deployment_year=2004, actual_years=7.0, predicted_years=7.6, error_margin=0.6, source="IRAC"),
            BacktestCase(id="bc_07", pesticide_name="Diazinon", aprd_id="APRD-0019", pest_name="Musca domestica", target_name="AChE1", deployment_year=1953, actual_years=3.5, predicted_years=4.6, error_margin=1.1, source="APRD"),
            BacktestCase(id="bc_08", pesticide_name="DDT", aprd_id="APRD-0001", pest_name="Musca domestica", target_name="VGSC", deployment_year=1945, actual_years=2.0, predicted_years=3.1, error_margin=1.1, source="APRD"),
        ]
        db.add_all(backtest_cases)

        # 9. Reports
        reports = [
            Report(id="rep_01", project_id="prj_ache1_series", file_name="AChE1_Resistance_Report_2026.pdf", format=ReportFormat.PDF, size_kb=245),
            Report(id="rep_02", project_id="prj_glucl_blockers", file_name="GluCl_Resistance_Data_2026.csv", format=ReportFormat.CSV, size_kb=38),
            Report(id="rep_03", project_id="prj_pyrethroid_repl", file_name="Pyrethroid_Replacement_Analysis.pdf", format=ReportFormat.PDF, size_kb=182),
        ]
        db.add_all(reports)

        # 10. API Keys
        api_keys = [
            ApiKey(id="key_prod_01", organization_id=org.id, name="Production Pipeline Key", key_prefix="riq_prod_sk", hashed_key=get_password_hash("riq_prod_sk_secret")),
            ApiKey(id="key_dev_02", organization_id=org.id, name="Development SDK Key", key_prefix="riq_dev_sk", hashed_key=get_password_hash("riq_dev_sk_secret")),
        ]
        db.add_all(api_keys)

        db.commit()
        print("ResistanceIQ development seed data successfully populated.")

        # 11. Synchronize Authoritative Scientific Knowledge Graph (Step 16)
        print("Synchronizing Authoritative Scientific Knowledge Graph (FAO, NCBI, UniProt, RCSB PDB)...")
        from app.ingestion.knowledge_graph_builder import KnowledgeGraphBuilder
        builder = KnowledgeGraphBuilder(db=db)
        builder.sync_all("ALL")
        print("Knowledge Graph synchronization complete.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_development_data()
