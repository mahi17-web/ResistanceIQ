"""
ResistanceIQ — Step 26 Security Hardening & Reliability Test Suite
Comprehensive automated audit covering:
1. Strict JWT Bearer Token Authentication & Expiration
2. Role-Based Access Control (RBAC) Matrix
3. Cross-Tenant Organization Isolation (Data Boundary Enforcement)
4. Password Complexity Policy Validation
5. Anti-Enumeration & Single-Use OTP Protection
6. Model Artifact Integrity & Locked SHA-256 Verification
7. Conformal Prediction Interval & OOD Security Bounds
8. System Health, Readiness, and Secret-Free Telemetry
"""

import os
import sys
import uuid
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend"))
root_dir = os.path.abspath(os.path.join(backend_dir, ".."))
for p in [backend_dir, root_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.main import app
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import get_password_hash, create_access_token, create_refresh_token, validate_password_strength, hash_token
from app.models import User, Organization, UserRole, Project, Molecule, PasswordResetCode
from ml.inference.loader import ModelLoader, ModelIntegrityError
from ml.inference.predictor import ResistancePredictor

client = TestClient(app)


# ─── 1. Authentication & JWT Hardening Tests ──────────────────────────────────

def test_unauthenticated_request_fails_with_401():
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
    assert "WWW-Authenticate" in res.headers
    assert "credentials required" in res.json()["detail"].lower()


def test_invalid_bearer_token_fails_with_401():
    res = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid.token.string"})
    assert res.status_code == 401
    assert "invalid or expired" in res.json()["detail"].lower()


def test_refresh_token_rejected_on_resource_endpoints():
    refresh_tok = create_refresh_token(subject="usr_001")
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {refresh_tok}"})
    assert res.status_code == 401
    assert "refresh token cannot be used" in res.json()["detail"].lower()


def test_deactivated_user_token_fails_with_403():
    db = SessionLocal()
    unique_email = f"deact_{uuid.uuid4().hex[:6]}@agri.bio"
    inactive_user = User(
        organization_id="org_bindwell_001",
        email=unique_email,
        hashed_password=get_password_hash("ResistanceIQ2026!#"),
        full_name="Deactivated Researcher",
        role=UserRole.ANALYST,
        is_active=False,
    )
    db.add(inactive_user)
    db.commit()
    db.refresh(inactive_user)

    inactive_tok = create_access_token(subject=inactive_user.id, role="ANALYST", organization_id="org_bindwell_001")
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {inactive_tok}"})
    db.close()
    assert res.status_code == 403
    assert any(k in res.json()["detail"].lower() for k in ["deactivated", "disabled", "inactive"])


# ─── 2. Role-Based Access Control (RBAC) Matrix Tests ────────────────────────

def test_analyst_cannot_access_admin_endpoints():
    analyst_tok = create_access_token(subject="usr_002", role="ANALYST", organization_id="org_bindwell_001")
    res = client.post(
        "/api/v1/auth/invite",
        json={"email": f"new_{uuid.uuid4().hex[:6]}@alpha.bio", "full_name": "New Member", "role": "ANALYST"},
        headers={"Authorization": f"Bearer {analyst_tok}"},
    )
    assert res.status_code == 403


def test_admin_can_access_admin_endpoints():
    admin_tok = create_access_token(subject="usr_001", role="ADMIN", organization_id="org_bindwell_001")
    res = client.post(
        "/api/v1/auth/invite",
        json={"email": f"researcher_{uuid.uuid4().hex[:6]}@alpha.bio", "full_name": "Dr. Researcher One", "role": "RESEARCHER"},
        headers={"Authorization": f"Bearer {admin_tok}"},
    )
    assert res.status_code == 201
    assert "invitation_token" in res.json()


# ─── 3. Multi-Tenant Cross-Organization Isolation Tests ───────────────────────

def test_cross_tenant_project_isolation():
    db = SessionLocal()
    # Create distinct Org Beta, User Beta, and Project Beta
    org_beta = Organization(name=f"Beta CropSciences {uuid.uuid4().hex[:4]}", slug=f"beta-{uuid.uuid4().hex[:6]}")
    db.add(org_beta)
    db.commit()

    user_beta = User(
        organization_id=org_beta.id,
        email=f"beta_{uuid.uuid4().hex[:6]}@betacrop.bio",
        hashed_password=get_password_hash("ResistanceIQ2026!#"),
        full_name="Dr. Beta Admin",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(user_beta)
    db.commit()

    proj_beta = Project(name="Beta Secret Discovery", organization_id=org_beta.id, status="ACTIVE")
    db.add(proj_beta)
    db.commit()

    token_a = create_access_token(subject="usr_001", role="ADMIN", organization_id="org_bindwell_001")
    token_b = create_access_token(subject=user_beta.id, role="ADMIN", organization_id=org_beta.id)

    # User A tries to access User B's project -> 404 (isolated)
    res_a_on_b = client.get(f"/api/v1/projects/{proj_beta.id}", headers={"Authorization": f"Bearer {token_a}"})
    assert res_a_on_b.status_code in [403, 404]

    # User B can access own project
    res_b_on_b = client.get(f"/api/v1/projects/{proj_beta.id}", headers={"Authorization": f"Bearer {token_b}"})
    assert res_b_on_b.status_code == 200
    assert res_b_on_b.json()["id"] == proj_beta.id

    db.close()


# ─── 4. Password Policy Hardening Tests ───────────────────────────────────────

def test_password_policy_rejection_rules():
    # Too short (< 8 chars)
    with pytest.raises(ValueError):
        validate_password_strength("Short1!")

    # Missing uppercase
    with pytest.raises(ValueError):
        validate_password_strength("lowercase123!@#")

    # Missing number
    with pytest.raises(ValueError):
        validate_password_strength("NoNumbersHere!@#")

    # Missing special character
    with pytest.raises(ValueError):
        validate_password_strength("NoSpecialChar1234")

    # Valid compliant password passes without error
    validate_password_strength("ResistanceIQ2026!#")


# ─── 5. Anti-Enumeration & Single-Use OTP Protection ──────────────────────────

def test_forgot_password_anti_enumeration():
    # Unknown email returns 200 generic message without leaking non-existence
    res = client.post("/api/v1/auth/forgot-password", json={"email": "nonexistent.user.12345@unknown.bio"})
    assert res.status_code == 200
    assert "message" in res.json()


def test_otp_code_is_single_use():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "eleanor.vance@bindwell.bio").first()
    if not user:
        user = db.query(User).first()

    raw_code = "778899"
    reset_entry = PasswordResetCode(
        user_id=user.id,
        code_hash=hash_token(raw_code),
        request_id="req_sec_otp_01",
        created_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
        attempt_count=0,
    )
    db.add(reset_entry)
    db.commit()

    # 1. First verification succeeds
    res1 = client.post("/api/v1/auth/verify-reset-code", json={"email": user.email, "code": raw_code})
    assert res1.status_code == 200
    reset_token = res1.json()["reset_token"]

    # 2. Reset password succeeds
    res_reset = client.post("/api/v1/auth/reset-password", json={"reset_token": reset_token, "new_password": "BrandNewSecure2026!#"})
    assert res_reset.status_code == 200

    # 3. Second reset attempt with same token fails immediately (single-use enforcement)
    res_replay = client.post("/api/v1/auth/reset-password", json={"reset_token": reset_token, "new_password": "AnotherNewPassword2026!#"})
    assert res_replay.status_code == 400

    db.close()


# ─── 6. Model Artifact Integrity & Checksum Enforcement ───────────────────────

def test_production_model_sha256_integrity():
    loader = ModelLoader()
    art = loader.load_model("v2.0.0-gbrt-ecfp4")

    # Assert locked SHA256 checksum
    assert art["artifact_sha256"] == "6fc915fa26716dc4a06bad71f586af95ee071acf11e9a5b8acdc5171fed55622"
    assert art["model_version"] == "v2.0.0-gbrt-ecfp4"

    # Assert estimator feature count is 1059
    model = art["model"]
    assert model.n_features_in_ == 1059


def test_predictor_conformal_bounds_and_validity():
    predictor = ResistancePredictor()
    result = predictor.predict({
        "chemical_name": "Chlorantraniliprole",
        "smiles": "CC1=CC(=C(C(=C1)C(=O)NC2=CC(=NN2C3=NC=CC=C3Cl)C(=O)NC)Cl)Br",
        "irac_moa_group": "28",
        "pest_name": "Plutella xylostella",
        "pest_order": "Lepidoptera",
        "assay_method": "Leaf-Dip",
    })

    assert result.predicted_resistance_ratio >= 1.0
    assert result.conformal_interval.rr_lower >= 1.0
    assert result.conformal_interval.rr_upper >= result.conformal_interval.rr_lower
    assert result.conformal_interval.alpha == 0.10
    assert result.conformal_interval.q_hat > 0.0


# ─── 7. System Health, Readiness & Zero Secret Exposure ────────────────────────

def test_system_health_and_readiness_probes():
    # 1. Health Probe
    res_health = client.get("/health")
    assert res_health.status_code == 200
    h_data = res_health.json()
    assert h_data["status"] == "HEALTHY"
    assert h_data["governance_status"] == "REQUIRES_VALIDATION"

    # 2. Readiness Probe
    res_ready = client.get("/health/ready")
    assert res_ready.status_code == 200
    r_data = res_ready.json()
    assert r_data["database"] == "ok"
    assert r_data["model"] == "ok"
    assert r_data["model_version"] == "v2.0.0-gbrt-ecfp4"

    # Assert zero credentials leaked in readiness response
    raw_text = res_ready.text
    for secret_keyword in ["password", "jwt_secret", "secret_key", "SMTP_PASSWORD", "PRIVATE_KEY"]:
        assert secret_keyword not in raw_text
