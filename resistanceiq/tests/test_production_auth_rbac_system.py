"""
ResistanceIQ — Production Authentication & User Account System Automated Test Suite
===================================================================================
Tests real registration, password complexity validation, login with bcrypt verification,
session tokens, email verification, password reset, profile management,
Role-Based Access Control (RBAC), multi-tenant data isolation, and audit logging.
Zero mock bypasses.
"""

import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models import User, UserRole, Organization, Project, ActivityLog
from app.core.security import get_password_hash, create_access_token, hash_token


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def unauthed_client():
    return TestClient(app)


# ─── 1. Registration Tests ───────────────────────────────────────────────────
def test_user_registration_success(unauthed_client, db_session):
    unique_email = f"lead_{uuid.uuid4().hex[:8]}@agriscience.org"
    payload = {
        "first_name": "Elena",
        "last_name": "Rostova",
        "email": unique_email,
        "organization_name": f"AgriScience Bio {uuid.uuid4().hex[:6]}",
        "password": "SecurePass2026!#",
        "confirm_password": "SecurePass2026!#",
    }
    response = unauthed_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201, response.text
    data = response.json()

    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == unique_email.lower()
    assert data["user"]["role"] == "ADMIN"
    assert data["user"]["first_name"] == "Elena"
    assert data["user"]["last_name"] == "Rostova"

    # Verify user exists in database
    created_user = db_session.query(User).filter(User.email == unique_email.lower()).first()
    assert created_user is not None
    assert created_user.organization_id is not None


def test_user_registration_weak_password_rejected(unauthed_client):
    weak_passwords = [
        "short1!",        # < 8 chars
        "alllowercase1!", # No uppercase
        "ALLUPPERCASE1!", # No lowercase
        "NoNumberSpecial!", # No number
        "NoSpecialChar123", # No special symbol
    ]
    for weak_pw in weak_passwords:
        payload = {
            "first_name": "Test",
            "last_name": "User",
            "email": f"test_{uuid.uuid4().hex[:6]}@agri.org",
            "organization_name": "Test Org",
            "password": weak_pw,
            "confirm_password": weak_pw,
        }
        res = unauthed_client.post("/api/v1/auth/register", json=payload)
        assert res.status_code == 400, f"Expected 400 for password '{weak_pw}'"


def test_user_registration_duplicate_email_rejected(unauthed_client):
    unique_email = f"dup_{uuid.uuid4().hex[:8]}@agriscience.org"
    payload = {
        "first_name": "Dup",
        "last_name": "User",
        "email": unique_email,
        "organization_name": "Dup Org",
        "password": "ValidPassword2026!$",
        "confirm_password": "ValidPassword2026!$",
    }
    res1 = unauthed_client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    # Second registration with same email
    res2 = unauthed_client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"].lower()


# ─── 2. Login & Authentication Tests ─────────────────────────────────────────
def test_login_success_and_last_login_update(unauthed_client, db_session):
    unique_email = f"login_{uuid.uuid4().hex[:8]}@bindwell.bio"
    password = "MyComplexPassword2026!*"

    # Register user first
    unauthed_client.post("/api/v1/auth/register", json={
        "first_name": "Login",
        "last_name": "Tester",
        "email": unique_email,
        "organization_name": "Login Org",
        "password": password,
        "confirm_password": password,
    })

    # Perform login
    login_res = unauthed_client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": password,
    })
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["user"]["email"] == unique_email.lower()

    # Check last_login_at in DB
    user = db_session.query(User).filter(User.email == unique_email.lower()).first()
    assert user.last_login_at is not None


def test_login_invalid_password_rejected(unauthed_client):
    unique_email = f"invalid_pw_{uuid.uuid4().hex[:8]}@bindwell.bio"
    password = "CorrectPassword2026!*"

    unauthed_client.post("/api/v1/auth/register", json={
        "first_name": "Test",
        "last_name": "User",
        "email": unique_email,
        "organization_name": "Login Org",
        "password": password,
        "confirm_password": password,
    })

    login_res = unauthed_client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": "WrongPassword123!",
    })
    assert login_res.status_code == 401
    assert "invalid" in login_res.json()["detail"].lower()


def test_login_deactivated_account_rejected(unauthed_client, db_session):
    unique_email = f"deact_{uuid.uuid4().hex[:8]}@bindwell.bio"
    password = "ValidPassword2026!#"

    reg_res = unauthed_client.post("/api/v1/auth/register", json={
        "first_name": "Deactivated",
        "last_name": "User",
        "email": unique_email,
        "organization_name": "Deact Org",
        "password": password,
        "confirm_password": password,
    })
    user_id = reg_res.json()["user"]["id"]

    # Deactivate account in database
    user = db_session.query(User).filter(User.id == user_id).first()
    user.is_active = False
    db_session.commit()

    # Attempt login
    login_res = unauthed_client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": password,
    })
    assert login_res.status_code == 403
    assert "disabled" in login_res.json()["detail"].lower() or "deactivated" in login_res.json()["detail"].lower()


# ─── 3. Token & Session Management Tests ─────────────────────────────────────
def test_unauthenticated_request_strictly_rejected(unauthed_client):
    # Protected endpoints must return 401 when no token is supplied
    res_me = unauthed_client.get("/api/v1/auth/me")
    assert res_me.status_code == 401

    res_projects = unauthed_client.get("/api/v1/projects")
    assert res_projects.status_code == 401

    res_forecasts = unauthed_client.get("/api/v1/forecasts")
    assert res_forecasts.status_code == 401


def test_refresh_token_session_rotation(unauthed_client):
    unique_email = f"refresh_{uuid.uuid4().hex[:8]}@bindwell.bio"
    password = "ValidPassword2026!#"

    reg_res = unauthed_client.post("/api/v1/auth/register", json={
        "first_name": "Refresh",
        "last_name": "Tester",
        "email": unique_email,
        "organization_name": "Refresh Org",
        "password": password,
        "confirm_password": password,
    })
    refresh_token = reg_res.json()["refresh_token"]

    refresh_res = unauthed_client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token,
    })
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()

    # Access protected route with new access token
    new_token = refresh_res.json()["access_token"]
    authed_client = TestClient(app, headers={"Authorization": f"Bearer {new_token}"})
    me_res = authed_client.get("/api/v1/auth/me")
    assert me_res.status_code == 200
    assert me_res.json()["email"] == unique_email.lower()


# ─── 4. User Profile & Password Change Tests ─────────────────────────────────
def test_profile_update_and_get_me(unauthed_client):
    unique_email = f"profile_{uuid.uuid4().hex[:8]}@bindwell.bio"
    password = "ValidPassword2026!#"

    reg_res = unauthed_client.post("/api/v1/auth/register", json={
        "first_name": "OriginalFirst",
        "last_name": "OriginalLast",
        "email": unique_email,
        "organization_name": "Profile Org",
        "password": password,
        "confirm_password": password,
    })
    token = reg_res.json()["access_token"]
    client = TestClient(app, headers={"Authorization": f"Bearer {token}"})

    # Update profile
    patch_res = client.patch("/api/v1/auth/profile", json={
        "first_name": "UpdatedFirst",
        "last_name": "UpdatedLast",
        "display_name": "Dr. Updated Lead",
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["first_name"] == "UpdatedFirst"
    assert patch_res.json()["last_name"] == "UpdatedLast"
    assert patch_res.json()["display_name"] == "Dr. Updated Lead"

    # Verify GET /me
    me_res = client.get("/api/v1/auth/me")
    assert me_res.status_code == 200
    assert me_res.json()["display_name"] == "Dr. Updated Lead"


def test_change_password_flow(unauthed_client):
    unique_email = f"chg_pw_{uuid.uuid4().hex[:8]}@bindwell.bio"
    old_pw = "OldPassword2026!#"
    new_pw = "NewPassword2026!$"

    reg_res = unauthed_client.post("/api/v1/auth/register", json={
        "first_name": "Pass",
        "last_name": "Changer",
        "email": unique_email,
        "organization_name": "Pass Org",
        "password": old_pw,
        "confirm_password": old_pw,
    })
    token = reg_res.json()["access_token"]
    client = TestClient(app, headers={"Authorization": f"Bearer {token}"})

    # Change password
    chg_res = client.post("/api/v1/auth/change-password", json={
        "current_password": old_pw,
        "new_password": new_pw,
    })
    assert chg_res.status_code == 200

    # Old password no longer works
    fail_res = unauthed_client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": old_pw,
    })
    assert fail_res.status_code == 401

    # New password works
    success_res = unauthed_client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": new_pw,
    })
    assert success_res.status_code == 200


# ─── 5. Password Reset & Email Verification Tests ────────────────────────────
def test_forgot_and_reset_password_flow(unauthed_client, db_session):
    unique_email = f"reset_{uuid.uuid4().hex[:8]}@bindwell.bio"
    orig_pw = "OriginalPass2026!#"
    reset_pw = "ResetCompletedPass2026!$"

    unauthed_client.post("/api/v1/auth/register", json={
        "first_name": "Forgot",
        "last_name": "User",
        "email": unique_email,
        "organization_name": "Forgot Org",
        "password": orig_pw,
        "confirm_password": orig_pw,
    })

    # Request reset
    forgot_res = unauthed_client.post("/api/v1/auth/forgot-password", json={
        "email": unique_email,
    })
    assert forgot_res.status_code == 200
    assert "verification" in forgot_res.json()["message"].lower()

    # Non-existent email returns same safe response
    ghost_res = unauthed_client.post("/api/v1/auth/forgot-password", json={
        "email": "nonexistent_ghost@fake.bio",
    })
    assert ghost_res.status_code == 200
    assert ghost_res.json()["message"] == forgot_res.json()["message"]

    # Retrieve OTP from email service and verify
    from app.services.email_service import email_service
    msg = email_service.get_latest_dev_email(unique_email)
    assert msg is not None
    otp = msg["verification_code"]

    verify_res = unauthed_client.post("/api/v1/auth/verify-reset-code", json={
        "email": unique_email,
        "code": otp,
    })
    assert verify_res.status_code == 200
    reset_token = verify_res.json()["reset_token"]

    reset_res = unauthed_client.post("/api/v1/auth/reset-password", json={
        "reset_token": reset_token,
        "new_password": reset_pw,
    })
    assert reset_res.status_code == 200

    # Sign in with reset password
    login_res = unauthed_client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": reset_pw,
    })
    assert login_res.status_code == 200


def test_email_verification_flow(unauthed_client, db_session):
    unique_email = f"verify_{uuid.uuid4().hex[:8]}@bindwell.bio"
    password = "ValidPassword2026!#"

    unauthed_client.post("/api/v1/auth/register", json={
        "first_name": "Verify",
        "last_name": "User",
        "email": unique_email,
        "organization_name": "Verify Org",
        "password": password,
        "confirm_password": password,
    })

    user = db_session.query(User).filter(User.email == unique_email.lower()).first()
    assert user.email_verified is False

    raw_token = "verification_raw_token_xyz"
    user.email_verification_token = hash_token(raw_token)
    db_session.commit()

    ver_res = unauthed_client.post("/api/v1/auth/verify-email", json={"token": raw_token})
    assert ver_res.status_code == 200

    db_session.refresh(user)
    assert user.email_verified is True


# ─── 6. RBAC & Multi-Tenant Isolation Tests ──────────────────────────────────
def test_admin_user_management_and_invitation(unauthed_client):
    # 1. Register Admin
    admin_email = f"admin_{uuid.uuid4().hex[:8]}@orgmaster.bio"
    admin_pw = "AdminPass2026!#"
    reg_res = unauthed_client.post("/api/v1/auth/register", json={
        "first_name": "Admin",
        "last_name": "Master",
        "email": admin_email,
        "organization_name": "Org Master Inc",
        "password": admin_pw,
        "confirm_password": admin_pw,
    })
    admin_token = reg_res.json()["access_token"]
    admin_client = TestClient(app, headers={"Authorization": f"Bearer {admin_token}"})

    # 2. Invite Researcher
    invite_email = f"invited_{uuid.uuid4().hex[:8]}@orgmaster.bio"
    invite_res = admin_client.post("/api/v1/settings/users/invite", json={
        "email": invite_email,
        "full_name": "Dr. Invited Scientist",
        "role": "RESEARCHER",
    })
    assert invite_res.status_code == 201
    invited_id = invite_res.json()["id"]

    # 3. List Users
    list_res = admin_client.get("/api/v1/settings/users")
    assert list_res.status_code == 200
    emails = [u["email"] for u in list_res.json()]
    assert invite_email.lower() in emails

    # 4. Update Role
    role_res = admin_client.patch(f"/api/v1/settings/users/{invited_id}/role", json={
        "role": "ANALYST",
    })
    assert role_res.status_code == 200
    assert role_res.json()["role"] == "ANALYST"

    # 5. Deactivate & Reactivate
    deact_res = admin_client.post(f"/api/v1/settings/users/{invited_id}/deactivate")
    assert deact_res.status_code == 200
    assert deact_res.json()["is_active"] is False

    react_res = admin_client.post(f"/api/v1/settings/users/{invited_id}/reactivate")
    assert react_res.status_code == 200
    assert react_res.json()["is_active"] is True

    # 6. Delete User
    del_res = admin_client.delete(f"/api/v1/settings/users/{invited_id}")
    assert del_res.status_code == 204


def test_rbac_role_enforcement_matrix(unauthed_client, db_session):
    org = Organization(name="RBAC Org", slug=f"rbac-{uuid.uuid4().hex[:6]}")
    db_session.add(org)
    db_session.flush()

    pwd = get_password_hash("ValidPass2026!#")
    viewer = User(organization_id=org.id, email=f"viewer_{uuid.uuid4().hex[:6]}@rbac.org", hashed_password=pwd, full_name="Viewer User", role=UserRole.VIEWER)
    researcher = User(organization_id=org.id, email=f"researcher_{uuid.uuid4().hex[:6]}@rbac.org", hashed_password=pwd, full_name="Researcher User", role=UserRole.RESEARCHER)
    db_session.add_all([viewer, researcher])
    db_session.commit()

    viewer_token = create_access_token(subject=viewer.id, role="VIEWER", organization_id=org.id)
    researcher_token = create_access_token(subject=researcher.id, role="RESEARCHER", organization_id=org.id)

    viewer_client = TestClient(app, headers={"Authorization": f"Bearer {viewer_token}"})
    researcher_client = TestClient(app, headers={"Authorization": f"Bearer {researcher_token}"})

    # Viewer CAN view projects
    v_list = viewer_client.get("/api/v1/projects")
    assert v_list.status_code == 200

    # Viewer CANNOT create project (403 Forbidden)
    v_create = viewer_client.post("/api/v1/projects", json={"name": "Viewer Project", "description": "Forbidden"})
    assert v_create.status_code == 403

    # Researcher CAN create project (201 Created)
    r_create = researcher_client.post("/api/v1/projects", json={"name": "Researcher Project", "description": "Allowed"})
    assert r_create.status_code == 201


def test_multi_tenant_organization_isolation(unauthed_client, db_session):
    # Organization A
    org_a = Organization(name="Tenant Org A", slug=f"org-a-{uuid.uuid4().hex[:6]}")
    # Organization B
    org_b = Organization(name="Tenant Org B", slug=f"org-b-{uuid.uuid4().hex[:6]}")
    db_session.add_all([org_a, org_b])
    db_session.flush()

    pwd = get_password_hash("ValidPass2026!#")
    user_a = User(organization_id=org_a.id, email=f"usera_{uuid.uuid4().hex[:6]}@orga.com", hashed_password=pwd, full_name="User A", role=UserRole.ADMIN)
    user_b = User(organization_id=org_b.id, email=f"userb_{uuid.uuid4().hex[:6]}@orgb.com", hashed_password=pwd, full_name="User B", role=UserRole.ADMIN)
    db_session.add_all([user_a, user_b])
    db_session.flush()

    # Project belonging to Org A
    project_a = Project(organization_id=org_a.id, name="Secret Org A Project", description="Confidential")
    db_session.add(project_a)
    db_session.commit()

    token_b = create_access_token(subject=user_b.id, role="ADMIN", organization_id=org_b.id)
    client_b = TestClient(app, headers={"Authorization": f"Bearer {token_b}"})

    # User B list projects -> must NOT see Project A
    b_projects = client_b.get("/api/v1/projects").json()
    b_project_ids = [p["id"] for p in b_projects]
    assert project_a.id not in b_project_ids

    # User B attempt to GET Project A directly -> 404 Not Found
    get_res = client_b.get(f"/api/v1/projects/{project_a.id}")
    assert get_res.status_code == 404


def test_audit_logging_events_recorded(unauthed_client, db_session):
    unique_email = f"audit_{uuid.uuid4().hex[:8]}@auditbio.com"
    password = "AuditPassword2026!#"

    # Register
    reg_res = unauthed_client.post("/api/v1/auth/register", json={
        "first_name": "Audit",
        "last_name": "Tester",
        "email": unique_email,
        "organization_name": "Audit Bio Inc",
        "password": password,
        "confirm_password": password,
    })
    assert reg_res.status_code == 201
    user_id = reg_res.json()["user"]["id"]

    # Verify audit log exists in database
    reg_log = db_session.query(ActivityLog).filter(
        ActivityLog.user_id == user_id,
        ActivityLog.action == "USER_REGISTERED",
    ).first()
    assert reg_log is not None
    assert reg_log.event_type == "AUTH_REGISTRATION"
