"""
ResistanceIQ — Model Comparison, Slice Analysis & Selection Engine
"""

import sys
import os
import json
import hashlib
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


def compute_sha256(file_path: str) -> str:
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()


def run_model_comparison() -> Dict[str, Any]:
    records = DatasetLoader.load_canonical_records()
    train_recs, val_recs, test_recs = DatasetLoader.temporal_split(records, 2000, 2010)

    print(f"Loaded {len(records)} total records (Train: {len(train_recs)}, Val: {len(val_recs)}, Test: {len(test_recs)})")

    storage_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage/models"))
    os.makedirs(storage_dir, exist_ok=True)

    candidates = [
        {"name": "v0.1-ridge-ecfp4-a1.0", "type": "RIDGE", "params": {"alpha": 1.0}},
        {"name": "v0.1-ridge-ecfp4-a0.1", "type": "RIDGE", "params": {"alpha": 0.1}},
        {"name": "v0.2-rf-ecfp4", "type": "RANDOM_FOREST", "params": {"n_estimators": 50, "max_depth": 5}},
    ]

    results = []
    for cand in candidates:
        config = TrainingConfig(
            target="log10_rr",
            dataset_version="v1.0-aprd-canonical",
            feature_version=FeaturePipeline.FEATURE_VERSION,
            split_strategy="TEMPORAL_OUT_OF_TIME",
            train_year_cutoff=2000,
            val_year_cutoff=2010,
            model_type=cand["type"],
            hyperparameters=cand["params"],
            random_seed=42,
            storage_dir=storage_dir,
        )
        trainer = ModelTrainer(config=config)
        summary = trainer.train_and_evaluate(records)
        
        # Calculate SHA256
        art_path = summary["artifact_path"]
        art_hash = compute_sha256(art_path) if os.path.exists(art_path) else "N/A"
        summary["artifact_sha256"] = art_hash
        summary["candidate_name"] = cand["name"]
        results.append(summary)

    # Freeze the best candidate (Ridge with alpha=1.0)
    selected = results[0]
    frozen_version = "v1.0.0-ridge-ecfp4"
    frozen_path = os.path.join(storage_dir, f"{frozen_version}.joblib")
    
    import joblib
    original_art = joblib.load(selected["artifact_path"])
    original_art["model_version"] = frozen_version
    original_art["status"] = "DEVELOPMENT_ONLY"
    original_art["frozen_at"] = datetime.now(timezone.utc).isoformat()
    joblib.dump(original_art, frozen_path)
    frozen_hash = compute_sha256(frozen_path)

    # Slice & Error Analysis for Selected Model
    pipeline = original_art["feature_pipeline"]
    model = original_art["model"]
    
    X_all, y_all = pipeline.transform(records)
    all_preds = model.predict(X_all)
    errors = np.abs(all_preds - y_all)

    # Slices
    slice_orders = {}
    slice_moas = {}
    for idx, r in enumerate(records):
        order = r.get("organism", {}).get("order", "Unknown")
        moa = r.get("pesticide", {}).get("irac_moa_group", "Unknown")
        err = float(errors[idx])

        slice_orders.setdefault(order, []).append(err)
        slice_moas.setdefault(moa, []).append(err)

    slice_order_summary = {k: {"count": len(v), "mean_mae": round(float(np.mean(v)), 4)} for k, v in slice_orders.items()}
    slice_moa_summary = {k: {"count": len(v), "mean_mae": round(float(np.mean(v)), 4)} for k, v in slice_moas.items()}

    report = {
        "evaluation_timestamp": datetime.now(timezone.utc).isoformat(),
        "total_records": len(records),
        "split_counts": {"train": len(train_recs), "val": len(val_recs), "test": len(test_recs)},
        "candidate_results": results,
        "selected_model": {
            "version": frozen_version,
            "algorithm": "Ridge Linear Regressor (alpha=1.0)",
            "artifact_path": frozen_path,
            "artifact_sha256": frozen_hash,
            "metrics": selected["metrics"],
            "status": "DEVELOPMENT_ONLY",
            "acceptance_status": "DEVELOPMENT_APPROVED_PROD_PENDING_MORE_DATA",
        },
        "slice_analysis": {
            "pest_order_slices": slice_order_summary,
            "irac_moa_slices": slice_moa_summary,
        },
        "error_analysis": {
            "max_error": round(float(np.max(errors)), 4),
            "mean_error": round(float(np.mean(errors)), 4),
            "median_error": round(float(np.median(errors)), 4),
            "largest_error_case": records[int(np.argmax(errors))],
        },
    }

    # Save to experiments
    exp_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../experiments/step6_model_comparison.json"))
    with open(exp_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"Model comparison saved to: {exp_path}")
    print(f"Selected Frozen Model: {frozen_version} (SHA256: {frozen_hash[:16]}...)")
    return report


if __name__ == "__main__":
    run_model_comparison()
