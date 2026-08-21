"""
ResistanceIQ — Production Model Registry & Lifecycle Manager (Phase 12 & 13)
Tracks registered model artifacts, algorithms, metadata, validation metrics,
and deployment statuses: candidate, validated, production, retired.
"""

import os
import json
import joblib
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional


def compute_file_sha256(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()


class ModelRegistry:
    DEFAULT_STORAGE_DIR = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../storage/models")
    )
    REGISTRY_MANIFEST = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "model_registry_manifest.json")
    )

    def __init__(self, storage_dir: Optional[str] = None, manifest_path: Optional[str] = None):
        self.storage_dir = os.path.abspath(storage_dir or self.DEFAULT_STORAGE_DIR)
        os.makedirs(self.storage_dir, exist_ok=True)
        if manifest_path:
            self.manifest_path = os.path.abspath(manifest_path)
        elif storage_dir and os.path.abspath(storage_dir) != self.DEFAULT_STORAGE_DIR:
            self.manifest_path = os.path.join(self.storage_dir, "model_registry_manifest.json")
        else:
            self.manifest_path = self.REGISTRY_MANIFEST
        self._ensure_manifest()

    def _ensure_manifest(self):
        if not os.path.exists(self.manifest_path):
            initial_data = {"models": {}, "active_production_version": "v2.0.0-gbrt-ecfp4"}
            with open(self.manifest_path, "w", encoding="utf-8") as f:
                json.dump(initial_data, f, indent=2)

    def _load_manifest(self) -> Dict[str, Any]:
        self._ensure_manifest()
        with open(self.manifest_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _save_manifest(self, data: Dict[str, Any]):
        with open(self.manifest_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def register_model(
        self,
        model_version: str,
        algorithm: str,
        feature_version: str,
        dataset_version: str,
        metrics: Dict[str, Any],
        artifact_path: str,
        status: str = "validated",
        hyperparameters: Optional[Dict[str, Any]] = None,
        uncertainty_method: str = "Split Conformal Prediction (alpha=0.10)",
        ood_method: str = "ECFP4 Tanimoto Nearest-Neighbor Applicability Domain",
        training_records: int = 22,
        validation_records: int = 12,
        test_records: int = 10,
    ) -> Dict[str, Any]:
        artifact_sha256 = compute_file_sha256(artifact_path) if os.path.exists(artifact_path) else "N/A"
        manifest = self._load_manifest()

        record = {
            "model_id": f"mod_{model_version.replace('.', '_')}",
            "model_version": model_version,
            "algorithm": algorithm,
            "feature_version": feature_version,
            "dataset_version": dataset_version,
            "status": status,  # candidate, validated, production, retired
            "artifact_path": artifact_path,
            "artifact_sha256": artifact_sha256,
            "training_records": training_records,
            "validation_records": validation_records,
            "test_records": test_records,
            "metrics": {
                "mae_log10": metrics.get("mae_log10", 0.0),
                "rmse_log10": metrics.get("rmse_log10", 0.0),
                "r2_score": metrics.get("r2_score", 0.0),
                "median_ae_log10": metrics.get("median_ae_log10", 0.0),
                "spearman_rho": metrics.get("spearman_rho", 0.0),
            },
            "subgroup_metrics": metrics.get("subgroups", {}),
            "hyperparameters": hyperparameters or {},
            "uncertainty_method": uncertainty_method,
            "ood_method": ood_method,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        manifest["models"][model_version] = record
        if status == "production":
            manifest["active_production_version"] = model_version

        self._save_manifest(manifest)
        return record

    def list_models(self) -> List[Dict[str, Any]]:
        import glob
        manifest = self._load_manifest()
        models = list(manifest.get("models", {}).values())
        if not models and os.path.exists(self.storage_dir):
            for f in sorted(glob.glob(os.path.join(self.storage_dir, "*.joblib"))):
                ver = os.path.basename(f).replace(".joblib", "")
                try:
                    art = joblib.load(f)
                    models.append({
                        "model_version": ver,
                        "version": ver,
                        "algorithm": art.get("model_type", "RIDGE"),
                        "status": "candidate",
                    })
                except Exception:
                    pass
        for m in models:
            if "model_version" in m and "version" not in m:
                m["version"] = m["model_version"]
        return models

    def load_model(self, model_version: str) -> Dict[str, Any]:
        path = os.path.join(self.storage_dir, f"{model_version}.joblib")
        if os.path.exists(path):
            return joblib.load(path)
        from ml.inference.loader import ModelLoader
        loader = ModelLoader(storage_dir=self.storage_dir)
        return loader.load_model(model_version)

    def get_production_model(self) -> Dict[str, Any]:
        manifest = self._load_manifest()
        prod_ver = manifest.get("active_production_version")
        if prod_ver and prod_ver in manifest["models"]:
            return manifest["models"][prod_ver]
        
        # Fallback to first model marked production or validated
        for m in manifest.get("models", {}).values():
            if m.get("status") == "production":
                return m
        for m in manifest.get("models", {}).values():
            if m.get("status") == "validated":
                return m
        raise RuntimeError("No production or validated model registered in ModelRegistry.")

    def get_model_health(self, model_version: str) -> Dict[str, Any]:
        manifest = self._load_manifest()
        if model_version not in manifest["models"]:
            return {
                "model_version": model_version,
                "status": "NOT_FOUND",
                "health": "UNHEALTHY",
                "error": f"Model {model_version} not registered in registry.",
            }

        rec = manifest["models"][model_version]
        art_path = rec.get("artifact_path")
        if not os.path.exists(art_path):
            # Check default storage
            alt_path = os.path.join(self.storage_dir, f"{model_version}.joblib")
            if os.path.exists(alt_path):
                art_path = alt_path
            else:
                return {
                    "model_version": model_version,
                    "status": rec.get("status"),
                    "health": "UNHEALTHY",
                    "error": f"Artifact file missing at {art_path}",
                }

        curr_sha256 = compute_file_sha256(art_path)
        sha_valid = curr_sha256 == rec.get("artifact_sha256") or rec.get("artifact_sha256") == "N/A"

        # Check deserialization integrity
        try:
            art = joblib.load(art_path)
            loaded_ok = bool(art.get("model") and art.get("feature_pipeline"))
        except Exception as e:
            return {
                "model_version": model_version,
                "status": rec.get("status"),
                "health": "UNHEALTHY",
                "error": f"Failed to deserialize artifact: {str(e)}",
            }

        return {
            "model_version": model_version,
            "algorithm": rec.get("algorithm"),
            "status": rec.get("status"),
            "health": "HEALTHY" if (loaded_ok and sha_valid) else "DEGRADED",
            "artifact_sha256": curr_sha256,
            "sha256_match": sha_valid,
            "deserialization_success": loaded_ok,
            "dataset_version": rec.get("dataset_version"),
            "feature_version": rec.get("feature_version"),
            "test_rmse": rec.get("metrics", {}).get("rmse_log10"),
            "test_r2": rec.get("metrics", {}).get("r2_score"),
            "checked_at": datetime.now(timezone.utc).isoformat(),
        }


if __name__ == "__main__":
    reg = ModelRegistry()
    print("ModelRegistry list:", reg.list_models())
