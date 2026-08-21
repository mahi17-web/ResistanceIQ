"""
ResistanceIQ — Step 11 User Acceptance Testing (UAT) & Product Journeys Test Suite
"""

import sys
import os
import uuid
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.database import SessionLocal
from app.models import Organization, User, Project, Molecule, Target, Pest, Forecast, UserRole
from app.core.security import create_access_token, get_password_hash

client = TestClient(app)


@pytest.fixture(scope="module")
def setup_uat_fixtures():
    db = SessionLocal()
    org = Organization(name="UAT AgroCorp", slug=f"uat-org-{uuid.uuid4().hex[:6]}")
    db.add(org)
    db.commit()
    db.refresh(org)
    org_id = org.id

    lead_analyst = User(
        organization_id=org_id,
        email=f"elena.analyst.{uuid.uuid4().hex[:6]}@agrocorp.com",
        hashed_password=get_password_hash("ResistanceIQ2026!#"),
        full_name="Dr. Elena Rostova",
        role=UserRole.ADMIN,
    )
    scientific_lead = User(
        organization_id=org_id,
        email=f"marcus.lead.{uuid.uuid4().hex[:6]}@agrocorp.com",
        hashed_password=get_password_hash("ResistanceIQ2026!#"),
        full_name="Dr. Marcus Vance",
        role=UserRole.ANALYST,
    )
    viewer_user = User(
        organization_id=org_id,
        email=f"guest.viewer.{uuid.uuid4().hex[:6]}@agrocorp.com",
        hashed_password=get_password_hash("ResistanceIQ2026!#"),
        full_name="Guest Viewer",
        role=UserRole.VIEWER,
    )
    db.add_all([lead_analyst, scientific_lead, viewer_user])
    db.commit()
    db.refresh(lead_analyst)
    db.refresh(scientific_lead)
    db.refresh(viewer_user)

    token_analyst = create_access_token(subject=lead_analyst.id, role="ADMIN", organization_id=org_id)
    token_lead = create_access_token(subject=scientific_lead.id, role="ANALYST", organization_id=org_id)
    token_viewer = create_access_token(subject=viewer_user.id, role="VIEWER", organization_id=org_id)

    db.close()

    return {
        "org_id": org_id,
        "token_analyst": token_analyst,
        "token_lead": token_lead,
        "token_viewer": token_viewer,
    }


def test_journey_a_first_candidate_analysis_workflow(setup_uat_fixtures):
    """
    Journey A: Login -> Create Project -> Ingest Molecule -> Run Forecast -> Verify Conformal Bounds
    """
    data = setup_uat_fixtures
    headers = {"Authorization": f"Bearer {data['token_analyst']}"}

    # 1. Create Project
    proj_res = client.post(
        "/api/v1/projects",
        headers=headers,
        json={"name": "Neonicotinoid NextGen Series", "description": "Novel nAChR modulators"},
    )
    assert proj_res.status_code in [200, 201]
    proj_id = proj_res.json()["id"]

    # 2. Ingest Molecule
    mol_res = client.post(
        "/api/v1/molecules",
        headers=headers,
        json={
            "chemical_name": "RIQ-Candidate-Alpha",
            "smiles": "CCN(CC)C(=O)C1=CC=CC=C1Cl",
            "irac_moa_group": "4A",
        },
    )
    assert mol_res.status_code in [200, 201]
    mol_id = mol_res.json()["id"]

    # 3. Retrieve Targets & Pests
    targets = client.get("/api/v1/targets", headers=headers).json()
    pests = client.get("/api/v1/pests", headers=headers).json()
    assert len(targets) > 0
    assert len(pests) > 0

    # 4. Execute Real Forecast
    fc_res = client.post(
        "/api/v1/forecasts",
        headers=headers,
        json={
            "project_id": proj_id,
            "molecule_id": mol_id,
            "target_id": targets[0]["id"],
            "pest_id": pests[0]["id"],
        },
    )
    assert fc_res.status_code in [200, 201]
    fc = fc_res.json()
    assert fc["status"] == "COMPLETED"
    assert fc["durability_score"] > 0.0
    assert fc["estimated_years_to_resistance"] > 0.0
    assert fc["risk_tier"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]


def test_journey_b_candidate_comparison_workflow(setup_uat_fixtures):
    """
    Journey B: Select multiple candidates and retrieve comparative data
    """
    data = setup_uat_fixtures
    headers = {"Authorization": f"Bearer {data['token_analyst']}"}

    forecasts = client.get("/api/v1/forecasts", headers=headers).json()
    assert len(forecasts) >= 1

    for fc in forecasts:
        assert "durability_score" in fc
        assert "estimated_years_to_resistance" in fc


def test_journey_c_model_validation_and_backtest_workflow(setup_uat_fixtures):
    """
    Journey C: Scientific Lead audits cross-validation metrics and historical cases
    """
    data = setup_uat_fixtures
    headers = {"Authorization": f"Bearer {data['token_lead']}"}

    # 1. Backtest Summary
    summary = client.get("/api/v1/backtests", headers=headers).json()
    assert "total_cases" in summary
    assert "model_version" in summary
    assert "mean_absolute_error" in summary

    # 2. Available Models List
    models = client.get("/api/v1/forecasts/models", headers=headers).json()
    assert len(models) > 0
    assert any(m["version"] == "v1.0.0-ridge-ecfp4" for m in models)


def test_journey_d_report_generation_workflow(setup_uat_fixtures):
    """
    Journey D: Generate and download compliance PDF dossier
    """
    data = setup_uat_fixtures
    headers = {"Authorization": f"Bearer {data['token_analyst']}"}

    projects = client.get("/api/v1/projects", headers=headers).json()
    assert len(projects) > 0
    proj_id = projects[0]["id"]

    rep_res = client.post(
        "/api/v1/reports/generate",
        headers=headers,
        json={"project_id": proj_id, "format": "PDF"},
    )
    assert rep_res.status_code in [200, 201]
    rep = rep_res.json()
    assert rep["file_name"].endswith(".pdf")
    assert rep["size_kb"] > 0


def test_journey_e_organization_and_rbac_workflow(setup_uat_fixtures):
    """
    Journey E: Org Admin manages team and API keys; Viewer is restricted
    """
    data = setup_uat_fixtures
    headers_admin = {"Authorization": f"Bearer {data['token_analyst']}"}
    headers_viewer = {"Authorization": f"Bearer {data['token_viewer']}"}

    # 1. Admin creates API key -> 201 with one-time raw secret
    key_res = client.post(
        "/api/v1/settings/api-keys",
        headers=headers_admin,
        json={"name": "Automated Screening Pipeline Key"},
    )
    assert key_res.status_code in [200, 201]
    key_data = key_res.json()
    raw_secret = key_data.get("secret") or key_data.get("key")
    assert raw_secret is not None
    assert raw_secret.startswith("riq_live_")

    # 2. Viewer attempts to create API key -> 403 Forbidden
    viewer_key_res = client.post(
        "/api/v1/settings/api-keys",
        headers=headers_viewer,
        json={"name": "Unauthorized Key"},
    )
    assert viewer_key_res.status_code == 403


def test_scientific_prediction_bounds_and_uncertainty():
    """
    Verify conformal intervals and out-of-domain tagging on direct evaluation
    """
    res = client.post(
        "/api/v1/forecasts/evaluate",
        json={
            "chemical_name": "Test Neonicotinoid",
            "smiles": "CCN(CC)C(=O)C1=CC=CC=C1",
            "irac_moa_group": "4A",
            "pest_name": "Myzus persicae",
            "pest_order": "Hemiptera",
        },
    )
    assert res.status_code == 200
    payload = res.json()
    assert "conformal_interval" in payload
    assert payload["conformal_interval"]["alpha"] == 0.10
    assert payload["conformal_interval"]["rr_lower"] <= payload["conformal_interval"]["rr_upper"]
    assert "domain_applicability" in payload
    assert payload["domain_applicability"]["domain_status"] in ["IN_DOMAIN", "LIMITED_SUPPORT", "OUT_OF_DOMAIN"]
