"""
ResistanceIQ — Step 16 Enhancement Automated Test Suite
========================================================
Validates Automated Candidate Molecule Identification:
1. Known chemical search by Name ("Imidacloprid")
2. Known chemical search by PubChem CID (86287518)
3. Known chemical search by CAS number ("138261-41-3")
4. Ambiguous chemical search (multi-candidate disambiguation)
5. Invalid chemical search (zero results handling)
6. Novel / unresolved molecule standardization & RDKit feature generation
7. SDF / MOL file format parsing & valence validation
8. SMILES chemical graph parsing & 2D SVG generation
9. Database cache hit performance
10. External API failure resilience
11. End-to-End Context Cascade: Crop -> Threat -> Target -> Protein -> Structure -> Verified Molecule -> ML Durability Forecast
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import httpx

from app.core.database import Base
from app.models import (
    Crop,
    CropThreat,
    Target,
    Pest,
    ProteinRecord,
    ProteinStructure,
    Molecule,
    PubChemCache,
    Forecast,
    ForecastStatus,
)
from app.ingestion.pubchem_service import PubChemService
from ml.inference.predictor import ResistancePredictor


@pytest.fixture(scope="module")
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


# ─── 1. Known Chemical by Name ──────────────────────────────────────────────
def test_search_known_chemical_by_name(db_session):
    service = PubChemService(db=db_session)
    res = service.search_compounds("Imidacloprid")
    assert res["total_candidates"] >= 1
    # Check resolved compound or top candidate
    cand = res["candidates"][0]
    assert cand["cid"] == 86287518 or "imidacloprid" in cand["name"].lower()
    if res.get("resolved_compound"):
        comp = res["resolved_compound"]
        assert comp["cid"] == 86287518
        assert "C9H10ClN5O2" in comp["molecular_formula"]
        assert comp["molecular_weight"] == 255.66
        assert len(comp["canonical_smiles"]) > 10
        assert comp["source"] == "PubChem"


# ─── 2. Known Chemical by CID ────────────────────────────────────────────────
def test_search_known_chemical_by_cid(db_session):
    service = PubChemService(db=db_session)
    res = service.search_compounds("86287518")
    assert res["total_candidates"] == 1
    assert res["resolved_compound"] is not None
    assert res["resolved_compound"]["cid"] == 86287518
    assert "Imidacloprid" in res["resolved_compound"]["name"]


# ─── 3. Known Chemical by CAS Number ────────────────────────────────────────
def test_search_known_chemical_by_cas(db_session):
    service = PubChemService(db=db_session)
    res = service.search_compounds("138261-41-3")  # CAS for Imidacloprid
    assert res["total_candidates"] >= 1
    assert res["candidates"][0]["cid"] == 86287518


# ─── 4. Ambiguous Chemical Search (Multi-Match) ─────────────────────────────
def test_ambiguous_chemical_search_multi_candidate(db_session):
    service = PubChemService(db=db_session)
    # Pyrethrin maps to multiple CIDs (Pyrethrin I, Pyrethrin II, etc.)
    res = service.search_compounds("pyrethrin")
    assert res["total_candidates"] > 1
    assert res["is_ambiguous"] is True
    assert len(res["candidates"]) > 1
    # Check that candidate summary cards have required preview metadata
    for cand in res["candidates"]:
        assert cand["cid"] > 0
        assert cand["formula"] is not None
        assert cand["molecular_weight"] is not None


# ─── 5. Invalid Chemical Search ─────────────────────────────────────────────
def test_invalid_chemical_search_no_crash(db_session):
    service = PubChemService(db=db_session)
    res = service.search_compounds("nonexistent_fake_pesticide_molecule_xyz_999")
    assert res["total_candidates"] == 0
    assert res["resolved_compound"] is None
    assert "No chemical record found" in res["message"]


# ─── 6. Novel Molecule Standardization & Feature Generation ─────────────────
def test_novel_molecule_standardization(db_session):
    service = PubChemService(db=db_session)
    # Synthetic novel analogue (not registered under this exact canonical form in PubChem)
    novel_smiles = "CC1=CC(=C(C=C1)Cl)NC(=O)C2=CC=C(C=C2)OCC3=CC=CC=C3"
    res = service.resolve_and_validate_structure(
        raw_structure=novel_smiles,
        input_format="SMILES",
        chemical_name="Novel-Synthetic-BW-2241",
    )
    assert res["valid"] is True
    assert res["canonical_smiles"] is not None
    assert res["molecular_weight"] > 300.0
    assert res["logp"] is not None
    assert res["hbd_count"] >= 1
    assert res["hba_count"] >= 1
    assert res["features_ready"] is True
    assert res["standardization_status"] == "STANDARDIZED"


# ─── 7. Chemical Structure Valence & Invalid Format Validation ──────────────
def test_invalid_valence_structure_explanation(db_session):
    service = PubChemService(db=db_session)
    # Hypervalent carbon (5 bonds)
    invalid_smiles = "C(C)(C)(C)(C)(C)Cl"
    res = service.resolve_and_validate_structure(raw_structure=invalid_smiles)
    assert res["valid"] is False
    assert res["error"] is not None
    assert "valence" in res["error"].lower() or "validation" in res["error"].lower()


# ─── 8. SDF / MOL Format Block Parsing ──────────────────────────────────────
def test_mol_block_parsing_and_descriptors(db_session):
    service = PubChemService(db=db_session)
    mol_block = """
     RDKit          2D

  4  3  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2990    0.7500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.5981   -0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    1.2990    2.2500    0.0000 Cl  0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0
  2  3  2  0
  2  4  1  0
M  END
"""
    res = service.resolve_and_validate_structure(
        raw_structure=mol_block,
        input_format="MOL",
        chemical_name="Uploaded-MOL-Sample",
    )
    assert res["valid"] is True
    assert res["canonical_smiles"] is not None
    assert res["molecular_weight"] > 50.0
    assert res["svg_2d"] is not None


# ─── 9. Database Cache Hit Performance ───────────────────────────────────────
def test_pubchem_cache_hit_performance(db_session):
    service = PubChemService(db=db_session)
    # First call queries / caches
    res1 = service.search_compounds("Imidacloprid")
    assert res1["total_candidates"] >= 1

    # Verify record in PubChemCache table
    cached = db_session.query(PubChemCache).filter(PubChemCache.pubchem_cid == 86287518).first()
    assert cached is not None
    assert cached.preferred_name == "Imidacloprid"

    # Second call must hit cache directly without network
    res2 = service.search_compounds("Imidacloprid")
    assert res2["total_candidates"] == 1
    assert res2["resolved_compound"]["cid"] == 86287518
    assert "cache" in res2["message"].lower()


# ─── 10. End-to-End Cascade: Crop -> Target -> Verified Molecule -> ML Forecast
def test_end_to_end_cascade_with_automated_molecule(db_session):
    # Setup Crop
    crop = Crop(
        common_name="Tomato",
        scientific_name="Solanum lycopersicum",
        crop_code="0121",
        ncbi_tax_id=4081,
    )
    db_session.add(crop)
    db_session.flush()

    # Setup Threat
    threat = CropThreat(
        crop_id=crop.id,
        organism_id="pst_aphid_01",
        organism_name="Myzus persicae",
        common_name="Green Peach Aphid",
        ncbi_tax_id=13101,
        relationship="PRIMARY_HOST",
    )
    db_session.add(threat)
    db_session.flush()

    # Setup Target & Protein
    target = Target(
        name="Acetylcholinesterase 1",
        gene_name="ace1",
        uniprot_id="Q9BMJ1",
        organism="Myzus persicae",
        irac_moa_group="1A",
    )
    db_session.add(target)
    db_session.flush()

    # Automatically resolve Candidate Molecule
    service = PubChemService(db=db_session)
    chem_res = service.search_compounds("Imidacloprid")
    comp = chem_res["resolved_compound"] or chem_res["candidates"][0]

    # Persist Molecule record
    molecule = Molecule(
        chemical_name=comp["name"],
        smiles=comp["canonical_smiles"],
        pubchem_cid=comp["cid"],
        molecular_formula=comp.get("formula") or comp.get("molecular_formula"),
        molecular_weight=comp.get("molecular_weight"),
        inchikey=comp.get("inchikey"),
        is_novel=False,
        standardization_status="STANDARDIZED",
        resolution_method="PUBCHEM_NAME_SEARCH",
        provenance_source="PUBCHEM",
    )
    db_session.add(molecule)
    db_session.flush()

    # Run ML Forecast with Ridge Regression v1.0.0-ridge-ecfp4
    predictor = ResistancePredictor()
    pred_result = predictor.predict({
        "chemical_name": molecule.chemical_name,
        "smiles": molecule.smiles,
        "irac_moa_group": target.irac_moa_group,
        "pest_name": threat.organism_name,
        "pest_order": "Hemiptera",
        "bioassay_method": "Leaf-Dip",
    })

    assert pred_result.status in ("COMPLETED", "OUT_OF_DOMAIN")
    assert pred_result.durability_score > 0.0
    assert pred_result.estimated_years_to_resistance > 0.0
    assert pred_result.conformal_interval.rr_lower > 0.0
    assert pred_result.conformal_interval.rr_upper >= pred_result.conformal_interval.rr_lower

    # Persist Forecast
    forecast = Forecast(
        project_id="prj_ache1_series",
        molecule_id=molecule.id,
        target_id=target.id,
        pest_id="pst_aphid_01",
        status=ForecastStatus.COMPLETED,
        durability_score=pred_result.durability_score,
        estimated_years_to_resistance=pred_result.estimated_years_to_resistance,
        risk_tier=pred_result.risk_tier,
        model_version=pred_result.model_version,
    )
    db_session.add(forecast)
    db_session.commit()

    assert forecast.id is not None
