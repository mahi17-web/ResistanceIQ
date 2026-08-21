"""
ResistanceIQ — Internal Operational Status & Monitoring Admin API Router
"""

import os
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.models import User, UserRole, IngestionRun, ActivityLog
from app.auth.dependencies import require_role
from app.core.telemetry import metrics_collector
from ml.inference.loader import ModelLoader

router = APIRouter()


@router.get("/operational-status")
def get_operational_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
) -> Dict[str, Any]:
    """
    Returns real, live operational health, telemetry counters, and ML status.
    Accessible only to authorized system administrators.
    """
    # 1. Subsystem Health Checks
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    storage_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../../storage/models")
    )
    loader = ModelLoader(storage_dir=storage_dir)
    ml_ok = False
    active_model_info = {"version": "UNKNOWN", "sha256": "N/A", "status": "UNKNOWN"}
    try:
        art = loader.load_model()
        ml_ok = True
        active_model_info = {
            "version": art.get("model_version", "v1.0.0-ridge-ecfp4"),
            "sha256": art.get("artifact_sha256", "N/A"),
            "status": art.get("status", "DEVELOPMENT_ONLY"),
            "algorithm": art.get("model_type", "RIDGE"),
        }
    except Exception as e:
        active_model_info["error"] = str(e)

    # 2. Last Scientific Data Ingestion
    last_ingestion = (
        db.query(IngestionRun)
        .order_by(IngestionRun.created_at.desc())
        .first()
    )
    ingestion_data = None
    if last_ingestion:
        ingestion_data = {
            "id": last_ingestion.id,
            "dataset_version": last_ingestion.dataset_version_id,
            "status": last_ingestion.status,
            "records_seen": last_ingestion.records_seen,
            "records_accepted": last_ingestion.records_accepted,
            "records_rejected": last_ingestion.records_rejected,
            "created_at": last_ingestion.created_at.isoformat() if last_ingestion.created_at else None,
        }

    # 3. Recent Activity & Incident Signals
    recent_logs = (
        db.query(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
        .limit(10)
        .all()
    )
    activities = [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "details": l.details,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in recent_logs
    ]

    return {
        "subsystems": {
            "api": {"status": "OPERATIONAL"},
            "database": {"status": "OPERATIONAL" if db_ok else "DEGRADED"},
            "ml_inference": {"status": "OPERATIONAL" if ml_ok else "OFFLINE"},
            "storage": {"status": "OPERATIONAL" if os.path.exists(storage_dir) else "DEGRADED"},
        },
        "active_model": active_model_info,
        "last_ingestion": ingestion_data,
        "telemetry_metrics": metrics_collector.get_summary(),
        "recent_audit_events": activities,
    }


@router.get("/knowledge-graph/status")
def get_knowledge_graph_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.ANALYST])),
) -> Dict[str, Any]:
    """
    Returns live statistics on canonical crops, threat links, Swiss-Prot targets, and 3D structures.
    """
    from app.models import Crop, CropThreat, Target, ProteinRecord, ProteinStructure, KnowledgeSyncAudit

    total_crops = db.query(Crop).count()
    total_threats = db.query(CropThreat).count()
    total_targets = db.query(Target).count()
    total_proteins = db.query(ProteinRecord).count()
    total_structures = db.query(ProteinStructure).count()
    experimental_structures = db.query(ProteinStructure).filter(ProteinStructure.structure_type == "EXPERIMENTAL").count()
    computed_structures = db.query(ProteinStructure).filter(ProteinStructure.structure_type == "COMPUTED").count()

    last_audit = (
        db.query(KnowledgeSyncAudit)
        .order_by(KnowledgeSyncAudit.started_at.desc())
        .first()
    )

    return {
        "status": "HEALTHY" if total_crops > 0 and total_targets > 0 else "NEEDS_SYNC",
        "last_sync_time": last_audit.completed_at.isoformat() if last_audit and last_audit.completed_at else None,
        "last_sync_status": last_audit.status if last_audit else "NEVER_SYNCED",
        "total_crops": total_crops,
        "total_threats": total_threats,
        "total_targets": total_targets,
        "total_proteins": total_proteins,
        "total_structures": total_structures,
        "experimental_structures_count": experimental_structures,
        "computed_structures_count": computed_structures,
        "records_added": last_audit.records_added if last_audit else 0,
        "records_updated": last_audit.records_updated if last_audit else 0,
        "records_rejected": last_audit.records_rejected if last_audit else 0,
    }


@router.post("/knowledge-graph/sync")
def trigger_knowledge_graph_sync(
    payload: Dict[str, Any] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
) -> Dict[str, Any]:
    """
    Admin-only operation to synchronize authoritative scientific data (FAO, NCBI, UniProt, RCSB).
    """
    from app.ingestion.knowledge_graph_builder import KnowledgeGraphBuilder

    sync_type = (payload or {}).get("sync_type", "ALL")
    builder = KnowledgeGraphBuilder(db=db)
    result = builder.sync_all(sync_type=sync_type)
    return result
