"""
ResistanceIQ — Step 5 Model Training & Baseline Evaluation Runner
"""

import sys
import os
import json

# Ensure backend root and project root on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.database import SessionLocal
from ml.training.dataset import DatasetLoader
from ml.training.train import ModelTrainer
from ml.training.configuration import TrainingConfig
from ml.features.builder import FeaturePipeline


def main():
    print("=" * 70)
    print("ResistanceIQ — Step 5: Feature Pipeline & Baseline Model Execution")
    print("=" * 70)

    db = SessionLocal()
    try:
        # 1. Load Canonical Records from Database
        records = DatasetLoader.load_canonical_records(db)
        print(f"Loaded {len(records)} verified canonical records from database.")

        if len(records) == 0:
            print("Error: No records found. Please run Step 3 ingestion first.")
            return

        # 2. Generate Feature Quality Report & Distribution Charts
        pipeline = FeaturePipeline()
        train_recs, _, _ = DatasetLoader.temporal_split(records, train_year_cutoff=2000)
        pipeline.fit(train_recs)
        
        quality_report_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../../data/audit/feature-quality.json")
        )
        dist_plots_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../../data/audit/feature-distributions")
        )
        pipeline.generate_quality_report(records, output_path=quality_report_path, dist_plots_dir=dist_plots_dir)
        print(f"Feature Quality Profile generated at: {quality_report_path}")
        print(f"Distribution Visualizations saved at: {dist_plots_dir}")

        # 3. Train Baseline & First Model (Ridge Regressor with ECFP4 Fingerprints)
        config = TrainingConfig(
            target="log10_rr",
            dataset_version="v1.0-aprd-canonical",
            feature_version=pipeline.FEATURE_VERSION,
            split_strategy="TEMPORAL_OUT_OF_TIME",
            train_year_cutoff=2000,
            val_year_cutoff=2010,
            model_type="RIDGE",
            hyperparameters={"alpha": 1.0},
            random_seed=42,
            storage_dir=os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage/models")),
        )

        trainer = ModelTrainer(config=config)
        results = trainer.train_and_evaluate(records)

        print("\n--- Model Training & Validation Results ---")
        print(f"Model Version:            {results['model_version']}")
        print(f"Model Type:               {results['model_type']}")
        print(f"Target:                   {results['target']}")
        print(f"Train Folds Count:        {results['dataset_split']['train_count']} records (<= 2000)")
        print(f"Validation Folds Count:   {results['dataset_split']['val_count']} records (2001-2010)")
        print(f"Test Folds Count:         {results['dataset_split']['test_count']} records (2011-2026)")
        print(f"Evaluation Set:           {results['dataset_split']['evaluation_set']}")
        
        m_base = results["metrics"]["global_mean_baseline"]
        m_group = results["metrics"]["species_moa_baseline"]
        m_model = results["metrics"]["model_metrics"]

        print(f"\nGlobal Mean Baseline MAE: {m_base['mae_log10']} (RMSE: {m_base['rmse_log10']})")
        print(f"Species-MoA Baseline MAE: {m_group['mae_log10']} (RMSE: {m_group['rmse_log10']})")
        print(f"First Model (Ridge) MAE:  {m_model['mae_log10']} (RMSE: {m_model['rmse_log10']})")
        print(f"Improvement vs Baseline:  {results['metrics']['improvement_vs_global_baseline_pct']}%")
        print(f"Conformal 90% Bound q_hat:{results['uncertainty_quantile_q_hat']}")
        print(f"Model Artifact Saved to:  {results['artifact_path']}")

        # 4. Save Experiment Record
        exp_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../experiments"))
        os.makedirs(exp_dir, exist_ok=True)
        exp_file = os.path.join(exp_dir, "experiment_001_baseline_vs_ridge.json")
        with open(exp_file, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
        print(f"Experiment log saved to:  {exp_file}")
        print("=" * 70)

    finally:
        db.close()


if __name__ == "__main__":
    main()
