"""
ResistanceIQ — Step 7 Full Production API & End-to-End Integration Tests
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.main import app
from app.core.security import create_access_token

token = create_access_token(
    subject="usr_001",
    role="ADMIN",
    organization_id="org_bindwell_001",
)
client = TestClient(app, headers={"Authorization": f"Bearer {token}"})


def test_1_dashboard_summary_and_health():
    res = client.get("/api/v1/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_projects" in data
    assert "total_forecasts" in data
    assert "active_projects" in data

    h_res = client.get("/api/v1/system/health")
    assert h_res.status_code == 200
    h_data = h_res.json()
    assert h_data["database_connected"] is True


def test_2_project_lifecycle():
    # 1. Create project
    create_res = client.post(
        "/api/v1/projects",
        json={
            "name": "Integration Test Research Project",
            "description": "Validating frontend to backend persistence.",
        },
    )
    assert create_res.status_code in [200, 201]
    proj = create_res.json()
    proj_id = proj["id"]
    assert proj["name"] == "Integration Test Research Project"

    # 2. Get project list
    list_res = client.get("/api/v1/projects")
    assert list_res.status_code == 200
    projects = list_res.json()
    assert any(p["id"] == proj_id for p in projects)

    # 3. Update project
    update_res = client.patch(
        f"/api/v1/projects/{proj_id}",
        json={"description": "Updated project description."},
    )
    assert update_res.status_code == 200
    assert update_res.json()["description"] == "Updated project description."


def test_3_candidate_ingestion_and_forecast_execution():
    # 1. Create Molecule
    mol_res = client.post(
        "/api/v1/molecules",
        json={
            "chemical_name": "Test Neonicotinoid Candidate",
            "smiles": "C1CN(C(=N1)NC(=O)N)CC2=CN=C(C=C2)Cl",
        },
    )
    assert mol_res.status_code in [200, 201]
    molecule = mol_res.json()

    # 2. Fetch targets & pests
    targets = client.get("/api/v1/targets").json()
    pests = client.get("/api/v1/pests").json()
    projects = client.get("/api/v1/projects").json()

    assert len(targets) > 0
    assert len(pests) > 0
    assert len(projects) > 0

    # 3. Create Forecast
    fc_res = client.post(
        "/api/v1/forecasts",
        json={
            "project_id": projects[0]["id"],
            "molecule_id": molecule["id"],
            "target_id": targets[0]["id"],
            "pest_id": pests[0]["id"],
        },
    )
    assert fc_res.status_code in [200, 201]
    forecast = fc_res.json()
    assert forecast["status"] == "COMPLETED"
    assert forecast["durability_score"] is not None
    assert forecast["estimated_years_to_resistance"] is not None
    assert forecast["risk_tier"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]

    # 4. List forecasts
    fc_list = client.get("/api/v1/forecasts").json()
    assert any(f["id"] == forecast["id"] for f in fc_list)


def test_4_direct_candidate_evaluation_with_conformal_bounds():
    eval_res = client.post(
        "/api/v1/forecasts/evaluate",
        json={
            "chemical_name": "Chlorantraniliprole",
            "smiles": "CC1=CC(=CC(=C1NC(=O)C2=CC(=NN2C3=CC(=CC=C3)Cl)C(F)(F)F)C(=O)NC)Cl",
            "irac_moa_group": "28",
            "pest_name": "Plutella xylostella",
            "pest_order": "Lepidoptera",
            "assay_method": "Leaf-Dip",
        },
    )
    assert eval_res.status_code == 200
    res = eval_res.json()
    assert res["status"] in ["COMPLETED", "OUT_OF_DOMAIN"]
    assert "conformal_interval" in res
    assert res["conformal_interval"]["rr_lower"] >= 1.0
    assert res["conformal_interval"]["rr_upper"] >= res["conformal_interval"]["rr_lower"]


def test_5_backtests_and_reports():
    # Backtests
    bt_res = client.get("/api/v1/backtests")
    assert bt_res.status_code == 200
    bt_data = bt_res.json()
    assert "total_cases" in bt_data
    assert "mean_absolute_error" in bt_data

    # Reports
    projects = client.get("/api/v1/projects").json()
    gen_res = client.post(
        "/api/v1/reports/generate",
        json={
            "project_id": projects[0]["id"],
            "format": "PDF",
        },
    )
    assert gen_res.status_code in [200, 201]
    rep = gen_res.json()
    assert rep["file_name"].endswith(".pdf")

    rep_list = client.get("/api/v1/reports").json()
    assert any(r["id"] == rep["id"] for r in rep_list)


def test_6_settings_org_team_and_api_keys():
    # 1. Update Org
    patch_res = client.patch(
        "/api/v1/settings/org",
        json={"name": "Bindwell BioSciences Global"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Bindwell BioSciences Global"

    # 2. Invite Team Member
    invite_res = client.post(
        "/api/v1/settings/team/invite",
        json={
            "email": "dr.smith.test@bindwell.bio",
            "full_name": "Dr. Smith",
            "role": "ANALYST",
        },
    )
    assert invite_res.status_code in [200, 201]
    invited_user = invite_res.json()

    # 3. Create API Key
    key_res = client.post(
        "/api/v1/settings/api-keys",
        json={"name": "Test Automated CI Key"},
    )
    assert key_res.status_code in [200, 201]
    key_data = key_res.json()
    assert "secret" in key_data
    assert key_data["secret"].startswith("riq_live_")

    # 4. Revoke API Key
    del_key_res = client.delete(f"/api/v1/settings/api-keys/{key_data['id']}")
    assert del_key_res.status_code == 204

    # 5. Remove Invited Member
    del_user_res = client.delete(f"/api/v1/settings/team/{invited_user['id']}")
    assert del_user_res.status_code == 204
