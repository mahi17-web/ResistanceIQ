"""
ResistanceIQ — Model Evaluation & Baseline Comparison Module
"""

import numpy as np
from typing import Dict, Any, List
from ml.evaluation.metrics import ModelMetrics


class EvaluationEngine:
    """
    Evaluates models against scientific baselines, computes error metrics,
    and extracts feature importance / coefficient weights.
    """

    @classmethod
    def compare_against_baselines(
        cls,
        y_true: np.ndarray,
        baseline_global_preds: np.ndarray,
        baseline_group_preds: np.ndarray,
        model_preds: np.ndarray,
    ) -> Dict[str, Any]:
        global_m = ModelMetrics.evaluate_regression(y_true, baseline_global_preds)
        group_m = ModelMetrics.evaluate_regression(y_true, baseline_group_preds)
        model_m = ModelMetrics.evaluate_regression(y_true, model_preds)

        mae_base = global_m["mae_log10"]
        mae_model = model_m["mae_log10"]
        improvement_pct = round(((mae_base - mae_model) / max(1e-5, mae_base)) * 100, 2)

        return {
            "global_mean_baseline": global_m,
            "species_moa_baseline": group_m,
            "model_metrics": model_m,
            "improvement_vs_global_baseline_pct": improvement_pct,
        }

    @classmethod
    def get_top_feature_importance(
        cls,
        model: Any,
        feature_names: List[str],
        top_k: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Extracts top feature coefficients (for linear models) or feature importances (for trees).
        """
        importances = []
        if hasattr(model, "coef_"):
            weights = np.abs(model.coef_)
            raw_weights = model.coef_
            top_indices = np.argsort(weights)[::-1][:top_k]
            for idx in top_indices:
                if idx < len(feature_names):
                    importances.append({
                        "feature_name": feature_names[idx],
                        "weight": round(float(raw_weights[idx]), 4),
                        "abs_importance": round(float(weights[idx]), 4),
                    })
        elif hasattr(model, "feature_importances_"):
            weights = model.feature_importances_
            top_indices = np.argsort(weights)[::-1][:top_k]
            for idx in top_indices:
                if idx < len(feature_names):
                    importances.append({
                        "feature_name": feature_names[idx],
                        "weight": round(float(weights[idx]), 4),
                        "abs_importance": round(float(weights[idx]), 4),
                    })

        return importances
