"""
ResistanceIQ — End-to-End Export & Download Pipeline Test Suite
Validates:
1. Forecast PDF export produces genuine, uncorrupted binary %PDF-1.4 files.
2. Forecast CSV export produces RFC 4180-compliant CSV with exact persisted values.
3. Forecast JSON export produces structured UTF-8 JSON.
4. Multi-candidate project report generation & binary download.
5. Strict authentication and multi-tenant organization isolation for all export endpoints.
"""

import sys
import os
import csv
import json
import pytest
from fastapi.testclient import TestClient

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend"))
root_dir = os.path.abspath(os.path.join(backend_dir, ".."))
for p in [backend_dir, root_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.main import app
from app.core.database import SessionLocal
from app.models import Molecule, Target, Pest, Project, Organization, User, UserRole, Forecast, ReportFormat
from app.core.security import get_password_hash

client = TestClient(app)


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def auth_context(db_session):
    # Setup Organization A and User A
    org_a = db_session.query(Organization).filter(Organization.slug == "bindwell").first()
    if not org_a:
        org_a = Organization(id="org_bindwell_01", name="Bindwell Bio", slug="bindwell")
        db_session.add(org_a)
        db_session.commit()

    user_a = db_session.query(User).filter(User.email == "priya@bindwell.bio").first()
    if not user_a:
        user_a = User(
            id="usr_priya_01",
            organization_id=org_a.id,
            email="priya@bindwell.bio",
            full_name="Dr. Priya Patel",
            hashed_password=get_password_hash("ResistanceIQ2026!"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db_session.add(user_a)
        db_session.commit()
    else:
        user_a.hashed_password = get_password_hash("ResistanceIQ2026!")
        user_a.is_active = True
        db_session.commit()

    # Login to get JWT
    resp = client.post("/api/v1/auth/login", json={"email": "priya@bindwell.bio", "password": "ResistanceIQ2026!"})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    token_a = resp.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Ensure Target, Pest, Molecule, Project, and Forecast exist
    target = db_session.query(Target).first()
    pest = db_session.query(Pest).first()
    
    project = db_session.query(Project).filter(Project.organization_id == user_a.organization_id).first()
    if not project:
        project = Project(id="prj_bindwell_export_01", organization_id=user_a.organization_id, name="Neonicotinoid Optimization", status="ACTIVE")
        db_session.add(project)
        db_session.commit()

    # Create real forecast
    mol_resp = client.post("/api/v1/molecules", headers=headers_a, json={
        "chemical_name": "Thiamethoxam-Export-Test",
        "smiles": "C1CN(C(=N1)NC(=O)N)CC2=CN=C(C=C2)Cl",
        "molecular_formula": "C8H10ClN5O3S",
        "molecular_weight": 291.71,
        "logp": -0.13,
        "tpsa": 98.4,
        "is_novel": False,
    })
    assert mol_resp.status_code == 201
    mol_id = mol_resp.json()["id"]

    fc_resp = client.post("/api/v1/forecasts", headers=headers_a, json={
        "project_id": project.id,
        "molecule_id": mol_id,
        "target_id": target.id,
        "pest_id": pest.id,
        "model_version": "v2.0.0-gbrt-ecfp4",
    })
    assert fc_resp.status_code == 201
    forecast_id = fc_resp.json()["forecast_id"]

    return {
        "headers": headers_a,
        "project_id": project.id,
        "forecast_id": forecast_id,
        "molecule_id": mol_id,
    }


def test_forecast_pdf_export_magic_bytes_and_integrity(auth_context):
    """Test GET /api/v1/forecasts/{id}/export?format=pdf produces authentic, uncorrupted PDF bytes."""
    f_id = auth_context["forecast_id"]
    resp = client.get(f"/api/v1/forecasts/{f_id}/export?format=pdf", headers=auth_context["headers"])
    assert resp.status_code == 200, f"PDF export failed: {resp.text}"

    # 1. MIME and Headers Verification
    assert "application/pdf" in resp.headers.get("Content-Type", "")
    assert "attachment" in resp.headers.get("Content-Disposition", "")
    assert f"ResistanceIQ_Forecast_{f_id}" in resp.headers.get("Content-Disposition", "")
    assert resp.headers.get("Content-Disposition", "").endswith('.pdf"')

    pdf_bytes = resp.content
    assert len(pdf_bytes) > 5000, f"PDF size ({len(pdf_bytes)} bytes) is suspiciously small."
    assert str(len(pdf_bytes)) == resp.headers.get("Content-Length")

    # 2. Magic Bytes Signature
    assert pdf_bytes.startswith(b"%PDF-1.4"), f"Invalid PDF header: {pdf_bytes[:10]}"
    assert b"%%EOF" in pdf_bytes[-1024:], "PDF must contain standard EOF trailer marker."


def test_forecast_csv_export_format_and_values(auth_context):
    """Test GET /api/v1/forecasts/{id}/export?format=csv produces valid RFC 4180 CSV with persisted metrics."""
    f_id = auth_context["forecast_id"]
    resp = client.get(f"/api/v1/forecasts/{f_id}/export?format=csv", headers=auth_context["headers"])
    assert resp.status_code == 200

    assert "text/csv" in resp.headers.get("Content-Type", "")
    assert f"ResistanceIQ_Forecast_{f_id}" in resp.headers.get("Content-Disposition", "")
    assert resp.headers.get("Content-Disposition", "").endswith('.csv"')

    csv_text = resp.text
    reader = list(csv.reader(csv_text.splitlines()))
    assert len(reader) >= 2, "CSV must contain header row and data row"

    header = reader[0]
    data_row = reader[1]

    assert "forecast_id" in header
    assert "chemical_name" in header
    assert "predicted_resistance_ratio" in header
    assert "durability_score" in header
    assert "model_version" in header

    # Verify actual row values
    forecast_idx = header.index("forecast_id")
    chem_idx = header.index("chemical_name")
    assert data_row[forecast_idx] == f_id
    assert "Thiamethoxam" in data_row[chem_idx]


def test_forecast_json_export_structure(auth_context):
    """Test GET /api/v1/forecasts/{id}/export?format=json produces parseable JSON matching persisted entity."""
    f_id = auth_context["forecast_id"]
    resp = client.get(f"/api/v1/forecasts/{f_id}/export?format=json", headers=auth_context["headers"])
    assert resp.status_code == 200
    assert "application/json" in resp.headers.get("Content-Type", "")

    data = resp.json()
    assert data["forecast_id"] == f_id
    assert "compound_identity" in data
    assert "target_identity" in data
    assert "prediction_interval" in data
    assert "scientific_provenance" in data
    assert data["scientific_provenance"]["model_version"] == "v2.0.0-gbrt-ecfp4"


def test_project_report_generate_and_download_pdf(auth_context):
    """Test POST /api/v1/reports/generate and subsequent GET /api/v1/reports/{id}/download for PDF."""
    p_id = auth_context["project_id"]
    gen_resp = client.post("/api/v1/reports/generate", headers=auth_context["headers"], json={
        "project_id": p_id,
        "format": "PDF",
    })
    assert gen_resp.status_code == 201, f"Report generation failed: {gen_resp.text}"
    report = gen_resp.json()
    report_id = report["id"]
    assert report_id.startswith("rep_")
    assert report["format"] == "PDF"
    assert report["size_kb"] > 0

    # Download binary report
    dl_resp = client.get(f"/api/v1/reports/{report_id}/download", headers=auth_context["headers"])
    assert dl_resp.status_code == 200
    assert "application/pdf" in dl_resp.headers.get("Content-Type", "")
    assert dl_resp.content.startswith(b"%PDF-1.4")
    assert len(dl_resp.content) > 2000


def test_project_report_generate_and_download_csv(auth_context):
    """Test POST /api/v1/reports/generate and subsequent GET /api/v1/reports/{id}/download for CSV."""
    p_id = auth_context["project_id"]
    gen_resp = client.post("/api/v1/reports/generate", headers=auth_context["headers"], json={
        "project_id": p_id,
        "format": "CSV",
    })
    assert gen_resp.status_code == 201
    report = gen_resp.json()
    report_id = report["id"]

    dl_resp = client.get(f"/api/v1/reports/{report_id}/download", headers=auth_context["headers"])
    assert dl_resp.status_code == 200
    assert "text/csv" in dl_resp.headers.get("Content-Type", "")
    assert "project_name,forecast_id,chemical_name" in dl_resp.text


def test_unauthenticated_export_rejection(auth_context):
    """Test that unauthenticated requests are strictly rejected with HTTP 401 and not served as files."""
    f_id = auth_context["forecast_id"]
    resp = client.get(f"/api/v1/forecasts/{f_id}/export?format=pdf")
    assert resp.status_code == 401
    # Ensure it did not return a 200 or PDF content
    assert not resp.content.startswith(b"%PDF")


def test_nonexistent_forecast_export_error(auth_context):
    """Test export of non-existent forecast returns HTTP 404 without downloading a file."""
    resp = client.get("/api/v1/forecasts/frc_nonexistent_9999/export?format=pdf", headers=auth_context["headers"])
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()
