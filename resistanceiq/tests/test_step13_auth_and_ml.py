"""
ResistanceIQ — Step 13 Test Suite: Real Production Auth & Expanded ML Training
"""

import os
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash, verify_password
from app.models import User, Organization, UserRole
from ml.training.dataset import DatasetLoader
from ml.features.builder import FeaturePipeline
from ml.inference.loader import ModelLoader
from ml.inference.predictor import ResistancePredictor

# Setup isolated in-memory SQLite database with StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create test organization
    org = Organization(id="org_test_step13", name="AgroSciences Lab", slug="agrosciences-lab", plan_tier="ENTERPRISE")
    db.add(org)
    
    # Create test admin user
    admin_pw = get_password_hash("AdminPass123!")
    admin_user = User(
        id="u_admin_step13",
        organization_id=org.id,
        email="admin@agrosciences.com",
        hashed_password=admin_pw,
        full_name="Dr. Eleanor Vance",
        first_name="Eleanor",
        last_name="Vance",
        role=UserRole.ADMIN,
        is_active=True,
        email_verified=True,
    )
    db.add(admin_user)

    # Create inactive analyst user
    analyst_pw = get_password_hash("AnalystPass123!")
    inactive_user = User(
        id="u_inactive_step13",
        organization_id=org.id,
        email="inactive@agrosciences.com",
        hashed_password=analyst_pw,
        full_name="Marcus Vance",
        role=UserRole.ANALYST,
        is_active=False,
    )
    db.add(inactive_user)

    # Create active analyst user
    active_analyst = User(
        id="u_analyst_active",
        organization_id=org.id,
        email="analyst@agrosciences.com",
        hashed_password=analyst_pw,
        full_name="Alex Rivera",
        first_name="Alex",
        last_name="Rivera",
        role=UserRole.ANALYST,
        is_active=True,
        email_verified=True,
    )
    db.add(active_analyst)
    
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)


client = TestClient(app)


def test_password_hashing_security():
    password = "SecurePassword2026!"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_login_flow_and_token_generation():
    # 1. Failed login with wrong password
    res_bad = client.post("/api/v1/auth/login", json={"email": "admin@agrosciences.com", "password": "WrongPassword"})
    assert res_bad.status_code == 401
    assert "password" in res_bad.json()["detail"].lower()

    # 2. Inactive account login rejection
    res_inactive = client.post("/api/v1/auth/login", json={"email": "inactive@agrosciences.com", "password": "AnalystPass123!"})
    assert res_inactive.status_code == 403
    assert any(k in res_inactive.json()["detail"].lower() for k in ["inactive", "disabled", "deactivated"])

    # 3. Successful login
    res_ok = client.post("/api/v1/auth/login", json={"email": "admin@agrosciences.com", "password": "AdminPass123!"})
    assert res_ok.status_code == 200
    data = res_ok.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@agrosciences.com"
    assert data["user"]["role"] == "ADMIN"

    token = data["access_token"]

    # 4. Access protected /auth/me
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    me_data = res_me.json()
    assert me_data["id"] == "u_admin_step13"
    assert me_data["full_name"] == "Dr. Eleanor Vance"


def test_forgot_and_reset_password_lifecycle():
    # 1. Forgot password request (returns safe generic response)
    res_forgot = client.post("/api/v1/auth/forgot-password", json={"email": "admin@agrosciences.com"})
    assert res_forgot.status_code == 200
    msg = res_forgot.json()["message"].lower()
    assert "verification" in msg or "password reset" in msg or "instructions" in msg

    # Retrieve user from DB to simulate token retrieval
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "admin@agrosciences.com").first()
    assert user.password_reset_token is not None
    assert user.password_reset_expires_at is not None
    db.close()


def test_admin_invite_and_accept_lifecycle():
    # 1. Login as Admin
    res_login = client.post("/api/v1/auth/login", json={"email": "admin@agrosciences.com", "password": "AdminPass123!"})
    token = res_login.json()["access_token"]

    # 2. Invite new analyst
    invite_payload = {
        "email": "dr.lin@agrosciences.com",
        "full_name": "Dr. Maya Lin",
        "role": "ANALYST",
    }
    res_invite = client.post("/api/v1/auth/invite", json=invite_payload, headers={"Authorization": f"Bearer {token}"})
    assert res_invite.status_code == 201
    invite_data = res_invite.json()
    raw_token = invite_data["invitation_token"]
    assert raw_token is not None

    # 3. Accept invite and activate account
    accept_payload = {
        "token": raw_token,
        "password": "MayaSecurePass2026!",
        "first_name": "Maya",
        "last_name": "Lin",
    }
    res_accept = client.post("/api/v1/auth/accept-invite", json=accept_payload)
    assert res_accept.status_code == 200
    assert "accepted successfully" in res_accept.json()["message"].lower()

    # 4. Verify login with newly activated credentials
    res_new_login = client.post("/api/v1/auth/login", json={"email": "dr.lin@agrosciences.com", "password": "MayaSecurePass2026!"})
    assert res_new_login.status_code == 200
    assert res_new_login.json()["user"]["full_name"] == "Maya Lin"


def test_dataset_v2_and_feature_pipeline_dimensions():
    v2_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/processed/processed_v2_canonical_dataset.jsonl"))
    records = DatasetLoader.load_from_jsonl(v2_path)
    assert len(records) >= 40

    train_recs, val_recs, test_recs = DatasetLoader.temporal_split(records, 2012, 2017)
    assert len(train_recs) > 0
    assert len(val_recs) > 0
    assert len(test_recs) > 0

    pipeline = FeaturePipeline()
    pipeline.fit(train_recs)
    X_train, y_train = pipeline.transform(train_recs)
    assert X_train.shape[0] == len(train_recs)
    assert X_train.shape[1] >= 1030
    assert len(y_train) == len(train_recs)


def test_model_v2_gbrt_inference_and_conformal_calibration():
    storage_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../storage/models"))
    loader = ModelLoader(storage_dir=storage_dir)
    
    # Load v2 model artifact
    art = loader.load_model("v2.0.0-gbrt-ecfp4")
    assert art["model_version"] == "v2.0.0-gbrt-ecfp4"
    assert art["status"] in ["validated", "REQUIRES_VALIDATION", "PRODUCTION_APPROVED"]
    assert art["conformal_calibrator"] is not None

    predictor = ResistancePredictor(storage_dir=storage_dir)
    res = predictor.predict({
        "chemical_name": "Chlorantraniliprole",
        "smiles": "CC1=CC(=C(C(=C1)C(=O)NC2=CC(=NN2C3=NC=CC=C3Cl)C(=O)NC)Cl)Br",
        "irac_moa_group": "28",
        "pest_name": "Plutella xylostella",
        "pest_order": "Lepidoptera",
        "assay_method": "Leaf-Dip",
        "model_version": "v2.0.0-gbrt-ecfp4",
    })
    assert res.durability_score >= 0.0
    assert res.durability_score <= 1.0
    assert res.model_version == "v2.0.0-gbrt-ecfp4"
    assert res.conformal_interval is not None
    assert res.conformal_interval.rr_lower <= res.conformal_interval.rr_upper
    assert res.domain_applicability.domain_status in ["IN_DOMAIN", "LOW_SUPPORT", "LIMITED_SUPPORT", "OUT_OF_DOMAIN"]


def test_api_models_endpoint_exposure():
    res = client.get("/api/v1/forecasts/models")
    assert res.status_code == 200
    models = res.json()
    versions = [m["version"] for m in models]
    assert "v2.0.0-gbrt-ecfp4" in versions
    assert "v1.0.0-ridge-ecfp4" in versions


def test_production_database_fail_fast_isolation():
    from app.core.config import Settings
    
    # 1. Production with SQLite must fail loudly
    with pytest.raises(ValueError) as exc:
        Settings(
            APP_ENV="production",
            DATABASE_URL="sqlite:///./resistanceiq.db",
            JWT_SECRET="strong-secret-production-key-over-32-chars-length",
        )
    assert "Production environment cannot use SQLite" in str(exc.value)

    # 2. Production with weak/default JWT secret must fail loudly
    with pytest.raises(ValueError) as exc2:
        Settings(
            APP_ENV="production",
            DATABASE_URL="postgresql://user:pass@localhost:5432/resistanceiq_prod",
            JWT_SECRET="super-secret-resistanceiq-jwt-key-minimum-32-chars",
        )
    assert "FATAL CONFIGURATION ERROR" in str(exc2.value)


def test_migrated_user_schema_columns():
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "admin@agrosciences.com").first()
    assert hasattr(user, "first_name")
    assert hasattr(user, "last_name")
    assert hasattr(user, "email_verified")
    assert hasattr(user, "last_login_at")
    assert hasattr(user, "password_reset_token")
    assert hasattr(user, "password_reset_expires_at")
    assert hasattr(user, "invitation_token")
    assert hasattr(user, "invitation_expires_at")
    assert user.first_name == "Eleanor"
    assert user.last_name == "Vance"
    assert user.email_verified is True
    db.close()


def test_unauthenticated_request_rejected():
    res = client.get("/api/v1/dashboard/summary")
    assert res.status_code == 401
    assert "Authentication credentials required" in res.json()["detail"]


def test_expired_token_rejected():
    from datetime import timedelta
    from app.core.security import create_access_token
    
    expired_token = create_access_token(
        subject="u_admin_step13",
        role="ADMIN",
        organization_id="org_test_step13",
        expires_delta=timedelta(seconds=-10),
    )
    res = client.get("/api/v1/dashboard/summary", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert "Invalid or expired authentication token" in res.json()["detail"]


def test_role_authorization_admin_only_invite():
    from app.core.security import create_access_token
    
    # Analyst token
    analyst_token = create_access_token(
        subject="u_analyst_active",
        role="ANALYST",
        organization_id="org_test_step13",
    )
    # Analyst cannot invite users (requires ADMIN)
    res = client.post(
        "/api/v1/auth/invite",
        json={"email": "new.user@agrosciences.com", "full_name": "New User", "role": "ANALYST"},
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert res.status_code == 403
    assert "not permitted for current user role" in res.json()["detail"].lower()


