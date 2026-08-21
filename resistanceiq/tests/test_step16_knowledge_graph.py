"""
ResistanceIQ — Step 16 Knowledge Graph Automated Test Suite
===========================================================
Verifies:
1. Canonical FAO Crop Ingestion & NCBI Taxonomy Resolver
2. UniProtKB Integration & IUPAC Sequence Validation
3. RCSB PDB & AlphaFold Structure Prioritization Hierarchy
4. Data Quality Validation Engine & Deduplication
5. REST API Endpoints (/crops, /targets/protein, /targets/structures, /admin/knowledge-graph)
6. End-to-End Cascade: Crop -> Threat -> Target -> Protein -> Structure -> Molecule -> ML Forecast
"""

import pytest
from app.models import Crop, CropThreat, Target, ProteinRecord, ProteinStructure, KnowledgeSyncAudit
from app.ingestion.ncbi_resolver import NCBITaxonomyResolver
from app.ingestion.uniprot_service import UniProtService
from app.ingestion.rcsb_structure_service import ProteinStructureService
from app.ingestion.data_quality_validator import DataQualityValidator
from app.ingestion.knowledge_graph_builder import KnowledgeGraphBuilder


# ─── 1. NCBI Taxonomy Resolver Tests ────────────────────────────────────────
def test_ncbi_resolver_known_taxon():
    resolver = NCBITaxonomyResolver()
    res = resolver.resolve("Solanum lycopersicum")
    assert res["taxonomy_status"] == "RESOLVED"
    assert res["ncbi_tax_id"] == 4081
    assert "Solanaceae" in res["taxonomy_lineage"]


def test_ncbi_resolver_unresolved_taxon():
    resolver = NCBITaxonomyResolver()
    res = resolver.resolve("Nonexistentus fake_crop_species_999")
    assert res["taxonomy_status"] == "UNRESOLVED"
    assert res["ncbi_tax_id"] is None


# ─── 2. UniProt Service & IUPAC Sequence Validation Tests ────────────────────
def test_uniprot_accession_validation():
    assert UniProtService.validate_accession("Q9BMJ1") is True
    assert UniProtService.validate_accession("Q17342") is True
    assert UniProtService.validate_accession("P25123") is True
    assert UniProtService.validate_accession("INVALID_ACCESSION_XYZ") is False
    assert UniProtService.validate_accession("") is False


def test_protein_sequence_canonical_validation():
    valid_seq = "MVVTIKGGLEEPVRAVSSSF"
    invalid_seq = "MVVTIK123!@#BZX"
    assert UniProtService.validate_sequence(valid_seq) is True
    assert UniProtService.validate_sequence(invalid_seq) is False


def test_uniprot_fetch_protein_record():
    service = UniProtService()
    record = service.fetch_protein("Q9BMJ1")
    assert record["uniprot_accession"] == "Q9BMJ1"
    assert "Carboxylic ester hydrolase" in record["protein_name"] or "Acetylcholinesterase" in record["protein_name"]
    assert record["sequence_length"] in (647, 676)
    assert len(record["active_sites"]) > 0


# ─── 3. Structure Prioritization Hierarchy Tests ─────────────────────────────
def test_structure_prioritization_hierarchy():
    service = ProteinStructureService()
    # AChE1 has both PDB:1QON (Experimental) and AlphaFold (Computed)
    structs = service.resolve_structures("Q9BMJ1")
    assert len(structs) >= 2
    # Priority 1 must be EXPERIMENTAL
    assert structs[0]["structure_type"] == "EXPERIMENTAL"
    assert structs[0]["pdb_id"] == "1QON"
    assert structs[0]["resolution"] == 2.20

    # RDL structure resolution
    rdl_structs = service.resolve_structures("P25123")
    assert rdl_structs[0]["structure_type"] in ["COMPUTED", "EXPERIMENTAL"]

    # Unknown protein returns explicitly UNAVAILABLE (zero fabrication)
    unknown_structs = service.resolve_structures("Q9UNKNOWN1")
    assert unknown_structs[0]["structure_type"] == "UNAVAILABLE"
    assert unknown_structs[0]["pdb_id"] is None


# ─── 4. Data Quality Validator Tests ─────────────────────────────────────────
def test_data_quality_crop_validator():
    valid_crop = {
        "scientific_name": "Solanum lycopersicum",
        "common_name": "Tomato",
        "crop_code": "0121",
        "ncbi_tax_id": 4081,
        "taxonomy_status": "RESOLVED",
    }
    is_valid, issues = DataQualityValidator.validate_crop_record(valid_crop)
    assert is_valid is True
    assert len(issues) == 0

    invalid_crop = {"scientific_name": "", "common_name": "Fake", "crop_code": ""}
    is_valid_bad, bad_issues = DataQualityValidator.validate_crop_record(invalid_crop)
    assert is_valid_bad is False
    assert len(bad_issues) >= 2


def test_data_quality_pdb_validator():
    assert DataQualityValidator.validate_pdb_id("1QON")[0] is True
    assert DataQualityValidator.validate_pdb_id("6A90")[0] is True
    assert DataQualityValidator.validate_pdb_id("INVALID_LONG_PDB")[0] is False


# ─── 5. REST API Endpoints Tests ─────────────────────────────────────────────
def test_api_list_crops(client):
    res = client.get("/api/v1/crops")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5
    assert any(c["scientific_name"] == "Solanum lycopersicum" for c in data)


def test_api_search_crops(client):
    res = client.get("/api/v1/crops?search=Cotton")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert data[0]["common_name"] == "Upland Cotton"


def test_api_crop_threats(client):
    # Fetch Tomato crop
    crops = client.get("/api/v1/crops?search=Tomato").json()
    tomato = crops[0]
    res = client.get(f"/api/v1/crops/{tomato['id']}/threats")
    assert res.status_code == 200
    threats = res.json()
    assert len(threats) >= 1
    assert any("persicae" in t["organism_name"] for t in threats)


def test_api_target_protein_and_structures(client):
    targets = client.get("/api/v1/targets?search=AChE1").json()
    assert len(targets) >= 1
    target = targets[0]

    # Fetch protein record
    prot_res = client.get(f"/api/v1/targets/{target['id']}/protein")
    assert prot_res.status_code == 200
    prot = prot_res.json()
    assert prot["uniprot_accession"] == "Q9BMJ1"
    assert prot["sequence_length"] == 647

    # Fetch structures
    str_res = client.get(f"/api/v1/targets/{target['id']}/structures")
    assert str_res.status_code == 200
    structs = str_res.json()
    assert len(structs) >= 1
    assert structs[0]["structure_type"] == "EXPERIMENTAL"
    assert structs[0]["pdb_id"] == "1QON"


def test_api_knowledge_graph_status_and_sync(client):
    # Status endpoint
    status_res = client.get("/api/v1/admin/knowledge-graph/status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["total_crops"] >= 5
    assert status_data["total_targets"] >= 4
    assert status_data["experimental_structures_count"] >= 3

    # Sync endpoint
    sync_res = client.post("/api/v1/admin/knowledge-graph/sync", json={"sync_type": "ALL"})
    assert sync_res.status_code == 200
    sync_data = sync_res.json()
    assert sync_data["status"] == "COMPLETED"


# ─── 6. Full End-to-End Knowledge Cascade Forecast Test ──────────────────────
def test_full_knowledge_cascade_forecast(client):
    # Step 1: Query Crop
    crop_res = client.get("/api/v1/crops?search=Tomato")
    assert crop_res.status_code == 200
    crop = crop_res.json()[0]

    # Step 2: Query Threats for Crop
    threats_res = client.get(f"/api/v1/crops/{crop['id']}/threats")
    assert threats_res.status_code == 200
    threat = threats_res.json()[0]

    # Step 3: Query Targets for Threat
    targets_res = client.get(f"/api/v1/targets/threat/{threat['organism_id']}")
    assert targets_res.status_code == 200
    target = targets_res.json()[0]

    # Step 4: Verify Protein & Structure
    prot = client.get(f"/api/v1/targets/{target['id']}/protein").json()
    assert prot["uniprot_accession"] == target["uniprot_id"]
    structs = client.get(f"/api/v1/targets/{target['id']}/structures").json()
    assert structs[0]["structure_type"] in ["EXPERIMENTAL", "COMPUTED"]

    # Step 5: Ingest Candidate Molecule
    mol_res = client.post("/api/v1/molecules", json={
        "chemical_name": "Imidacloprid-Analog-STEP16-TEST",
        "smiles": "C1CN(C(=N1)NC(=O)N)CC2=CN=C(C=C2)Cl",
        "molecular_weight": 255.66,
        "logp": 0.57,
        "provenance_source": "STEP16_TEST",
    })
    assert mol_res.status_code == 201
    mol = mol_res.json()

    # Step 6 & 7: Execute Forecast
    fc_res = client.post("/api/v1/forecasts", json={
        "project_id": "prj_ache1_series",
        "molecule_id": mol["id"],
        "target_id": target["id"],
        "pest_id": threat["organism_id"],
        "crop_id": crop["id"],
        "threat_id": threat["id"],
    })
    assert fc_res.status_code in [200, 201]
    fc = fc_res.json()
    assert fc["status"] == "COMPLETED"
    assert fc["durability_score"] is not None
    assert fc["estimated_years_to_resistance"] is not None

    # Step 8: Verify DB Persistence
    get_fc = client.get(f"/api/v1/forecasts/{fc['id']}")
    assert get_fc.status_code == 200
    assert get_fc.json()["id"] == fc["id"]
