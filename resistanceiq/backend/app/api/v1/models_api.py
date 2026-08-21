"""
ResistanceIQ — Models & Registry Health API Router (Phase 1, 12, 13)
Provides inspection, validation status, artifact integrity verification, and active model selection.
"""

import os
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from ml.registry.model_registry import ModelRegistry

router = APIRouter()
registry = ModelRegistry()


@router.get("/active")
def get_active_production_model() -> Dict[str, Any]:
    """
    Returns the current approved production forecasting model and metadata.
    """
    try:
        prod = registry.get_production_model()
        health = registry.get_model_health(prod["model_version"])
        return {
            "model_id": prod["model_id"],
            "model_version": prod["model_version"],
            "algorithm": prod["algorithm"],
            "status": prod["status"],
            "feature_version": prod["feature_version"],
            "dataset_version": prod["dataset_version"],
            "training_records": prod["training_records"],
            "validation_records": prod["validation_records"],
            "test_records": prod["test_records"],
            "metrics": prod["metrics"],
            "artifact_sha256": prod["artifact_sha256"],
            "uncertainty_method": prod["uncertainty_method"],
            "ood_method": prod["ood_method"],
            "health_status": health.get("health", "HEALTHY"),
            "created_at": prod["created_at"],
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"No active production model available: {str(exc)}",
        )


@router.get("")
def list_models() -> List[Dict[str, Any]]:
    """
    Lists all registered models, validation metrics, and lifecycle statuses.
    """
    return registry.list_models()


@router.get("/{model_version}/health")
def get_model_health_check(model_version: str) -> Dict[str, Any]:
    """
    Runs an artifact integrity, SHA-256 validation, and deserialization check for a specific model version.
    """
    health = registry.get_model_health(model_version)
    if health.get("status") == "NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model version '{model_version}' is not registered.",
        )
    return health
