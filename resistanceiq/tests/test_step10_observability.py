"""
ResistanceIQ — Step 10 Observability, Monitoring, Correlation IDs & Admin Telemetry Test Suite
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
from app.models import Organization, User, UserRole, IngestionRun
from app.core.security import create_access_token, get_password_hash
from app.core.telemetry import metrics_collector

client = TestClient(app)


@pytest.fixture(scope="module")
def setup_telemetry_fixtures():
    db = SessionLocal()
    org = Organization(name="Telemetry Org", slug=f"telem-org-{uuid.uuid4().hex[:6]}")
    db.add(org)
    db.commit()
    db.refresh(org)
    org_id = org.id

    admin_user = User(
        organization_id=org_id,
        email=f"admin.telem.{uuid.uuid4().hex[:6]}@telem.com",
        hashed_password=get_password_hash("ResistanceIQ2026!#"),
        full_name="Admin Telem",
        role=UserRole.ADMIN,
    )
    viewer_user = User(
        organization_id=org_id,
        email=f"viewer.telem.{uuid.uuid4().hex[:6]}@telem.com",
        hashed_password=get_password_hash("ResistanceIQ2026!#"),
        full_name="Viewer Telem",
        role=UserRole.VIEWER,
    )
    db.add_all([admin_user, viewer_user])
    db.commit()
    db.refresh(admin_user)
    db.refresh(viewer_user)

    admin_token = create_access_token(subject=admin_user.id, role="ADMIN", organization_id=org_id)
    viewer_token = create_access_token(subject=viewer_user.id, role="VIEWER", organization_id=org_id)

    db.close()

    return {
        "admin_token": admin_token,
        "viewer_token": viewer_token,
    }


def test_1_correlation_id_generation_and_propagation():
    # 1. Without header -> Server generates X-Request-ID
    res = client.get("/")
    assert res.status_code == 200
    req_id = res.headers.get("x-request-id")
    assert req_id is not None
    assert req_id.startswith("req_")

    # 2. With client header -> Server propagates provided X-Request-ID
    custom_id = "req_custom_trace_9999"
    res2 = client.get("/", headers={"X-Request-ID": custom_id})
    assert res2.status_code == 200
    assert res2.headers.get("x-request-id") == custom_id


def test_2_telemetry_metrics_collection():
    initial_count = metrics_collector.request_count
    client.get("/")
    client.get("/api/v1/system/health")
    assert metrics_collector.request_count >= initial_count + 2
    summary = metrics_collector.get_summary()
    assert "total_requests" in summary
    assert "status_distribution" in summary
    assert "forecast_telemetry" in summary


def test_3_forecast_telemetry_tracking():
    initial_forecasts = metrics_collector.forecast_total
    res = client.post(
        "/api/v1/forecasts/evaluate",
        json={
            "chemical_name": "Telemetry Acetamiprid",
            "smiles": "CCN(CC)C(=O)C1=CC=CC=C1",
            "irac_moa_group": "4A",
            "pest_name": "Myzus persicae",
            "pest_order": "Hemiptera",
        },
    )
    assert res.status_code == 200
    assert metrics_collector.forecast_total == initial_forecasts + 1
    assert metrics_collector.forecast_success >= 1
    assert len(metrics_collector.inference_latencies_ms) > 0


def test_4_admin_operational_status_rbac(setup_telemetry_fixtures):
    data = setup_telemetry_fixtures
    admin_headers = {"Authorization": f"Bearer {data['admin_token']}"}
    viewer_headers = {"Authorization": f"Bearer {data['viewer_token']}"}

    # VIEWER forbidden (403)
    viewer_res = client.get("/api/v1/admin/operational-status", headers=viewer_headers)
    assert viewer_res.status_code == 403

    # ADMIN allowed (200)
    admin_res = client.get("/api/v1/admin/operational-status", headers=admin_headers)
    assert admin_res.status_code == 200
    payload = admin_res.json()
    assert "subsystems" in payload
    assert payload["subsystems"]["api"]["status"] == "OPERATIONAL"
    assert payload["subsystems"]["ml_inference"]["status"] == "OPERATIONAL"
    assert "active_model" in payload
    assert payload["active_model"]["version"] in ["v2.0.0-gbrt-ecfp4", "v1.0.0-ridge-ecfp4"]
    assert "telemetry_metrics" in payload


def test_5_ingestion_telemetry_cache():
    metrics_collector.record_ingestion_run({
        "source": "APRD_Bioassay_Index",
        "dataset_version": "dset_2026_q3",
        "records_accepted": 12421,
        "records_rejected": 14,
    })
    summary = metrics_collector.get_summary()
    assert summary["last_ingestion_run"] is not None
    assert summary["last_ingestion_run"]["records_accepted"] == 12421
