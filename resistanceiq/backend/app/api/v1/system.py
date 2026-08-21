import os
from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.config import settings
from app.schemas import SystemHealth
from ml.inference.loader import ModelLoader

router = APIRouter()


@router.get("/health", response_model=SystemHealth)
def health_check(db: Session = Depends(get_db)):
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return SystemHealth(
        status="ONLINE" if db_ok else "DEGRADED",
        version="v2.0.0",
        environment=settings.APP_ENV,
        database_connected=db_ok,
        ml_service_status="OPERATIONAL",
        timestamp=datetime.now(timezone.utc),
    )


@router.get("/health/ready")
@router.get("/ready")
def readiness_check(response: Response, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Readiness probe validating DB connectivity, ML model availability, and email provider.
    Never exposes secrets.
    """
    checks = {
        "status": "ready",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": settings.APP_ENV,
        "database": "ok",
        "model": "ok",
        "model_version": "v2.0.0-gbrt-ecfp4",
        "model_status": "REQUIRES_VALIDATION",
        "email": "unconfigured",
    }

    # 1. Check Database
    try:
        db.execute(text("SELECT 1"))
    except Exception as dbe:
        checks["database"] = "error"
        checks["status"] = "degraded"

    # 2. Check Model
    try:
        loader = ModelLoader()
        art = loader.load_model()
        if not art:
            checks["model"] = "error"
            checks["status"] = "degraded"
    except Exception as me:
        checks["model"] = f"error: {str(me)}"
        checks["status"] = "degraded"

    # 3. Check Email Configuration
    if settings.EMAIL_PROVIDER.lower() == "smtp" and settings.SMTP_HOST:
        checks["email"] = "configured"
    elif settings.EMAIL_PROVIDER.lower() == "transactional" and settings.EMAIL_API_KEY:
        checks["email"] = "configured"
    elif settings.EMAIL_PROVIDER.lower() == "dev":
        checks["email"] = "development_mailbox"
    else:
        checks["email"] = "unconfigured"
        if settings.APP_ENV == "production":
            checks["status"] = "degraded"

    if checks["status"] == "degraded":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return checks


@router.get("/info")
def platform_info():
    return {
        "platform": settings.PROJECT_NAME,
        "version": "v2.0.0",
        "api_prefix": settings.API_V1_STR,
        "governance_status": "REQUIRES_VALIDATION",
        "features": [
            "Molecular Ingestion & SMILES Processing",
            "Protein Target Conformations (UniProt / PDB / AlphaFold)",
            "Pest System Demographics (Wright-Fisher Horizon)",
            "Durability Scoring Engine",
            "Alembic Versioned Schema Migration",
            "Historical APRD & IRAC Backtesting",
            "Out-of-Distribution Detection & Split Conformal Bounds",
        ],
    }

