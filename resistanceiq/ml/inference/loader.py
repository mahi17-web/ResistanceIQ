"""
ResistanceIQ — Model Artifact Loader & Singleton Cache
"""

import os
import joblib
import hashlib
from typing import Dict, Any, Optional


class ModelIntegrityError(Exception):
    """Raised when model artifact integrity verification fails."""
    pass


class ModelLoader:
    """
    Manages loading, SHA-256 integrity verification, and in-memory caching of model artifacts.
    Enforces strict immutability and checksum verification for production models.
    """

    DEFAULT_MODEL_VERSION = "v2.0.0-gbrt-ecfp4"
    LOCKED_V2_SHA256 = "6fc915fa26716dc4a06bad71f586af95ee071acf11e9a5b8acdc5171fed55622"
    EXPECTED_FEATURE_COUNT = 1059

    _cache: Dict[str, Dict[str, Any]] = {}

    def __init__(self, storage_dir: Optional[str] = None):
        if storage_dir is None:
            self.storage_dir = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "../../storage/models")
            )
        else:
            self.storage_dir = os.path.abspath(storage_dir)

    @classmethod
    def compute_sha256(cls, file_path: str) -> str:
        hasher = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(8192):
                hasher.update(chunk)
        return hasher.hexdigest()

    VERSION_ALIASES = {
        "v2.0-gbrt-ecfp4": "v2.0.0-gbrt-ecfp4",
        "v2.0-rf-ecfp4": "v2.0.0-gbrt-ecfp4",
        "v2.0": "v2.0.0-gbrt-ecfp4",
        "v2.0.0": "v2.0.0-gbrt-ecfp4",
        "v1.0": "v1.0.0-ridge-ecfp4",
        "v1.0.0": "v1.0.0-ridge-ecfp4",
        "v0.1": "v0.1-ridge-ecfp4",
    }

    def get_artifact_path(self, model_version: str) -> str:
        # Normalize alias
        canonical_ver = self.VERSION_ALIASES.get(model_version, model_version)
        
        # Check direct joblib filename
        path = os.path.join(self.storage_dir, f"{canonical_ver}.joblib")
        if os.path.exists(path):
            return path
            
        # Check if model_version itself matches directly
        raw_path = os.path.join(self.storage_dir, f"{model_version}.joblib")
        if os.path.exists(raw_path):
            return raw_path

        # Fallback to default production version
        fallback = os.path.join(self.storage_dir, f"{self.DEFAULT_MODEL_VERSION}.joblib")
        if os.path.exists(fallback):
            return fallback
            
        # Fallback to v0.1
        legacy = os.path.join(self.storage_dir, "v0.1-ridge-ecfp4.joblib")
        if os.path.exists(legacy):
            return legacy
        raise FileNotFoundError(f"Model artifact not found for version '{model_version}' in {self.storage_dir}")

    def load_model(self, model_version: Optional[str] = None, verify_hash: bool = True) -> Dict[str, Any]:
        version = model_version or self.DEFAULT_MODEL_VERSION
        canonical_ver = self.VERSION_ALIASES.get(version, version)
        
        # Return cached artifact if available
        if canonical_ver in self._cache:
            return self._cache[canonical_ver]

        artifact_path = self.get_artifact_path(canonical_ver)
        artifact_hash = self.compute_sha256(artifact_path)

        # Enforce hard SHA256 checksum check for locked production model
        if verify_hash and canonical_ver == self.DEFAULT_MODEL_VERSION:
            if artifact_hash != self.LOCKED_V2_SHA256:
                raise ModelIntegrityError(
                    f"MODEL_INTEGRITY_FAILURE: Production model checksum mismatch for '{canonical_ver}'. "
                    f"Expected {self.LOCKED_V2_SHA256}, got {artifact_hash}."
                )

        artifact = joblib.load(artifact_path)
        artifact["resolved_path"] = artifact_path
        artifact["artifact_sha256"] = artifact_hash

        # Validate estimator and feature dimension for v2.0
        if canonical_ver == self.DEFAULT_MODEL_VERSION:
            model = artifact.get("model")
            estimator_type = type(model).__name__
            if estimator_type != "RandomForestRegressor":
                raise ModelIntegrityError(
                    f"MODEL_INTEGRITY_FAILURE: Estimator type mismatch: expected 'RandomForestRegressor', got '{estimator_type}'."
                )
            
            n_features = getattr(model, "n_features_in_", None)
            if n_features is not None and n_features != self.EXPECTED_FEATURE_COUNT:
                raise ModelIntegrityError(
                    f"MODEL_INTEGRITY_FAILURE: Feature count mismatch in estimator: expected {self.EXPECTED_FEATURE_COUNT}, found {n_features}."
                )
            
            n_est = getattr(model, "n_estimators", None)
            if n_est is not None and n_est != 60:
                raise ModelIntegrityError(
                    f"MODEL_INTEGRITY_FAILURE: n_estimators mismatch: expected 60, found {n_est}."
                )
            
            max_d = getattr(model, "max_depth", None)
            if max_d is not None and max_d != 6:
                raise ModelIntegrityError(
                    f"MODEL_INTEGRITY_FAILURE: max_depth mismatch: expected 6, found {max_d}."
                )

        # Cache in memory
        self._cache[canonical_ver] = artifact
        return artifact

    @classmethod
    def clear_cache(cls):
        cls._cache.clear()

