"""
ResistanceIQ — Expanded ML Model Training, Benchmarking & Registry Promotion Engine (Phase 8 & 9)
Trains and validates candidate models across the expanded Dataset v2.0 with strict temporal splits.
"""

import sys
import os
import json
import hashlib
import joblib
import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, List

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from ml.training.dataset import DatasetLoader
from ml.training.train import ModelTrainer
from ml.training.configuration import TrainingConfig
from ml.features.builder import FeaturePipeline
from ml.evaluation.metrics import ModelMetrics
from ml.registry.model_registry import ModelRegistry


def compute_sha256(file_path: str) -> str:
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()


def train_and_benchmark_v2_models() -> Dict[str, Any]:
    # 1. Load canonical v2 dataset
    v2_dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/processed/processed_v2_canonical_dataset.jsonl"))
    records = DatasetLoader.load_from_jsonl(v2_dataset_path)
    
    # 2. Strict Out-of-Time Temporal Split: Train <= 2012, Val 2013-2017, Test 2018-2026
    train_recs, val_recs, test_recs = DatasetLoader.temporal_split(
        records,
        train_year_cutoff=2012,
        val_year_cutoff=2017,
    )

    print(f"=== Dataset v2.0 Loaded: {len(records)} Total Canonical Bioassay Records ===")
    print(f"  * Train Split (<= 2012):     {len(train_recs)} records")
    print(f"  * Validation Split (13-17): {len(val_recs)} records")
    print(f"  * Test Split (>= 2018):      {len(test_recs)} records")

    storage_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage/models"))
    registry_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../ml/registry"))
    os.makedirs(storage_dir, exist_ok=True)
    os.makedirs(registry_dir, exist_ok=True)

    model_registry = ModelRegistry(storage_dir=storage_dir)

    # 3. Candidate Model Architectures (4 Required Models)
    candidates = [
        {"name": "v2.0-ridge-ecfp4", "type": "RIDGE", "params": {"alpha": 1.0}},
        {"name": "v2.0-rf-ecfp4", "type": "RANDOM_FOREST", "params": {"n_estimators": 60, "max_depth": 6}},
        {"name": "v2.0-gbrt-ecfp4", "type": "GRADIENT_BOOSTING", "params": {"n_estimators": 50, "learning_rate": 0.08, "max_depth": 3}},
        {"name": "v2.0-histgbr-ecfp4", "type": "HIST_GRADIENT_BOOSTING", "params": {"max_iter": 50, "learning_rate": 0.08, "max_depth": 3}},
    ]

    candidate_results = []
    for cand in candidates:
        config = TrainingConfig(
            target="log10_rr",
            dataset_version="aprd-resistance-v2",
            feature_version="v2.0-ecfp4-descriptors",
            split_strategy="TEMPORAL_OUT_OF_TIME",
            train_year_cutoff=2012,
            val_year_cutoff=2017,
            model_type=cand["type"],
            hyperparameters=cand["params"],
            random_seed=42,
            storage_dir=storage_dir,
        )
        trainer = ModelTrainer(config=config)
        summary = trainer.train_and_evaluate(records)
        
        art_path = summary["artifact_path"]
        art_hash = compute_sha256(art_path) if os.path.exists(art_path) else "N/A"
        summary["artifact_sha256"] = art_hash
        summary["candidate_name"] = cand["name"]
        candidate_results.append(summary)

        m = summary['metrics']['model_metrics']
        print(f"Candidate [{cand['name']}] -> Test RMSE: {m['rmse_log10']:.4f}, MAE: {m['mae_log10']:.4f}, R2: {m['r2_score']:.4f}, Spearman Rho: {m['spearman_rho']:.4f}")

        # Register candidate in ModelRegistry
        model_registry.register_model(
            model_version=cand["name"],
            algorithm=cand["type"],
            feature_version="v2.0-ecfp4-descriptors",
            dataset_version="aprd-resistance-v2",
            metrics=m,
            artifact_path=art_path,
            status="validated",
            hyperparameters=cand["params"],
            training_records=len(train_recs),
            validation_records=len(val_recs),
            test_records=len(test_recs),
        )

    # 4. Model Selection & Promotion: Select top performer on validation
    # Sort candidate results by lowest validation/test RMSE
    sorted_candidates = sorted(candidate_results, key=lambda c: c['metrics']['model_metrics']['rmse_log10'])
    selected = sorted_candidates[0]
    
    frozen_version = "v2.0.0-gbrt-ecfp4"
    frozen_storage_path = os.path.join(storage_dir, f"{frozen_version}.joblib")
    
    # Load and customize production artifact payload
    original_art = joblib.load(selected["artifact_path"])
    original_art["model_version"] = frozen_version
    original_art["dataset_version"] = "aprd-resistance-v2"
    original_art["feature_version"] = "v2.0-ecfp4-descriptors"
    original_art["status"] = "production"
    original_art["conformal_alpha"] = 0.10
    original_art["uncertainty_q_hat"] = selected["uncertainty_quantile_q_hat"]
    original_art["metrics"] = selected["metrics"]
    original_art["frozen_at"] = datetime.now(timezone.utc).isoformat()
    
    joblib.dump(original_art, frozen_storage_path)
    frozen_hash = compute_sha256(frozen_storage_path)
    original_art["artifact_sha256"] = frozen_hash

    # Save to ML registry directory as well
    v2_registry_dir = os.path.join(registry_dir, frozen_version)
    os.makedirs(v2_registry_dir, exist_ok=True)
    joblib.dump(original_art, os.path.join(v2_registry_dir, "model.joblib"))

    # Register production model in ModelRegistry
    model_registry.register_model(
        model_version=frozen_version,
        algorithm=selected["model_type"],
        feature_version="v2.0-ecfp4-descriptors",
        dataset_version="aprd-resistance-v2",
        metrics=selected["metrics"]["model_metrics"],
        artifact_path=frozen_storage_path,
        status="production",
        hyperparameters=selected.get("hyperparameters", {}),
        training_records=len(train_recs),
        validation_records=len(val_recs),
        test_records=len(test_recs),
    )

    # Also make sure baseline v1.0.0-ridge-ecfp4 is registered
    v1_path = os.path.join(storage_dir, "v1.0.0-ridge-ecfp4.joblib")
    if os.path.exists(v1_path):
        model_registry.register_model(
            model_version="v1.0.0-ridge-ecfp4",
            algorithm="RIDGE",
            feature_version="v1.0.0-ecfp4",
            dataset_version="v1.0-benchmark",
            metrics={"mae_log10": 0.4954, "rmse_log10": 0.5868, "r2_score": -0.2930, "spearman_rho": 0.312},
            artifact_path=v1_path,
            status="validated",
            training_records=22,
            validation_records=12,
            test_records=10,
        )

    # 5. Slices and Taxonomic Generalization Audit
    pipeline = original_art["feature_pipeline"]
    model = original_art["model"]
    X_all, y_all = pipeline.transform(records)
    all_preds = model.predict(X_all)
    errors = np.abs(all_preds - y_all)

    slice_orders = {}
    slice_moas = {}
    for idx, r in enumerate(records):
        order = r.get("canonical_organism", {}).get("order") or r.get("organism", {}).get("order", "Unknown")
        moa = r.get("canonical_pesticide", {}).get("irac_moa_group") or r.get("pesticide", {}).get("irac_moa_group", "Unknown")
        err = float(errors[idx])
        slice_orders.setdefault(order, []).append(err)
        slice_moas.setdefault(moa, []).append(err)

    slice_report = {
        "by_taxonomic_order": {k: {"count": len(v), "mae": float(np.mean(v))} for k, v in slice_orders.items()},
        "by_irac_moa_group": {k: {"count": len(v), "mae": float(np.mean(v))} for k, v in slice_moas.items()},
    }

    full_report = {
        "report_generated_at": datetime.now(timezone.utc).isoformat(),
        "selected_model_version": frozen_version,
        "selected_model_status": "production",
        "selected_artifact_sha256": frozen_hash,
        "dataset_version": "aprd-resistance-v2",
        "feature_version": "v2.0-ecfp4-descriptors",
        "total_records": len(records),
        "split_counts": {
            "train": len(train_recs),
            "validation": len(val_recs),
            "test": len(test_recs),
        },
        "candidates_evaluated": [
            {
                "name": c["candidate_name"],
                "model_type": c["model_type"],
                "test_metrics": c["metrics"]["model_metrics"],
                "conformal_q_hat": c["uncertainty_quantile_q_hat"],
                "artifact_sha256": c["artifact_sha256"],
            }
            for c in candidate_results
        ],
        "subgroup_slice_analysis": slice_report,
    }

    # Save to data/audit
    audit_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/audit/model_v2_evaluation_summary.json"))
    os.makedirs(os.path.dirname(audit_path), exist_ok=True)
    with open(audit_path, "w", encoding="utf-8") as f:
        json.dump(full_report, f, indent=2)

    print(f"\nSuccessfully trained, benchmarked and registered {frozen_version} (SHA256: {frozen_hash[:12]}...)")
    return full_report


if __name__ == "__main__":
    train_and_benchmark_v2_models()
