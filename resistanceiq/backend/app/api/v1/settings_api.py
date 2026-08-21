import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Organization, User, ApiKey, UserRole, ActivityLog
from app.schemas import (
    OrganizationRead,
    OrganizationUpdate,
    UserRead,
    InviteUserRequest,
    UserRoleUpdateRequest,
)
from app.auth.dependencies import get_current_user, require_role
from app.core.security import get_password_hash, generate_secure_token, hash_token

router = APIRouter()


class CreateApiKeyRequest(BaseModel):
    name: str


# ─── Organization Profile ───────────────────────────────────────────────────
@router.get("/org", response_model=OrganizationRead)
def get_organization(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.put("/org", response_model=OrganizationRead)
@router.patch("/org", response_model=OrganizationRead)
def update_organization(
    payload: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    if payload.name:
        org.name = payload.name.strip()
    db.commit()
    db.refresh(org)
    return org


# ─── User & Team Management ─────────────────────────────────────────────────
@router.get("/users", response_model=List[UserRead])
@router.get("/team", response_model=List[UserRead])
def list_organization_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    users = (
        db.query(User)
        .filter(User.organization_id == current_user.organization_id)
        .order_by(User.created_at.asc())
        .all()
    )
    res = []
    for u in users:
        ur = UserRead.model_validate(u)
        ur.is_verified = u.email_verified
        res.append(ur)
    return res


@router.post("/users/invite", response_model=UserRead, status_code=status.HTTP_201_CREATED)
@router.post("/team/invite", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def invite_user(
    payload: InviteUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    clean_email = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=409, detail="A user with this email already exists.")

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
        role=payload.role,
        is_active=True,
        email_verified=False,
        invitation_token=hash_token(raw_token),
        invitation_expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(new_user)

    audit = ActivityLog(
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        action="USER_INVITED",
        event_type="ADMIN_USER_MANAGEMENT",
        resource_type="USER",
        resource_id=new_user.id,
        details=f"Invited '{new_user.email}' with role '{new_user.role.value}'",
    )
    db.add(audit)

    db.commit()
    db.refresh(new_user)

    ur = UserRead.model_validate(new_user)
    ur.is_verified = new_user.email_verified
    return ur


@router.patch("/users/{user_id}/role", response_model=UserRead)
def update_user_role(
    user_id: str,
    payload: UserRoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    user = db.query(User).filter(
        User.id == user_id,
        User.organization_id == current_user.organization_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = payload.role
    user.updated_at = datetime.now(timezone.utc)

    audit = ActivityLog(
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        action="USER_ROLE_CHANGED",
        event_type="ADMIN_USER_MANAGEMENT",
        resource_type="USER",
        resource_id=user.id,
        details=f"Changed role of '{user.email}' to '{payload.role.value}'",
    )
    db.add(audit)

    db.commit()
    db.refresh(user)

    ur = UserRead.model_validate(user)
    ur.is_verified = user.email_verified
    return ur


@router.post("/users/{user_id}/deactivate", response_model=UserRead)
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    user = db.query(User).filter(
        User.id == user_id,
        User.organization_id == current_user.organization_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account.")

    user.is_active = False
    user.updated_at = datetime.now(timezone.utc)

    audit = ActivityLog(
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        action="USER_DEACTIVATED",
        event_type="ADMIN_USER_MANAGEMENT",
        resource_type="USER",
        resource_id=user.id,
        details=f"Deactivated user '{user.email}'",
    )
    db.add(audit)

    db.commit()
    db.refresh(user)

    ur = UserRead.model_validate(user)
    ur.is_verified = user.email_verified
    return ur


@router.post("/users/{user_id}/reactivate", response_model=UserRead)
def reactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    user = db.query(User).filter(
        User.id == user_id,
        User.organization_id == current_user.organization_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = True
    user.updated_at = datetime.now(timezone.utc)

    audit = ActivityLog(
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        action="USER_REACTIVATED",
        event_type="ADMIN_USER_MANAGEMENT",
        resource_type="USER",
        resource_id=user.id,
        details=f"Reactivated user '{user.email}'",
    )
    db.add(audit)

    db.commit()
    db.refresh(user)

    ur = UserRead.model_validate(user)
    ur.is_verified = user.email_verified
    return ur


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/team/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    user = db.query(User).filter(
        User.id == user_id,
        User.organization_id == current_user.organization_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself from the organization.")

    db.delete(user)
    db.commit()
    return None


# ─── API Keys ───────────────────────────────────────────────────────────────
@router.get("/api-keys")
def list_api_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    keys = db.query(ApiKey).filter(ApiKey.organization_id == current_user.organization_id).all()
    return [
        {
            "id": k.id,
            "name": k.name,
            "key_prefix": k.key_prefix,
            "created_at": k.created_at,
            "last_used_at": k.last_used_at,
        }
        for k in keys
    ]


@router.post("/api-keys", status_code=status.HTTP_201_CREATED)
def create_api_key(
    payload: CreateApiKeyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    raw_secret = f"riq_live_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_secret.encode()).hexdigest()
    prefix = raw_secret[:12] + "..."

    key = ApiKey(
        organization_id=current_user.organization_id,
        name=payload.name,
        key_prefix=prefix,
        hashed_key=key_hash,
    )
    db.add(key)
    db.commit()
    db.refresh(key)

    return {
        "id": key.id,
        "name": key.name,
        "key_prefix": key.key_prefix,
        "secret": raw_secret,
        "created_at": key.created_at,
    }


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    key = db.query(ApiKey).filter(
        ApiKey.id == key_id,
        ApiKey.organization_id == current_user.organization_id,
    ).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")

    db.delete(key)
    db.commit()
    return None
