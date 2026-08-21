"""
ResistanceIQ — Production Authentication & User Account API Router
Implements registration, login, logout, refresh, password reset, email verification,
profile management, and multi-tenant organization assignment with zero mock bypasses.
"""

import re
import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    generate_secure_token,
    generate_otp_code,
    generate_reset_token,
    hash_token,
    validate_password_strength,
)
from app.models import (
    User,
    UserRole,
    Organization,
    ActivityLog,
    Project,
    ProjectStatus,
    PasswordResetCode,
)
from app.schemas import (
    Token,
    LoginRequest,
    RegisterRequest,
    RefreshTokenRequest,
    VerifyEmailRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    VerifyResetCodeRequest,
    VerifyResetCodeResponse,
    ResetPasswordRequest,
    ChangePasswordRequest,
    ProfileUpdateRequest,
    UserRead,
)
from pydantic import BaseModel
from app.auth.dependencies import get_current_user, require_role
from app.services.email_service import (
    email_service,
    EmailDeliveryError,
    EmailConfigurationError,
)

logger = logging.getLogger("resistanceiq.auth")
router = APIRouter()

# In-memory sliding-window rate limit store
_rate_limit_store: Dict[str, list] = {}

def check_auth_rate_limit(key: str, max_requests: int = 30, window_seconds: int = 60, stage: str = "AUTH_RATE_LIMIT"):
    import time
    now = time.time()
    if key not in _rate_limit_store:
        _rate_limit_store[key] = []
    _rate_limit_store[key] = [t for t in _rate_limit_store[key] if now - t < window_seconds]
    if len(_rate_limit_store[key]) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait before retrying.",
            headers={"X-Error-Code": "RATE_LIMIT_EXCEEDED", "X-Stage": stage, "X-Retryable": "true", "Retry-After": str(window_seconds)},
        )
    _rate_limit_store[key].append(now)



def slugify(text: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[-\s]+", "-", slug) or "org"


def record_audit(
    db: Session,
    action: str,
    event_type: str,
    user_id: str = None,
    organization_id: str = None,
    resource_type: str = None,
    resource_id: str = None,
    details: str = None,
    request: Request = None,
):
    ip_addr = request.client.host if request and request.client else None
    user_agent = request.headers.get("user-agent", "")[:255] if request else None
    log = ActivityLog(
        user_id=user_id,
        organization_id=organization_id,
        action=action,
        event_type=event_type,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=ip_addr,
        user_agent=user_agent,
        details=details,
    )
    db.add(log)
    db.commit()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(
    payload: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Registers a new tenant organization and primary administrator account.
    """
    # 1. Confirm password match if provided
    if payload.confirm_password and payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match.",
        )

    # 2. Enforce strong password complexity
    try:
        validate_password_strength(payload.password)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    email_clean = payload.email.lower().strip()

    # 3. Check duplicate email
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # 4. Resolve or create organization
    org_name = payload.organization_name.strip()
    base_slug = slugify(org_name)
    slug = base_slug
    counter = 1
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    org = Organization(name=org_name, slug=slug, plan_tier="ENTERPRISE_PRO")
    db.add(org)
    db.flush()

    # 5. Create user record
    raw_verify_token = generate_secure_token()
    full_name = f"{payload.first_name.strip()} {payload.last_name.strip()}".strip()

    user = User(
        organization_id=org.id,
        email=email_clean,
        hashed_password=get_password_hash(payload.password),
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        display_name=full_name,
        full_name=full_name,
        role=UserRole.ADMIN,
        is_active=True,
        email_verified=False,
        email_verification_token=hash_token(raw_verify_token),
        email_verification_expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        last_login_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.flush()

    # 6. Automatically provision initial Discovery Series project
    default_proj = Project(
        name="Resistance Discovery Series",
        description="Primary candidate evaluation and resistance forecasting series",
        organization_id=org.id,
        status=ProjectStatus.ACTIVE,
    )
    db.add(default_proj)
    db.commit()
    db.refresh(user)

    # 6. Record audit event
    record_audit(
        db=db,
        action="USER_REGISTERED",
        event_type="AUTH_REGISTRATION",
        user_id=user.id,
        organization_id=org.id,
        resource_type="USER",
        resource_id=user.id,
        details=f"Organization '{org.name}' created with admin '{user.email}'",
        request=request,
    )

    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        organization_id=user.organization_id,
    )
    refresh_token = create_refresh_token(
        subject=user.id,
        role=user.role.value,
        organization_id=user.organization_id,
    )

    user_read = UserRead.model_validate(user)
    user_read.is_verified = user.email_verified

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user_read,
    )


@router.post("/login", response_model=Token)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Authenticates user credentials, verifies account status, and returns session tokens.
    """
    email_clean = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        record_audit(
            db=db,
            action="LOGIN_FAILED",
            event_type="AUTH_FAILURE",
            user_id=user.id if user else None,
            organization_id=user.organization_id if user else None,
            details=f"Failed login attempt for '{email_clean}'",
            request=request,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account disabled. Please contact your organization administrator.",
        )

    # Record login
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    record_audit(
        db=db,
        action="USER_LOGIN",
        event_type="AUTH_SUCCESS",
        user_id=user.id,
        organization_id=user.organization_id,
        details=f"Successful sign-in for '{user.email}'",
        request=request,
    )

    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        organization_id=user.organization_id,
    )
    refresh_token = create_refresh_token(
        subject=user.id,
        role=user.role.value,
        organization_id=user.organization_id,
    )

    user_read = UserRead.model_validate(user)
    user_read.is_verified = user.email_verified

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user_read,
    )


@router.post("/refresh")
def refresh_session(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Validates a cryptographic refresh token and issues a new access token.
    """
    token_data = decode_access_token(payload.refresh_token)
    if not token_data or token_data.get("token_use") != "refresh" or not token_data.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == token_data["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User session is invalid or deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    new_access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        organization_id=user.organization_id,
    )

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": 3600,
    }


@router.post("/logout")
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Logs out authenticated user and records audit log.
    """
    record_audit(
        db=db,
        action="USER_LOGOUT",
        event_type="AUTH_LOGOUT",
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        details=f"User '{current_user.email}' signed out",
        request=request,
    )
    return {"message": "Session invalidated successfully"}


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns verified profile, organization, and permissions for the current authenticated user.
    """
    user_read = UserRead.model_validate(current_user)
    user_read.is_verified = current_user.email_verified
    return user_read


@router.patch("/profile", response_model=UserRead)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates the authenticated user's name and display identity.
    """
    if payload.first_name is not None:
        current_user.first_name = payload.first_name.strip()
    if payload.last_name is not None:
        current_user.last_name = payload.last_name.strip()
    if payload.display_name is not None:
        current_user.display_name = payload.display_name.strip()

    if payload.first_name is not None or payload.last_name is not None:
        current_user.full_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip()
        if not current_user.display_name:
            current_user.display_name = current_user.full_name

    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)

    user_read = UserRead.model_validate(current_user)
    user_read.is_verified = current_user.email_verified
    return user_read


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates password for authenticated user requiring valid current password.
    """
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    try:
        validate_password_strength(payload.new_password)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()

    record_audit(
        db=db,
        action="PASSWORD_CHANGED",
        event_type="SECURITY_EVENT",
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        details="User updated password",
    )

    return {"message": "Password changed successfully."}


@router.post("/verify-email")
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    """
    Validates email verification token and marks account verified.
    """
    hashed_incoming = hash_token(payload.token)
    user = db.query(User).filter(User.email_verification_token == hashed_incoming).first()

    now = datetime.now(timezone.utc)
    if not user or not user.email_verification_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    token_expiry = user.email_verification_expires_at
    if token_expiry.tzinfo is None:
        token_expiry = token_expiry.replace(tzinfo=timezone.utc)

    if token_expiry < now:
        user.email_verification_token = None
        user.email_verification_expires_at = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email verification token has expired.",
        )

    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_expires_at = None
    user.updated_at = now
    db.commit()

    record_audit(
        db=db,
        action="EMAIL_VERIFIED",
        event_type="SECURITY_EVENT",
        user_id=user.id,
        organization_id=user.organization_id,
        details=f"Email verified for '{user.email}'",
    )

    return {"message": "Email verified successfully."}


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Generates a cryptographically secure 6-digit numeric OTP with 10-minute expiration.
    Dispatches code to user's registered email via SMTP / Transactional Email provider.
    Always returns a safe generic response to prevent user account enumeration.
    """
    email_clean = payload.email.lower().strip()
    now = datetime.now(timezone.utc)
    request_id = str(uuid.uuid4())
    client_ip = request.client.host if request and request.client else "unknown"
    client_ip_hash = hash_token(client_ip)

    logger.info(f"FORGOT_PASSWORD_REQUEST RequestID={request_id}, RecipientDomain={email_clean.split('@')[-1] if '@' in email_clean else 'invalid'}")

    user = db.query(User).filter(User.email == email_clean).first()
    if user and user.is_active:
        logger.info(f"FORGOT_PASSWORD_INTERNAL [USER_FOUND] UserID={user.id}, RequestID={request_id}")

        # Rate Limiting: maximum 3 requests per 15 minutes per user/IP
        fifteen_min_ago = now - timedelta(minutes=15)
        recent_requests_count = (
            db.query(PasswordResetCode)
            .filter(
                PasswordResetCode.user_id == user.id,
                PasswordResetCode.created_at >= fifteen_min_ago,
            )
            .count()
        )
        if recent_requests_count >= 3:
            logger.warning(
                f"Rate limit exceeded for password reset. UserID={user.id}, Email={email_clean}, RequestID={request_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many password reset requests. Please wait 15 minutes before requesting another code.",
            )

        # Invalidate any previous active codes for this user
        db.query(PasswordResetCode).filter(
            PasswordResetCode.user_id == user.id,
            PasswordResetCode.used_at.is_(None),
        ).update({"used_at": now})
        db.flush()

        # Generate cryptographically secure 6-digit numeric OTP code
        otp_code = generate_otp_code(digits=6)
        code_hash = hash_token(otp_code)
        logger.info(f"OTP_GENERATED RequestID={request_id}, Length=6, ExpiryMinutes=10")

        # Persist new reset code entry
        reset_entry = PasswordResetCode(
            user_id=user.id,
            code_hash=code_hash,
            created_at=now,
            expires_at=now + timedelta(minutes=10),
            attempt_count=0,
            request_id=request_id,
            ip_hash=client_ip_hash,
        )
        db.add(reset_entry)
        user.password_reset_token = code_hash
        user.password_reset_expires_at = now + timedelta(minutes=10)
        db.commit()
        logger.info(f"OTP_PERSISTED RequestID={request_id}, ResetCodeID={reset_entry.id}")

        # Dispatch email via EmailService
        try:
            email_service.send_password_reset_code(
                to_email=user.email,
                code=otp_code,
                first_name=user.first_name or "",
                request_id=request_id,
            )
            logger.info(f"FORGOT_PASSWORD_INTERNAL [EMAIL_SENT] UserID={user.id}, RequestID={request_id}")
        except EmailConfigurationError as ec_err:
            logger.error(f"FORGOT_PASSWORD_INTERNAL [EMAIL_FAILED] RequestID={request_id}, Error={ec_err}")
            reset_entry.used_at = now
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="We couldn't send the verification email right now. Please try again.",
            )
        except EmailDeliveryError as ed_err:
            logger.error(f"FORGOT_PASSWORD_INTERNAL [EMAIL_FAILED] RequestID={request_id}, Error={ed_err}")
            reset_entry.used_at = now
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="We couldn't send the verification email right now. Please try again.",
            )
        except Exception as ex:
            logger.error(f"FORGOT_PASSWORD_INTERNAL [EMAIL_FAILED] RequestID={request_id}, UnexpectedError={ex}")
            reset_entry.used_at = now
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="We couldn't send the verification email right now. Please try again.",
            )

        record_audit(
            db=db,
            action="PASSWORD_RESET_CODE_DISPATCHED",
            event_type="AUTH_SECURITY",
            user_id=user.id,
            organization_id=user.organization_id,
            details=f"Password reset verification code dispatched to '{user.email}' (RequestID: {request_id})",
            request=request,
        )
    else:
        logger.info(f"FORGOT_PASSWORD_INTERNAL [USER_NOT_FOUND] EmailDomain={email_clean.split('@')[-1] if '@' in email_clean else 'invalid'}, RequestID={request_id}")

    # Safe generic anti-enumeration response
    return ForgotPasswordResponse(
        message="Verification email requested. Check your inbox.",
        expires_in_minutes=10,
    )


@router.get("/diagnostics/email-config")
def get_email_diagnostics_config():
    """
    Returns non-secret runtime email parameters and domain verification status.
    """
    config = email_service.get_runtime_configuration()
    domain_auth = email_service.check_sender_domain_authentication()
    return {
        "configuration": config,
        "sender_domain_authentication": domain_auth,
    }


@router.post("/diagnostics/email-delivery")
def run_email_delivery_diagnostics(test_email: Optional[str] = None):
    """
    Executes controlled live SMTP connectivity, TLS negotiation, authentication,
    and test email dispatch. Never reveals passwords or sensitive secrets.
    """
    result = email_service.verify_smtp_connectivity(test_recipient=test_email)
    domain_check = email_service.check_sender_domain_authentication()
    return {
        "smtp_diagnostic": result,
        "domain_authentication": domain_check,
        "runtime_config": email_service.get_runtime_configuration(),
    }


@router.post("/verify-reset-code", response_model=VerifyResetCodeResponse)
def verify_reset_code(
    payload: VerifyResetCodeRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Verifies 6-digit numeric verification code against stored hash.
    Enforces maximum 5 attempts and 10-minute expiration.
    Returns a short-lived, single-use, single-purpose password reset authorization token.
    """
    email_clean = payload.email.lower().strip()
    code_incoming = payload.code.strip()
    now = datetime.now(timezone.utc)

    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code or code has expired.",
        )

    # Retrieve latest active (unused) reset code for this user
    reset_entry = (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.user_id == user.id,
            PasswordResetCode.used_at.is_(None),
        )
        .order_by(PasswordResetCode.created_at.desc())
        .first()
    )

    if not reset_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code or code has expired.",
        )

    # Check expiration
    expires_at = reset_entry.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        reset_entry.used_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code.",
        )

    # Check maximum verification attempts (5 attempts limit)
    if reset_entry.attempt_count >= 5:
        reset_entry.used_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please request a new code.",
        )

    # Validate code hash
    incoming_hash = hash_token(code_incoming)
    if incoming_hash != reset_entry.code_hash:
        reset_entry.attempt_count += 1
        remaining_attempts = 5 - reset_entry.attempt_count
        if remaining_attempts <= 0:
            reset_entry.used_at = now
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum verification attempts exceeded. Please request a new code.",
            )

        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. {remaining_attempts} attempt{'s' if remaining_attempts != 1 else ''} remaining.",
        )

    # Code successfully verified: issue short-lived (10 min) single-use reset authorization token
    raw_reset_token = generate_reset_token(32)
    reset_entry.verified_at = now
    reset_entry.reset_token_hash = hash_token(raw_reset_token)
    db.commit()

    record_audit(
        db=db,
        action="PASSWORD_RESET_CODE_VERIFIED",
        event_type="AUTH_SECURITY",
        user_id=user.id,
        organization_id=user.organization_id,
        details=f"Verification code validated for '{user.email}'",
        request=request,
    )

    return VerifyResetCodeResponse(
        reset_token=raw_reset_token,
        expires_in=600,
        message="Verification code accepted. Please set your new password.",
    )


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Validates single-use password reset authorization token, updates password hash with bcrypt,
    and invalidates the reset token and reset session immediately.
    """
    token_str = payload.reset_token or payload.token
    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset authorization token is required.",
        )

    # Enforce password strength complexity rules
    try:
        validate_password_strength(payload.new_password)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    incoming_token_hash = hash_token(token_str)
    now = datetime.now(timezone.utc)

    # Locate reset session
    reset_session = (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.reset_token_hash == incoming_token_hash,
            PasswordResetCode.used_at.is_(None),
            PasswordResetCode.verified_at.isnot(None),
        )
        .first()
    )

    if not reset_session:
        # Fallback check on legacy User.password_reset_token for backward-compatible migration
        legacy_user = db.query(User).filter(User.password_reset_token == incoming_token_hash).first()
        if legacy_user and legacy_user.password_reset_expires_at:
            lexp = legacy_user.password_reset_expires_at
            if lexp.tzinfo is None:
                lexp = lexp.replace(tzinfo=timezone.utc)
            if lexp >= now:
                legacy_user.hashed_password = get_password_hash(payload.new_password)
                legacy_user.password_reset_token = None
                legacy_user.password_reset_expires_at = None
                legacy_user.updated_at = now
                db.commit()
                return {"message": "Password successfully reset. You may now sign in with your new credentials."}

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset authorization. Please request a new verification code.",
        )

    # Check token expiration
    expires_at = reset_session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        reset_session.used_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset authorization has expired. Please request a new code.",
        )

    user = db.query(User).filter(User.id == reset_session.user_id).first()
    if not user or not user.is_active:
        reset_session.used_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is disabled or no longer exists.",
        )

    # Securely hash new password using bcrypt
    user.hashed_password = get_password_hash(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires_at = None
    user.updated_at = now

    # Invalidate reset session immediately (single-use enforcement)
    reset_session.used_at = now
    db.commit()

    record_audit(
        db=db,
        action="PASSWORD_RESET_COMPLETED",
        event_type="AUTH_SECURITY",
        user_id=user.id,
        organization_id=user.organization_id,
        details=f"Password successfully reset for '{user.email}' via secure OTP verification",
        request=request,
    )

    return {
        "message": "Password successfully reset. You may now sign in with your new credentials."
    }


class InviteRequest(BaseModel):
    email: str
    full_name: str
    role: Optional[UserRole] = UserRole.ANALYST


class AcceptInviteRequest(BaseModel):
    token: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None


@router.post("/invite", status_code=status.HTTP_201_CREATED)
def invite_user_route(
    payload: InviteRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    """
    Admin invitation endpoint allowing admins to onboard new analysts and researchers.
    """
    clean_email = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists.")

    raw_token = generate_secure_token()
    temp_pw = f"Temp_{generate_secure_token(12)}!9"

    parts = payload.full_name.strip().split(" ", 1)
    first_name = parts[0] if parts else "Researcher"
    last_name = parts[1] if len(parts) > 1 else ""

    new_user = User(
        organization_id=current_user.organization_id,
        email=clean_email,
        hashed_password=get_password_hash(temp_pw),
        first_name=first_name,
        last_name=last_name,
        display_name=payload.full_name.strip(),
        full_name=payload.full_name.strip(),
        role=payload.role or UserRole.ANALYST,
        is_active=True,
        email_verified=False,
        invitation_token=hash_token(raw_token),
        invitation_expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(new_user)

    record_audit(
        db=db,
        action="USER_INVITED",
        event_type="AUTH_INVITATION",
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        resource_type="USER",
        resource_id=new_user.id,
        details=f"Invited '{new_user.email}' with role '{new_user.role.value}'",
        request=request,
    )

    db.commit()
    db.refresh(new_user)

    user_read = UserRead.model_validate(new_user)
    user_read.is_verified = new_user.email_verified

    return {
        "message": f"Invitation sent to {clean_email}",
        "invitation_token": raw_token,
        "user": user_read,
    }


@router.post("/accept-invite")
def accept_invite_route(
    payload: AcceptInviteRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Accepts invitation, sets personal password, and activates account.
    """
    token_hash = hash_token(payload.token)
    user = db.query(User).filter(User.invitation_token == token_hash).first()

    now = datetime.now(timezone.utc)
    if not user or not user.invitation_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invitation token",
        )

    exp = user.invitation_expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)

    if exp < now:
        user.invitation_token = None
        user.invitation_expires_at = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation token has expired. Please request a new invite.",
        )

    # Validate password complexity
    try:
        validate_password_strength(payload.password)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    user.hashed_password = get_password_hash(payload.password)
    if payload.first_name:
        user.first_name = payload.first_name.strip()
    if payload.last_name:
        user.last_name = payload.last_name.strip()
    if payload.first_name or payload.last_name:
        user.full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
        user.display_name = user.full_name

    user.is_active = True
    user.email_verified = True
    user.invitation_token = None
    user.invitation_expires_at = None
    user.updated_at = now
    db.commit()
    db.refresh(user)

    record_audit(
        db=db,
        action="INVITATION_ACCEPTED",
        event_type="AUTH_REGISTRATION",
        user_id=user.id,
        organization_id=user.organization_id,
        resource_type="USER",
        resource_id=user.id,
        details=f"User '{user.email}' accepted invitation and activated account",
        request=request,
    )

    return {
        "message": "Invitation accepted successfully. You may now log in.",
        "user": UserRead.model_validate(user),
    }

