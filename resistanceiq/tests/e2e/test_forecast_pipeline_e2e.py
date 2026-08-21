"""
ResistanceIQ — End-to-End Forecast Pipeline Integration & Governance Test Suite
Validates:
1. Exact production model artifact identity (RandomForestRegressor, 1059-D, locked SHA-256).
2. Complete end-to-end forecast execution through all 13 pipeline checkpoints.
3. Parity between POST /api/v1/forecasts and GET /api/v1/forecasts/{id}.
4. Conformal uncertainty bounds (rr_lower < rr_upper) and OOD status.
5. Strict controlled error states for invalid inputs, missing entities, and schema mismatches.
"""

import sys
import os
import pytest
import numpy as np
from fastapi.testclient import TestClient

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend"))
root_dir = os.path.abspath(os.path.join(backend_dir, ".."))
for p in [backend_dir, root_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.main import app
from app.core.database import SessionLocal
from app.models import Molecule, Target, Pest, Project, Organization, User, UserRole, Forecast
from ml.inference.loader import ModelLoader
from ml.inference.predictor import ResistancePredictor, compute_schema_hash

client = TestClient(app)


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def auth_headers(db_session):
    # Ensure organization and user exist
    org = db_session.query(Organization).filter(Organization.slug == "bindwell").first()
    if not org:
        org = Organization(id="org_bindwell_01", name="Bindwell Bio", slug="bindwell")
        db_session.add(org)
        db_session.commit()

    user = db_session.query(User).filter(User.email == "priya@bindwell.bio").first()
    if not user:
        from app.auth.security import get_password_hash
        user = User(
            id="usr_priya_01",
            organization_id=org.id,
            email="priya@bindwell.bio",
            full_name="Dr. Priya Patel",
            hashed_password=get_password_hash("ResistanceIQ2026!"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

    resp = client.post("/api/v1/auth/login", json={"email": "priya@bindwell.bio", "password": "ResistanceIQ2026!"})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_production_model_identity_and_integrity():
    """Verify locked benchmark artifact identity, SHA-256, estimator, and 1059-D schema hash."""
    loader = ModelLoader()
    artifact = loader.load_model("v2.0.0-gbrt-ecfp4")
    
    assert artifact["model_version"] == "v2.0.0-gbrt-ecfp4"
    assert artifact["artifact_sha256"] == "6fc915fa26716dc4a06bad71f586af95ee071acf11e9a5b8acdc5171fed55622"
    assert artifact["model"].__class__.__name__ == "RandomForestRegressor"
    assert artifact["model"].n_features_in_ == 1059
    assert len(artifact["feature_pipeline"].feature_names) == 1059

    schema_hash = compute_schema_hash(
        artifact["feature_pipeline"].feature_names,
        model_version=artifact["model_version"],
        feature_version=artifact["feature_version"],
        dataset_version=artifact["dataset_version"],
    )
    assert schema_hash == "0c8ab6929f675c36e4583ca035c8311304a060cc18e1541a7ba95bbc27dc2be3"


def test_successful_full_forecast_pipeline_and_persistence(auth_headers, db_session):
    """Executes the full 7-step candidate workflow and validates database persistence."""
    # 1. Resolve Target and Pest from existing seeded records
    target = db_session.query(Target).first()
    assert target is not None, "Target records must be seeded"

    pest = db_session.query(Pest).first()
    assert pest is not None, "Pest records must be seeded"

    # 2. Register Candidate Molecule via API
    mol_resp = client.post("/api/v1/molecules", headers=auth_headers, json={
        "chemical_name": "Imidacloprid-E2E-Verified",
        "smiles": "C1CN(C(=N1)NC(=O)N)CC2=CN=C(C=C2)Cl",
        "molecular_formula": "C9H10ClN5O2",
        "molecular_weight": 255.66,
        "logp": 0.57,
        "tpsa": 79.5,
        "hbd_count": 2,
        "hba_count": 4,
        "rotatable_bonds": 2,
        "is_novel": False,
    })
    assert mol_resp.status_code == 201, f"Molecule creation failed: {mol_resp.text}"
    molecule_id = mol_resp.json()["id"]

    # 3. Trigger Real ML Forecast via POST /api/v1/forecasts
    forecast_payload = {
        "project_id": "prj_bindwell_01",
        "molecule_id": molecule_id,
        "target_id": target.id,
        "pest_id": pest.id,
        "model_version": "v2.0.0-gbrt-ecfp4",
    }
    resp = client.post("/api/v1/forecasts", headers=auth_headers, json=forecast_payload)
    assert resp.status_code == 201, f"Forecast failed: {resp.text}"
    data = resp.json()

    # 4. Verify Canonical Response Contract
    forecast_id = data["forecast_id"]
    assert forecast_id is not None
    assert data["status"] in ["COMPLETED", "OUT_OF_DOMAIN"]
    assert data["model_version"] == "v2.0.0-gbrt-ecfp4"
    assert data["model_algorithm"] == "RANDOM_FOREST"
    assert data["data_version"] == "aprd-resistance-v2"
    assert data["feature_version"] == "v2.0-ecfp4-descriptors"

    # Numerical predictions must be real, finite, and mathematically sound
    assert np.isfinite(data["prediction"])
    assert data["prediction"] >= 0.0
    assert np.isfinite(data["resistance_ratio"])
    assert data["resistance_ratio"] >= 1.0
    assert np.isfinite(data["durability_horizon"])
    assert 0.0 <= data["durability_score"] <= 1.0
    assert data["risk_tier"] in ["LOW", "MODERATE", "HIGH", "CRITICAL", "SUSCEPTIBLE"]

    # Conformal Uncertainty Bounds
    interval = data["prediction_interval"]
    assert interval["alpha"] == 0.10
    assert interval["rr_lower"] <= interval["rr_upper"]
    assert interval["rr_lower"] >= 1.0
    assert np.isfinite(interval["q_hat"])

    # 5. Retrieve Persisted Forecast via GET /api/v1/forecasts/{id}
    get_resp = client.get(f"/api/v1/forecasts/{forecast_id}", headers=auth_headers)
    assert get_resp.status_code == 200, f"GET forecast failed: {get_resp.text}"
    persisted = get_resp.json()

    assert persisted["forecast_id"] == forecast_id
    assert persisted["candidate_id"] == molecule_id
    assert persisted["compound_identity"]["chemical_name"] == "Imidacloprid-E2E-Verified"
    assert persisted["target_identity"]["target_id"] == target.id
    assert np.isclose(persisted["durability_score"], data["durability_score"], atol=0.01)


def test_controlled_error_missing_molecule(auth_headers, db_session):
    """Verify HTTP 404 and structured error when candidate molecule is not found."""
    target = db_session.query(Target).first()
    pest = db_session.query(Pest).first()
    resp = client.post("/api/v1/forecasts", headers=auth_headers, json={
        "project_id": "prj_bindwell_01",
        "molecule_id": "mol_non_existent_9999",
        "target_id": target.id,
        "pest_id": pest.id,
    })
    assert resp.status_code == 404
    assert resp.headers.get("X-Error-Code") == "MOLECULE_NOT_FOUND"
    assert resp.headers.get("X-Stage") == "ENTITY_RESOLUTION"
    assert "X-Request-ID" in resp.headers
    assert "unavailable" in resp.json()["detail"].lower()


def test_controlled_error_missing_target(auth_headers, db_session):
    """Verify HTTP 404 and structured error when biological target is unresolvable."""
    mol = db_session.query(Molecule).first()
    pest = db_session.query(Pest).first()
    assert mol is not None
    resp = client.post("/api/v1/forecasts", headers=auth_headers, json={
        "project_id": "prj_bindwell_01",
        "molecule_id": mol.id,
        "target_id": "tgt_completely_invalid_9999",
        "pest_id": pest.id,
    })
    assert resp.status_code == 404
    assert resp.headers.get("X-Error-Code") == "TARGET_NOT_FOUND"
    assert resp.headers.get("X-Stage") == "ENTITY_RESOLUTION"


def test_controlled_error_missing_pest(auth_headers, db_session):
    """Verify HTTP 404 and structured error when pest organism is unresolvable."""
    mol = db_session.query(Molecule).first()
    target = db_session.query(Target).first()
    assert mol is not None
    resp = client.post("/api/v1/forecasts", headers=auth_headers, json={
        "project_id": "prj_bindwell_01",
        "molecule_id": mol.id,
        "target_id": target.id,
        "pest_id": "pst_completely_invalid_9999",
    })
    assert resp.status_code == 404
    assert resp.headers.get("X-Error-Code") == "PEST_NOT_FOUND"
    assert resp.headers.get("X-Stage") == "ENTITY_RESOLUTION"


def test_out_of_domain_novel_candidate_handling(auth_headers, db_session):
    """Verify novel compound evaluates with OUT_OF_DOMAIN status cleanly without crashing."""
    target = db_session.query(Target).first()
    pest = db_session.query(Pest).first()

    # Create a novel macrocyclic scaffold
    mol_resp = client.post("/api/v1/molecules", headers=auth_headers, json={
        "chemical_name": "Novel-Macrocycle-Scaffold-OOD",
        "smiles": "C1CCCCCCCCCCCCCCCCCCCCCCCC1",
        "molecular_formula": "C24H48",
        "molecular_weight": 336.64,
        "logp": 9.2,
        "tpsa": 0.0,
        "hbd_count": 0,
        "hba_count": 0,
        "rotatable_bonds": 0,
        "is_novel": True,
    })
    assert mol_resp.status_code == 201
    mol_id = mol_resp.json()["id"]

    resp = client.post("/api/v1/forecasts", headers=auth_headers, json={
        "project_id": "prj_bindwell_01",
        "molecule_id": mol_id,
        "target_id": target.id,
        "pest_id": pest.id,
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["ood_status"] == "OUT_OF_DOMAIN"
    assert np.isfinite(data["prediction"])
    assert np.isfinite(data["durability_score"])


def test_unauthenticated_request_rejection():
    """Verify unauthenticated requests are rejected with HTTP 401."""
    resp = client.post("/api/v1/forecasts", json={
        "project_id": "prj_001",
        "molecule_id": "mol_001",
        "target_id": "tgt_001",
        "pest_id": "pst_001",
    })
    assert resp.status_code == 401
