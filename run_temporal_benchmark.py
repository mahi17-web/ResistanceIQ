import sys
import os
import json
import hashlib
import joblib
import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, List

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.abspath("resistanceiq/backend"))
sys.path.insert(0, os.path.abspath("resistanceiq"))

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

def execute_temporal_benchmark():
    # 1. Load canonical v2 dataset
    v2_dataset_path = os.path.abspath("resistanceiq/data/processed/processed_v2_canonical_dataset.jsonl")
    records = DatasetLoader.load_from_jsonl(v2_dataset_path)
    
    # 2. Strict Out-of-Time Temporal Split: Train <= 2012, Val 2013-2017, Test 2018-2026
    train_recs, val_recs, test_recs = DatasetLoader.temporal_split(
        records,
        train_year_cutoff=2012,
        val_year_cutoff=2017,
    )

    print("================================================================================")
    print("RESISTANCEIQ -- SCIENTIFIC ML TEMPORAL BENCHMARK & MODEL GOVERNANCE REPORT")
    print("================================================================================")
    print(f"Dataset Size: {len(records)} total canonical records")
    print(f"  * Split 1 -- Train Set (<= 2012):     {len(train_recs)} observations ({len(train_recs)/len(records)*100:.1f}%)")
    print(f"  * Split 2 -- Validation Set (13-17):  {len(val_recs)} observations ({len(val_recs)/len(records)*100:.1f}%) [Used for Tuning/Selection]")
    print(f"  * Split 3 -- Held-Out Test Set (>=18): {len(test_recs)} observations ({len(test_recs)/len(records)*100:.1f}%) [Untouched During Tuning]")
    print("================================================================================")

    storage_dir = os.path.abspath("resistanceiq/storage/models")
    registry_dir = os.path.abspath("resistanceiq/ml/registry")
    os.makedirs(storage_dir, exist_ok=True)
    os.makedirs(registry_dir, exist_ok=True)

    model_registry = ModelRegistry(storage_dir=storage_dir)

    # 3. Candidate Model Architectures
    candidates = [
        {"name": "v2.0-ridge-ecfp4", "type": "RIDGE", "params": {"alpha": 1.0}},
        {"name": "v2.0-rf-ecfp4", "type": "RANDOM_FOREST", "params": {"n_estimators": 60, "max_depth": 6}},
        {"name": "v2.0-gbrt-ecfp4", "type": "GRADIENT_BOOSTING", "params": {"n_estimators": 50, "learning_rate": 0.08, "max_depth": 3}},
        {"name": "v2.0-histgbr-ecfp4", "type": "HIST_GRADIENT_BOOSTING", "params": {"max_iter": 50, "learning_rate": 0.08, "max_depth": 3}},
    ]

    candidate_results = []
    print("\n--- Training and Evaluating Candidate Models on Temporal Splits ---")
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

        # Load trained artifact for explicit evaluation on Val and Test splits
        art_data = joblib.load(art_path)
        pipe = art_data["feature_pipeline"]
        mod = art_data["model"]
        calibrator = art_data["conformal_calibrator"]

        # Validation split evaluation
        X_val, y_val = pipe.transform(val_recs)
        val_preds = mod.predict(X_val)
        val_m = ModelMetrics.evaluate_regression(y_val, val_preds)

        # Test split evaluation
        X_test, y_test = pipe.transform(test_recs)
        test_preds = mod.predict(X_test)
        test_m = ModelMetrics.evaluate_regression(y_test, test_preds)

        # Conformal coverage on test set
        q_hat = calibrator.q_hat
        test_lower = test_preds - q_hat
        test_upper = test_preds + q_hat
        test_covered = np.mean((y_test >= test_lower) & (y_test <= test_upper))

        summary["val_metrics"] = val_m
        summary["test_metrics"] = test_m
        summary["conformal_coverage_test"] = float(test_covered)

        candidate_results.append(summary)

        print(f"\nCandidate: [{cand['name']}] ({cand['type']})")
        print(f"  Validation -> MAE: {val_m['mae_log10']:.4f} | MedAE: {val_m.get('medae_log10', 0):.4f} | RMSE: {val_m['rmse_log10']:.4f} | R2: {val_m['r2_score']:.4f} | Rho: {val_m['spearman_rho']:.4f}")
        print(f"  Test Set   -> MAE: {test_m['mae_log10']:.4f} | MedAE: {test_m.get('medae_log10', 0):.4f} | 95% CI: {test_m.get('mae_ci_95', [])} | RMSE: {test_m['rmse_log10']:.4f} | R2: {test_m['r2_score']:.4f}")
        print(f"  Conformal Coverage on Test Set: {test_covered*100:.1f}% (target 90%)")

        # Register candidate in ModelRegistry with 'candidate' status
        model_registry.register_model(
            model_version=cand["name"],
            algorithm=cand["type"],
            feature_version="v2.0-ecfp4-descriptors",
            dataset_version="aprd-resistance-v2",
            metrics=test_m,
            artifact_path=art_path,
            status="candidate",
            hyperparameters=cand["params"],
            training_records=len(train_recs),
            validation_records=len(val_recs),
            test_records=len(test_recs),
        )

    # 4. Model Selection Based on Validation Set Performance (Primary: Val MAE)
    sorted_by_val = sorted(candidate_results, key=lambda c: c['val_metrics']['mae_log10'])
    selected_winner = sorted_by_val[0]
    
    print("\n================================================================================")
    print("MODEL SELECTION & MULTI-CRITERIA GOVERNANCE EVALUATION")
    print("================================================================================")
    print(f"Selected Candidate based on Validation: {selected_winner['candidate_name']}")
    val_perf = selected_winner['val_metrics']
    test_perf = selected_winner['test_metrics']
    test_cov = selected_winner['conformal_coverage_test']
    
    # Predefined Acceptance Criteria:
    # 1. Validation MAE <= 0.60
    # 2. Held-Out Test MAE <= 0.60
    # 3. Risk Tier Concordance >= 60%
    # 4. Conformal Prediction Coverage >= 75%
    crit_val_mae = val_perf['mae_log10'] <= 0.60
    crit_test_mae = test_perf['mae_log10'] <= 0.60
    crit_tier_acc = test_perf['risk_tier_accuracy'] >= 0.60
    crit_conformal = test_cov >= 0.75

    all_passed = crit_val_mae and crit_test_mae and crit_tier_acc and crit_conformal

    print(f"  1. Validation MAE <= 0.60:             {'PASS' if crit_val_mae else 'FAIL'} ({val_perf['mae_log10']:.4f})")
    print(f"  2. Held-Out Test MAE <= 0.60:          {'PASS' if crit_test_mae else 'FAIL'} ({test_perf['mae_log10']:.4f})")
    print(f"  3. Risk Tier Accuracy >= 60%:          {'PASS' if crit_tier_acc else 'FAIL'} ({test_perf['risk_tier_accuracy']*100:.1f}%)")
    print(f"  4. Conformal Coverage >= 75%:          {'PASS' if crit_conformal else 'FAIL'} ({test_cov*100:.1f}%)")
    
    promotion_status = "production" if all_passed else "validated"
    print(f"\n=> Model Governance Decision: {promotion_status.upper()}")
    print("================================================================================")

    # 5. Save & Register Production Model Artifact
    prod_version = "v2.0.0-gbrt-ecfp4"
    prod_storage_path = os.path.join(storage_dir, f"{prod_version}.joblib")
    
    art = joblib.load(selected_winner["artifact_path"])
    art["model_version"] = prod_version
    art["dataset_version"] = "aprd-resistance-v2"
    art["feature_version"] = "v2.0-ecfp4-descriptors"
    art["status"] = promotion_status
    art["conformal_alpha"] = 0.10
    art["uncertainty_q_hat"] = selected_winner["uncertainty_quantile_q_hat"]
    art["metrics"] = {"validation_metrics": val_perf, "test_metrics": test_perf}
    art["frozen_at"] = datetime.now(timezone.utc).isoformat()
    
    joblib.dump(art, prod_storage_path)
    prod_hash = compute_sha256(prod_storage_path)
    art["artifact_sha256"] = prod_hash

    # Save to ML registry directory
    v2_registry_dir = os.path.join(registry_dir, prod_version)
    os.makedirs(v2_registry_dir, exist_ok=True)
    joblib.dump(art, os.path.join(v2_registry_dir, "model.joblib"))

    # Register in ModelRegistry
    model_registry.register_model(
        model_version=prod_version,
        algorithm=selected_winner["model_type"],
        feature_version="v2.0-ecfp4-descriptors",
        dataset_version="aprd-resistance-v2",
        metrics=test_perf,
        artifact_path=prod_storage_path,
        status=promotion_status,
        hyperparameters=selected_winner.get("hyperparameters", {}),
        training_records=len(train_recs),
        validation_records=len(val_recs),
        test_records=len(test_recs),
    )

    # 6. Slices & Subgroup Stability Analysis
    pipeline = art["feature_pipeline"]
    model = art["model"]
    X_all, y_all = pipeline.transform(records)
    all_preds = model.predict(X_all)
    errors = np.abs(all_preds - y_all)

    slice_orders = {}
    slice_moas = {}
    for idx, r in enumerate(records):
        order = r.get("canonical_organism", {}).get("order") or "Unknown"
        moa = r.get("canonical_pesticide", {}).get("irac_moa_group") or "Unknown"
        err = float(errors[idx])
        slice_orders.setdefault(order, []).append(err)
        slice_moas.setdefault(moa, []).append(err)

    print("\n--- Subgroup Stability Across Taxonomic Orders ---")
    for o, errs in sorted(slice_orders.items()):
        print(f"  * Order: {o:<15} | N = {len(errs):<2} | Subgroup Mean MAE: {np.mean(errs):.4f} | MedAE: {np.median(errs):.4f}")

    print("\n--- Subgroup Stability Across MoA Schemes/Groups ---")
    for m, errs in sorted(slice_moas.items()):
        print(f"  * MoA Group: {m:<10} | N = {len(errs):<2} | Subgroup Mean MAE: {np.mean(errs):.4f}")

    print("\nTemporal Benchmark and Governance Check Complete.")

if __name__ == "__main__":
    execute_temporal_benchmark()
