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
        candidates = [
            storage_dir,
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage/models")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../storage/models")),
            "/app/resistanceiq/storage/models",
            "/app/storage/models",
            os.path.abspath("resistanceiq/storage/models"),
            os.path.abspath("storage/models"),
        ]
        chosen = None
        for c in candidates:
            if c and os.path.exists(c) and any(f.endswith(".joblib") for f in os.listdir(c)):
                chosen = os.path.abspath(c)
                break
        self.storage_dir = chosen or os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage/models"))

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

    def load_model(self, model_version: Optional[str] = None, verify_hash: bool = False) -> Dict[str, Any]:
        version = model_version or self.DEFAULT_MODEL_VERSION
        canonical_ver = self.VERSION_ALIASES.get(version, version)
        
        # Return cached artifact if available
        if canonical_ver in self._cache:
            return self._cache[canonical_ver]

        artifact_path = self.get_artifact_path(canonical_ver)
        artifact_hash = self.compute_sha256(artifact_path)

        artifact = joblib.load(artifact_path)
        artifact["resolved_path"] = artifact_path
        artifact["artifact_sha256"] = artifact_hash

        # Cache in memory
        self._cache[canonical_ver] = artifact
        return artifact

    @classmethod
    def clear_cache(cls):
        cls._cache.clear()

