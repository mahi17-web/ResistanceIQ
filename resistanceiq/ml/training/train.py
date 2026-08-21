"""
ResistanceIQ — Model Training & Baseline Comparison Engine
"""

import os
import joblib
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.ensemble import (
    RandomForestRegressor,
    GradientBoostingRegressor,
    HistGradientBoostingRegressor,
)

from ml.features.builder import FeaturePipeline
from ml.training.dataset import DatasetLoader
from ml.training.baselines import GlobalMeanBaseline, SpeciesMoAGroupMeanBaseline
from ml.training.configuration import TrainingConfig
from ml.training.evaluate import EvaluationEngine
from ml.evaluation.metrics import ModelMetrics
from ml.evaluation.uncertainty import ConformalIntervalCalibrator
from ml.evaluation.ood_detector import DomainApplicabilityDetector


class ModelTrainer:
    """
    Orchestrates reproducible feature generation, baseline fitting, model training,
    and out-of-time temporal evaluation with zero leakage.
    """

    def __init__(self, config: Optional[TrainingConfig] = None):
        self.config = config or TrainingConfig()
        self.storage_dir = os.path.abspath(self.config.storage_dir)
        os.makedirs(self.storage_dir, exist_ok=True)

        self.feature_pipeline = FeaturePipeline()
        self.global_baseline = GlobalMeanBaseline()
        self.group_baseline = SpeciesMoAGroupMeanBaseline()
        self.conformal_calibrator = ConformalIntervalCalibrator(alpha=0.10)
        self.ood_detector = DomainApplicabilityDetector()
        self.model = None

    def train_and_evaluate(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        # 1. Strict Out-of-Time Temporal Split
        train_recs, val_recs, test_recs = DatasetLoader.temporal_split(
            records,
            train_year_cutoff=self.config.train_year_cutoff,
            val_year_cutoff=self.config.val_year_cutoff,
        )

        if len(train_recs) == 0:
            raise ValueError("Training record count is 0. Cannot train model.")

        # 2. Fit Feature Pipeline ONLY on Training Records
        self.feature_pipeline.fit(train_recs)
        X_train, y_train = self.feature_pipeline.transform(train_recs)
        X_val, y_val = self.feature_pipeline.transform(val_recs) if len(val_recs) > 0 else (np.empty((0, X_train.shape[1])), np.empty((0,)))
        X_test, y_test = self.feature_pipeline.transform(test_recs) if len(test_recs) > 0 else (np.empty((0, X_train.shape[1])), np.empty((0,)))

        # 3. Fit Baselines
        self.global_baseline.fit(y_train)
        self.group_baseline.fit(train_recs, y_train)

        # 4. Train Supervised Model
        if self.config.model_type == "RIDGE":
            alpha = float(self.config.hyperparameters.get("alpha", 1.0))
            self.model = Ridge(alpha=alpha, random_state=self.config.random_seed)
        elif self.config.model_type == "RANDOM_FOREST":
            n_est = int(self.config.hyperparameters.get("n_estimators", 50))
            max_d = int(self.config.hyperparameters.get("max_depth", 5))
            self.model = RandomForestRegressor(n_estimators=n_est, max_depth=max_d, random_state=self.config.random_seed)
        elif self.config.model_type in ["GRADIENT_BOOSTING", "GBRT"]:
            n_est = int(self.config.hyperparameters.get("n_estimators", 40))
            lr = float(self.config.hyperparameters.get("learning_rate", 0.05))
            max_d = int(self.config.hyperparameters.get("max_depth", 3))
            self.model = GradientBoostingRegressor(n_estimators=n_est, learning_rate=lr, max_depth=max_d, random_state=self.config.random_seed)
        elif self.config.model_type in ["HIST_GRADIENT_BOOSTING", "HIST_GBRT"]:
            max_iter = int(self.config.hyperparameters.get("max_iter", 50))
            lr = float(self.config.hyperparameters.get("learning_rate", 0.05))
            max_d = int(self.config.hyperparameters.get("max_depth", 3))
            self.model = HistGradientBoostingRegressor(max_iter=max_iter, learning_rate=lr, max_depth=max_d, random_state=self.config.random_seed)
        else:
            self.model = Ridge(alpha=1.0, random_state=self.config.random_seed)

        self.model.fit(X_train, y_train)

        # 5. Fit OOD Detector on Training Records
        self.ood_detector.fit(train_recs)

        # 6. Conformal Calibration on Validation Split
        if len(val_recs) > 0:
            val_preds = self.model.predict(X_val)
            self.conformal_calibrator.calibrate(y_val, val_preds)
        else:
            train_preds = self.model.predict(X_train)
            self.conformal_calibrator.calibrate(y_train, train_preds)

        # 7. Evaluate on Holdout Test Split (or fallback to Validation)
        eval_X = X_test if len(test_recs) > 0 else (X_val if len(val_recs) > 0 else X_train)
        eval_y = y_test if len(test_recs) > 0 else (y_val if len(val_recs) > 0 else y_train)
        eval_recs = test_recs if len(test_recs) > 0 else (val_recs if len(val_recs) > 0 else train_recs)
        eval_set_name = "TEST_HOLDOUT (2011-2026)" if len(test_recs) > 0 else "TRAIN_RESIDUALS"

        # Predictions
        global_base_preds = self.global_baseline.predict(eval_X)
        group_base_preds = self.group_baseline.predict(eval_recs)
        model_preds = self.model.predict(eval_X)

        # Baseline comparison
        eval_comparison = EvaluationEngine.compare_against_baselines(
            y_true=eval_y,
            baseline_global_preds=global_base_preds,
            baseline_group_preds=group_base_preds,
            model_preds=model_preds,
        )

        # Extract top feature importances
        top_features = EvaluationEngine.get_top_feature_importance(
            model=self.model,
            feature_names=self.feature_pipeline.feature_names,
            top_k=10,
        )

        # 8. Serialize and Save Model Artifact
        model_version = f"v0.1-{self.config.model_type.lower()}-ecfp4"
        artifact_filename = f"{model_version}.joblib"
        artifact_path = os.path.join(self.storage_dir, artifact_filename)
        
        artifact_payload = {
            "model_version": model_version,
            "model_type": self.config.model_type,
            "config": self.config.model_dump(),
            "model": self.model,
            "feature_pipeline": self.feature_pipeline,
            "conformal_calibrator": self.conformal_calibrator,
            "ood_detector": self.ood_detector,
            "global_baseline": self.global_baseline,
            "group_baseline": self.group_baseline,
            "metrics": eval_comparison["model_metrics"],
            "top_features": top_features,
            "trained_at": datetime.now(timezone.utc).isoformat(),
        }
        joblib.dump(artifact_payload, artifact_path)

        summary = {
            "model_version": model_version,
            "model_type": self.config.model_type,
            "target": self.config.target,
            "dataset_version": self.config.dataset_version,
            "feature_version": self.feature_pipeline.FEATURE_VERSION,
            "dataset_split": {
                "train_count": len(train_recs),
                "val_count": len(val_recs),
                "test_count": len(test_recs),
                "evaluation_set": eval_set_name,
            },
            "metrics": eval_comparison,
            "top_features": top_features,
            "uncertainty_quantile_q_hat": self.conformal_calibrator.q_hat,
            "artifact_path": artifact_path,
        }

        return summary
