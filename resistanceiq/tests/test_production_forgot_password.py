"""
ResistanceIQ — Production Forgot Password & Email Verification Test Suite
========================================================================
Validates cryptographically secure OTP generation, hashed storage,
attempt rate limiting (max 5 attempts), 10-minute expiration, single-use
reset tokens, anti-enumeration security, production fail-closed isolation,
and full end-to-end credential updates with bcrypt.
"""

import os
import uuid
import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal, Base, engine
from app.models import User, UserRole, Organization, PasswordResetCode
from app.core.security import get_password_hash, verify_password, hash_token
from app.services.email_service import (
    email_service,
    EmailConfigurationError,
    EmailDeliveryError,
)
from app.core.config import settings


@pytest.fixture(autouse=True)
def ensure_db_schema():
    Base.metadata.create_all(bind=engine)
    email_service.clear_dev_mailbox()
    yield
    email_service.clear_dev_mailbox()


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def test_user(db: Session):
    unique_suffix = uuid.uuid4().hex[:8]
    org = Organization(name=f"Novartis AgTech {unique_suffix}", slug=f"novartis-{unique_suffix}")
    db.add(org)
    db.flush()

    raw_password = "InitialPassword2026!#"
    user = User(
        organization_id=org.id,
        email=f"scientist_{unique_suffix}@novartis.bio",
        hashed_password=get_password_hash(raw_password),
        first_name="Eleanor",
        last_name="Vance",
        full_name="Eleanor Vance",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user": user, "raw_password": raw_password, "org": org}


# ─── 1. Forgot Password Request Tests ─────────────────────────────────────────

def test_forgot_password_existing_user_dispatches_email(client: TestClient, test_user: dict, db: Session):
    user = test_user["user"]
    response = client.post("/api/v1/auth/forgot-password", json={"email": user.email})
    assert response.status_code == 200
    data = response.json()
    assert "verification" in data["message"].lower()
    assert data["expires_in_minutes"] == 10

    # Verify no OTP in API response
    assert "code" not in data
    assert "verification_code" not in data
    assert "otp" not in data

    # Verify code record stored hashed in database
    code_record = (
        db.query(PasswordResetCode)
        .filter(PasswordResetCode.user_id == user.id)
        .order_by(PasswordResetCode.created_at.desc())
        .first()
    )
    assert code_record is not None
    assert code_record.attempt_count == 0
    assert code_record.used_at is None
    exp_tz = code_record.expires_at if code_record.expires_at.tzinfo else code_record.expires_at.replace(tzinfo=timezone.utc)
    assert exp_tz > datetime.now(timezone.utc)

    # Verify real message dispatched to development mailbox
    msg = email_service.get_latest_dev_email(user.email)
    assert msg is not None
    assert msg["to_email"] == user.email
    assert len(msg["verification_code"]) == 6
    assert msg["verification_code"].isdigit()
    assert hash_token(msg["verification_code"]) == code_record.code_hash


def test_forgot_password_anti_enumeration_unknown_user(client: TestClient):
    unknown_email = f"unknown_{uuid.uuid4().hex[:8]}@nonexistent.bio"
    response = client.post("/api/v1/auth/forgot-password", json={"email": unknown_email})
    assert response.status_code == 200
    data = response.json()
    # Response message MUST be identical to prevent account enumeration
    assert "verification" in data["message"].lower()

    # Verify no email was dispatched
    msg = email_service.get_latest_dev_email(unknown_email)
    assert msg is None


def test_forgot_password_invalid_email_format(client: TestClient):
    response = client.post("/api/v1/auth/forgot-password", json={"email": "invalid-email-no-domain"})
    assert response.status_code == 422  # Pydantic EmailStr validation rejection


def test_forgot_password_rate_limiting(client: TestClient, test_user: dict):
    user = test_user["user"]
    # Send 3 requests (allowed)
    for _ in range(3):
        r = client.post("/api/v1/auth/forgot-password", json={"email": user.email})
        assert r.status_code == 200

    # 4th request must be rate-limited with HTTP 429
    r_blocked = client.post("/api/v1/auth/forgot-password", json={"email": user.email})
    assert r_blocked.status_code == 429
    assert "Too many password reset requests" in r_blocked.json()["detail"]


# ─── 2. Verification Code Tests ───────────────────────────────────────────────

def test_verify_reset_code_success(client: TestClient, test_user: dict):
    user = test_user["user"]
    client.post("/api/v1/auth/forgot-password", json={"email": user.email})

    msg = email_service.get_latest_dev_email(user.email)
    otp = msg["verification_code"]

    verify_res = client.post(
        "/api/v1/auth/verify-reset-code",
        json={"email": user.email, "code": otp},
    )
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert "reset_token" in verify_data
    assert len(verify_data["reset_token"]) >= 32
    assert verify_data["expires_in"] == 600


def test_verify_reset_code_incorrect_attempts_and_lockout(client: TestClient, test_user: dict, db: Session):
    user = test_user["user"]
    client.post("/api/v1/auth/forgot-password", json={"email": user.email})

    # Attempt 1-4 with invalid code
    for i in range(1, 5):
        r = client.post(
            "/api/v1/auth/verify-reset-code",
            json={"email": user.email, "code": "000000"},
        )
        assert r.status_code == 400
        assert f"{5 - i} attempt" in r.json()["detail"]

    # 5th attempt with invalid code must trigger lockout
    r5 = client.post(
        "/api/v1/auth/verify-reset-code",
        json={"email": user.email, "code": "000000"},
    )
    assert r5.status_code == 400
    assert "Maximum verification attempts exceeded" in r5.json()["detail"]

    # Even if correct code is entered afterwards, it is locked / invalidated
    msg = email_service.get_latest_dev_email(user.email)
    r_after = client.post(
        "/api/v1/auth/verify-reset-code",
        json={"email": user.email, "code": msg["verification_code"]},
    )
    assert r_after.status_code == 400
    assert "Invalid verification code or code has expired" in r_after.json()["detail"]


def test_verify_reset_code_expired(client: TestClient, test_user: dict, db: Session):
    user = test_user["user"]
    client.post("/api/v1/auth/forgot-password", json={"email": user.email})

    msg = email_service.get_latest_dev_email(user.email)
    otp = msg["verification_code"]

    # Force expiration in database
    code_record = (
        db.query(PasswordResetCode)
        .filter(PasswordResetCode.user_id == user.id)
        .order_by(PasswordResetCode.created_at.desc())
        .first()
    )
    code_record.expires_at = datetime.now(timezone.utc) - timedelta(seconds=10)
    db.commit()

    verify_res = client.post(
        "/api/v1/auth/verify-reset-code",
        json={"email": user.email, "code": otp},
    )
    assert verify_res.status_code == 400
    assert "expired" in verify_res.json()["detail"]


# ─── 3. Password Reset & Post-Reset Lifecycle Tests ───────────────────────────

def test_reset_password_full_lifecycle(client: TestClient, test_user: dict, db: Session):
    user = test_user["user"]
    old_password = test_user["raw_password"]
    new_password = "NewlyUpdatedSecurePass2026!#"

    # 1. Request OTP
    client.post("/api/v1/auth/forgot-password", json={"email": user.email})
    msg = email_service.get_latest_dev_email(user.email)
    otp = msg["verification_code"]

    # 2. Verify OTP
    v_res = client.post(
        "/api/v1/auth/verify-reset-code",
        json={"email": user.email, "code": otp},
    )
    reset_token = v_res.json()["reset_token"]

    # 3. Submit New Password
    r_res = client.post(
        "/api/v1/auth/reset-password",
        json={"reset_token": reset_token, "new_password": new_password},
    )
    assert r_res.status_code == 200
    assert "Password successfully reset" in r_res.json()["message"]

    # 4. Verify reset token is single-use and immediately invalidated
    r_res_reuse = client.post(
        "/api/v1/auth/reset-password",
        json={"reset_token": reset_token, "new_password": "AnotherPassword2026!#"},
    )
    assert r_res_reuse.status_code == 400
    assert "Invalid or expired password reset authorization" in r_res_reuse.json()["detail"]

    # 5. Verify old password fails
    login_old = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": old_password},
    )
    assert login_old.status_code == 401

    # 6. Verify new password succeeds
    login_new = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": new_password},
    )
    assert login_new.status_code == 200
    assert "access_token" in login_new.json()


def test_reset_password_weak_password_rejected(client: TestClient, test_user: dict):
    user = test_user["user"]
    client.post("/api/v1/auth/forgot-password", json={"email": user.email})
    msg = email_service.get_latest_dev_email(user.email)
    otp = msg["verification_code"]

    v_res = client.post(
        "/api/v1/auth/verify-reset-code",
        json={"email": user.email, "code": otp},
    )
    reset_token = v_res.json()["reset_token"]

    # Attempt weak password
    weak_res = client.post(
        "/api/v1/auth/reset-password",
        json={"reset_token": reset_token, "new_password": "weak"},
    )
    assert weak_res.status_code == 400
    assert "Password must be at least 8 characters long" in weak_res.json()["detail"]


# ─── 4. Production Security Isolation & Fail-Closed Gate ──────────────────────

def test_production_environment_fails_closed_when_smtp_missing(monkeypatch):
    """
    Verifies that when APP_ENV=production and no SMTP server is configured,
    the EmailService refuses to use the development mailbox and fails closed.
    """
    from app.services.email_service import EmailService

    # Simulate production environment without SMTP host
    monkeypatch.setattr(settings, "APP_ENV", "production")
    monkeypatch.setattr(settings, "SMTP_HOST", None)

    prod_email_service = EmailService()
    assert prod_email_service.app_env == "production"

    with pytest.raises(EmailConfigurationError) as exc_info:
        prod_email_service.send_password_reset_code(
            to_email="test@enterprise.bio",
            code="123456",
            first_name="Dr. Vance",
            request_id="test-req-123",
        )
    assert "EMAIL_PROVIDER_NOT_CONFIGURED" in str(exc_info.value)


# ─── 5. Development .EML File Verification ───────────────────────────────────

def test_dev_mailbox_eml_artifact_contains_rfc822_headers_and_body(client: TestClient, test_user: dict):
    user = test_user["user"]
    res = client.post("/api/v1/auth/forgot-password", json={"email": user.email})
    assert res.status_code == 200

    inbox_dir = os.path.abspath(settings.DEV_EMAIL_INBOX_DIR)
    eml_files = [f for f in os.listdir(inbox_dir) if f.endswith(".eml")]
    assert len(eml_files) > 0

    latest_eml = sorted(eml_files, reverse=True)[0]
    with open(os.path.join(inbox_dir, latest_eml), "r", encoding="utf-8") as f:
        content = f.read()

    assert f"To: {user.email}" in content
    assert f"<{settings.SMTP_FROM_EMAIL}>" in content
    assert "Subject: ResistanceIQ Password Reset Verification Code" in content
    assert "MIME-Version: 1.0" in content
    assert "Content-Type: multipart/alternative" in content


# ─── 6. Multi-Transport SMTP Mock Tests & Error Mappings ─────────────────────

def test_smtp_port_587_starttls_transport(monkeypatch):
    from unittest.mock import MagicMock, patch
    from app.services.email_service import EmailService

    monkeypatch.setattr(settings, "APP_ENV", "production")
    monkeypatch.setattr(settings, "EMAIL_PROVIDER", "smtp")
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.office365.com")
    monkeypatch.setattr(settings, "SMTP_PORT", 587)
    monkeypatch.setattr(settings, "SMTP_USERNAME", "sender@resistanceiq.bio")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "SecretPass123!")
    monkeypatch.setattr(settings, "SMTP_USE_TLS", True)

    mock_server = MagicMock()
    mock_server.sendmail.return_value = {}
    with patch("smtplib.SMTP", return_value=mock_server) as mock_smtp:
        service = EmailService()
        success = service.send_password_reset_code(
            to_email="scientist@domain.bio",
            code="654321",
            first_name="Dr. Vance",
            request_id="mock-req-587",
        )
        assert success is True
        mock_smtp.assert_called_once_with("smtp.office365.com", 587, timeout=12)
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("sender@resistanceiq.bio", "SecretPass123!")
        mock_server.sendmail.assert_called_once()


def test_smtp_port_465_ssl_transport(monkeypatch):
    from unittest.mock import MagicMock, patch
    from app.services.email_service import EmailService

    monkeypatch.setattr(settings, "APP_ENV", "production")
    monkeypatch.setattr(settings, "EMAIL_PROVIDER", "smtp")
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.gmail.com")
    monkeypatch.setattr(settings, "SMTP_PORT", 465)
    monkeypatch.setattr(settings, "SMTP_USERNAME", "notifications@resistanceiq.bio")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "AppPassword123!")

    mock_server = MagicMock()
    mock_server.sendmail.return_value = {}
    with patch("smtplib.SMTP_SSL", return_value=mock_server) as mock_smtp_ssl:
        service = EmailService()
        success = service.send_password_reset_code(
            to_email="lead@domain.bio",
            code="112233",
            first_name="Dr. Vance",
            request_id="mock-req-465",
        )
        assert success is True
        mock_smtp_ssl.assert_called_once()
        mock_server.login.assert_called_once_with("notifications@resistanceiq.bio", "AppPassword123!")
        mock_server.sendmail.assert_called_once()


def test_smtp_authentication_failure_maps_to_smtp_auth_failed(monkeypatch):
    from unittest.mock import patch
    import smtplib
    from app.services.email_service import EmailService, EmailDeliveryError

    monkeypatch.setattr(settings, "APP_ENV", "production")
    monkeypatch.setattr(settings, "EMAIL_PROVIDER", "smtp")
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.mailgun.org")
    monkeypatch.setattr(settings, "SMTP_PORT", 587)
    monkeypatch.setattr(settings, "SMTP_USERNAME", "postmaster@mailgun.org")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "WrongPassword")

    with patch("smtplib.SMTP") as mock_smtp:
        mock_instance = mock_smtp.return_value
        mock_instance.login.side_effect = smtplib.SMTPAuthenticationError(535, b"Authentication failed")

        service = EmailService()
        with pytest.raises(EmailDeliveryError) as exc_info:
            service.send_password_reset_code(
                to_email="user@test.bio",
                code="998877",
                request_id="auth-fail-req",
            )
        assert exc_info.value.code in ["SMTP_AUTH_FAILED", "AUTHENTICATION_FAILURE"]


# ─── 7. Real SMTP Connectivity & Diagnostic Endpoints ────────────────────────

def test_verify_smtp_connectivity_diagnostic_success(monkeypatch):
    from unittest.mock import MagicMock, patch
    from app.services.email_service import EmailService

    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.sendgrid.net")
    monkeypatch.setattr(settings, "SMTP_PORT", 587)
    monkeypatch.setattr(settings, "SMTP_USERNAME", "apikey")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "SG.mock_api_key_value")
    monkeypatch.setattr(settings, "SMTP_USE_TLS", True)

    mock_server = MagicMock()
    mock_server.mail.return_value = (250, b"Sender OK")
    mock_server.rcpt.return_value = (250, b"Recipient OK")
    mock_server.data.return_value = (250, b"2.0.0 Ok: queued as SG_12345")

    with patch("socket.getaddrinfo", return_value=[(2, 1, 6, "", ("198.51.100.1", 587))]), \
         patch("smtplib.SMTP", return_value=mock_server):
        service = EmailService()
        diag = service.verify_smtp_connectivity(test_recipient="external.researcher@domain.bio")
        assert diag["dns_resolution"] == "PASS"
        assert diag["tcp_connection"] == "PASS"
        assert diag["tls_negotiation"] == "PASS"
        assert diag["smtp_authentication"] == "PASS"
        assert diag["sender_acceptance"] == "PASS"
        assert diag["message_accepted"] == "PASS"
        assert "SG_12345" in diag["provider_response"]


def test_verify_smtp_connectivity_missing_host(monkeypatch):
    from app.services.email_service import EmailService

    monkeypatch.setattr(settings, "SMTP_HOST", None)
    service = EmailService()
    diag = service.verify_smtp_connectivity()
    assert diag["error_code"] == "EMAIL_PROVIDER_NOT_CONFIGURED"
    assert diag["dns_resolution"] == "FAIL"


def test_diagnostics_email_config_api_endpoint(client: TestClient):
    import json
    res = client.get("/api/v1/auth/diagnostics/email-config")
    assert res.status_code == 200
    data = res.json()
    assert "configuration" in data
    assert "sender_domain_authentication" in data
    assert "smtp_password" not in json.dumps(data).lower()
    assert "api_key" not in json.dumps(data).lower()


def test_diagnostics_email_delivery_api_endpoint(client: TestClient, monkeypatch):
    from unittest.mock import MagicMock, patch

    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.mock.bio")
    monkeypatch.setattr(settings, "SMTP_PORT", 587)
    monkeypatch.setattr(email_service, "smtp_host", "smtp.mock.bio")
    monkeypatch.setattr(email_service, "smtp_port", 587)

    mock_server = MagicMock()
    mock_server.mail.return_value = (250, b"OK")
    mock_server.rcpt.return_value = (250, b"OK")
    mock_server.data.return_value = (250, b"Queued")

    with patch("socket.getaddrinfo", return_value=[(2, 1, 6, "", ("127.0.0.1", 587))]), \
         patch("smtplib.SMTP", return_value=mock_server):
        res = client.post("/api/v1/auth/diagnostics/email-delivery?test_email=test@mock.bio")
        assert res.status_code == 200
        data = res.json()
        assert data["smtp_diagnostic"]["message_accepted"] == "PASS"


def test_forgot_password_invalidates_otp_on_delivery_failure(client: TestClient, test_user: dict, db: Session, monkeypatch):
    from app.services.email_service import EmailDeliveryError

    user = test_user["user"]

    def mock_fail(*args, **kwargs):
        raise EmailDeliveryError("SMTP_CONNECTION_FAILED", "Connection refused")

    monkeypatch.setattr(email_service, "send_password_reset_code", mock_fail)

    res = client.post("/api/v1/auth/forgot-password", json={"email": user.email})
    assert res.status_code == 503
    assert "We couldn't send the verification email right now" in res.json()["detail"]

    # Verify that the OTP record was marked used / invalidated
    code_record = (
        db.query(PasswordResetCode)
        .filter(PasswordResetCode.user_id == user.id)
        .order_by(PasswordResetCode.created_at.desc())
        .first()
    )
    assert code_record is not None
    assert code_record.used_at is not None
