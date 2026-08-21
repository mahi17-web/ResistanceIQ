"""
ResistanceIQ — Step 8 Production QA, Security, Multi-Tenancy & Reliability Test Suite
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
from app.models import Organization, User, Project, UserRole
from app.core.security import create_access_token, get_password_hash

client = TestClient(app)


@pytest.fixture(scope="module")
def setup_multi_tenant_fixtures():
    db = SessionLocal()
    # Create Organization A
    org_a = Organization(name="AgroChem Global (Org A)", slug=f"agrochem-a-{uuid.uuid4().hex[:6]}")
    db.add(org_a)
    db.commit()
    db.refresh(org_a)
    org_a_id = org_a.id

    user_a_admin = User(
        organization_id=org_a_id,
        email=f"admin.a.{uuid.uuid4().hex[:6]}@agrochem.com",
        hashed_password=get_password_hash("ResistanceIQ2026!#"),
        full_name="Admin A",
        role=UserRole.ADMIN,
    )
    user_a_viewer = User(
        organization_id=org_a_id,
        email=f"viewer.a.{uuid.uuid4().hex[:6]}@agrochem.com",
        hashed_password=get_password_hash("ResistanceIQ2026!#"),
        full_name="Viewer A",
        role=UserRole.VIEWER,
    )
    db.add_all([user_a_admin, user_a_viewer])
    db.commit()
    db.refresh(user_a_admin)
    db.refresh(user_a_viewer)

    # Create Organization B
    org_b = Organization(name="BioPest Dynamics (Org B)", slug=f"biopest-b-{uuid.uuid4().hex[:6]}")
    db.add(org_b)
    db.commit()
    db.refresh(org_b)
    org_b_id = org_b.id

    user_b_admin = User(
        organization_id=org_b_id,
        email=f"admin.b.{uuid.uuid4().hex[:6]}@biopest.com",
        hashed_password=get_password_hash("ResistanceIQ2026!#"),
        full_name="Admin B",
        role=UserRole.ADMIN,
    )
    db.add(user_b_admin)
    db.commit()
    db.refresh(user_b_admin)

    # Create Project in Org B
    proj_b = Project(
        organization_id=org_b_id,
        name="Confidential Org B Pipeline",
        description="Proprietary insecticide discovery",
    )
    db.add(proj_b)
    db.commit()
    db.refresh(proj_b)
    proj_b_id = proj_b.id

    token_a_admin = create_access_token(subject=user_a_admin.id, role="ADMIN", organization_id=org_a_id)
    token_a_viewer = create_access_token(subject=user_a_viewer.id, role="VIEWER", organization_id=org_a_id)
    token_b_admin = create_access_token(subject=user_b_admin.id, role="ADMIN", organization_id=org_b_id)

    db.close()

    return {
        "org_a_id": org_a_id,
        "org_b_id": org_b_id,
        "proj_b_id": proj_b_id,
        "token_a_admin": token_a_admin,
        "token_a_viewer": token_a_viewer,
        "token_b_admin": token_b_admin,
    }


def test_1_security_headers_present():
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"


def test_2_cross_organization_isolation(setup_multi_tenant_fixtures):
    data = setup_multi_tenant_fixtures
    headers_a = {"Authorization": f"Bearer {data['token_a_admin']}"}
    headers_b = {"Authorization": f"Bearer {data['token_b_admin']}"}

    # User B can view Org B's project
    res_b = client.get(f"/api/v1/projects/{data['proj_b_id']}", headers=headers_b)
    assert res_b.status_code == 200
    assert res_b.json()["name"] == "Confidential Org B Pipeline"

    # User A MUST NOT be able to view Org B's project (Returns 404 Not Found)
    res_a = client.get(f"/api/v1/projects/{data['proj_b_id']}", headers=headers_a)
    assert res_a.status_code == 404

    # User A listing projects must only see Org A projects, never Org B
    res_a_list = client.get("/api/v1/projects", headers=headers_a)
    assert res_a_list.status_code == 200
    for p in res_a_list.json():
        assert p["id"] != data["proj_b_id"]


def test_3_role_based_access_control(setup_multi_tenant_fixtures):
    data = setup_multi_tenant_fixtures
    headers_viewer = {"Authorization": f"Bearer {data['token_a_viewer']}"}
    headers_admin = {"Authorization": f"Bearer {data['token_a_admin']}"}

    # VIEWER attempting to invite a team member -> 403 Forbidden
    invite_res = client.post(
        "/api/v1/settings/team/invite",
        headers=headers_viewer,
        json={"email": f"new.analyst.{uuid.uuid4().hex[:6]}@agrochem.com", "full_name": "New Analyst", "role": "ANALYST"},
    )
    assert invite_res.status_code == 403

    # ADMIN can invite team member -> 201 Created
    admin_invite_res = client.post(
        "/api/v1/settings/team/invite",
        headers=headers_admin,
        json={"email": f"new.analyst.{uuid.uuid4().hex[:6]}@agrochem.com", "full_name": "New Analyst", "role": "ANALYST"},
    )
    assert admin_invite_res.status_code in [200, 201]


def test_4_invalid_token_handling():
    # Invalid bearer token
    res_invalid = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.token.payload"},
    )
    assert res_invalid.status_code == 401
    assert "Invalid or expired" in res_invalid.json()["detail"]


def test_5_idempotency_protection(setup_multi_tenant_fixtures):
    data = setup_multi_tenant_fixtures
    headers_a = {"Authorization": f"Bearer {data['token_a_admin']}"}

    # Create Project in Org A
    proj_res = client.post(
        "/api/v1/projects",
        headers=headers_a,
        json={"name": "Idempotency Test Project"},
    )
    assert proj_res.status_code in [200, 201]
    proj_id = proj_res.json()["id"]

    # Create Molecule
    mol_res = client.post(
        "/api/v1/molecules",
        headers=headers_a,
        json={"chemical_name": "Idempotent Mol", "smiles": "CC(=O)OC1=CC=CC=C1C(=O)O"},
    )
    assert mol_res.status_code in [200, 201]
    mol_id = mol_res.json()["id"]

    targets = client.get("/api/v1/targets", headers=headers_a).json()
    pests = client.get("/api/v1/pests", headers=headers_a).json()

    # Submission 1
    req_body = {
        "project_id": proj_id,
        "molecule_id": mol_id,
        "target_id": targets[0]["id"],
        "pest_id": pests[0]["id"],
    }
    res1 = client.post("/api/v1/forecasts", headers=headers_a, json=req_body)
    assert res1.status_code in [200, 201]
    fc1_id = res1.json()["id"]

    # Submission 2 (Immediate duplicate click within idempotency window)
    res2 = client.post("/api/v1/forecasts", headers=headers_a, json=req_body)
    assert res2.status_code in [200, 201]
    fc2_id = res2.json()["id"]

    # Deduplication verified: Returns identical forecast ID
    assert fc1_id == fc2_id


def test_6_malformed_chemical_input_safety():
    # Unbalanced brackets and invalid chemical symbols fail safely with 400
    res = client.post(
        "/api/v1/forecasts/evaluate",
        json={
            "chemical_name": "CorruptedMolecule",
            "smiles": "CC1=CC(=O)N(C1=O???",  # Unbalanced & invalid chars
            "irac_moa_group": "4A",
            "pest_name": "Myzus persicae",
            "pest_order": "Hemiptera",
        },
    )
    assert res.status_code == 400
    assert "Invalid chemical" in res.json()["detail"] or "Unbalanced" in res.json()["detail"]


def test_7_end_to_end_smoke_workflow(setup_multi_tenant_fixtures):
    data = setup_multi_tenant_fixtures
    headers = {"Authorization": f"Bearer {data['token_a_admin']}"}

    # 1. System Health
    health = client.get("/api/v1/system/health", headers=headers).json()
    assert health["database_connected"] is True

    # 2. List Models
    models = client.get("/api/v1/forecasts/models", headers=headers).json()
    assert any(m["version"] == "v1.0.0-ridge-ecfp4" for m in models)

    # 3. Create Project
    proj = client.post(
        "/api/v1/projects",
        headers=headers,
        json={"name": "End-to-End Discovery Pipeline"},
    ).json()

    # 4. Ingest Molecule
    mol = client.post(
        "/api/v1/molecules",
        headers=headers,
        json={"chemical_name": "E2E Candidate", "smiles": "CC1=CC=CC=C1"},
    ).json()

    # 5. Execute Real Forecast
    targets = client.get("/api/v1/targets", headers=headers).json()
    pests = client.get("/api/v1/pests", headers=headers).json()
    fc = client.post(
        "/api/v1/forecasts",
        headers=headers,
        json={
            "project_id": proj["id"],
            "molecule_id": mol["id"],
            "target_id": targets[0]["id"],
            "pest_id": pests[0]["id"],
        },
    ).json()
    assert fc["status"] == "COMPLETED"
    assert fc["durability_score"] > 0.0

    # 6. Generate Report
    rep = client.post(
        "/api/v1/reports/generate",
        headers=headers,
        json={"project_id": proj["id"], "format": "PDF"},
    ).json()
    assert rep["file_name"].endswith(".pdf")
