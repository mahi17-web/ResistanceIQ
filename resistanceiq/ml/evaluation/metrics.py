"""
ResistanceIQ — Model Evaluation Metrics
"""

import numpy as np
from typing import Dict, Any, List
from scipy.stats import spearmanr


class ModelMetrics:
    """
    Computes rigorous regression and ordinal classification metrics.
    """

    @classmethod
    def to_risk_tier(cls, log_rr: float) -> str:
        rr = 10.0 ** log_rr
        if rr < 5.0:
            return "LOW"
        elif rr < 10.0:
            return "MODERATE"
        elif rr < 50.0:
            return "HIGH"
        else:
            return "CRITICAL"

    @classmethod
    def evaluate_regression(cls, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, Any]:
        y_true = np.asarray(y_true, dtype=np.float32)
        y_pred = np.asarray(y_pred, dtype=np.float32)

        errors = y_pred - y_true
        abs_errors = np.abs(errors)
        mae = float(np.mean(abs_errors))
        medae = float(np.median(abs_errors))
        rmse = float(np.sqrt(np.mean(errors ** 2)))
        
        # R2 score
        ss_res = np.sum(errors ** 2)
        ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
        r2 = float(1.0 - (ss_res / (ss_tot + 1e-7))) if ss_tot > 1e-7 else 0.0

        # Spearman rank correlation
        if len(y_true) >= 3 and np.std(y_true) > 1e-7 and np.std(y_pred) > 1e-7:
            rho, _ = spearmanr(y_true, y_pred)
            rho_val = float(rho) if not np.isnan(rho) else 0.0
        else:
            rho_val = 0.0 if (np.std(y_true) <= 1e-7 or np.std(y_pred) <= 1e-7) else 1.0

        # Risk tier concordance
        true_tiers = [cls.to_risk_tier(y) for y in y_true]
        pred_tiers = [cls.to_risk_tier(y) for y in y_pred]
        tier_accuracy = float(np.mean([t == p for t, p in zip(true_tiers, pred_tiers)]))

        # Bootstrap 95% Confidence Interval for MAE
        n_samples = len(y_true)
        if n_samples >= 5:
            rng = np.random.default_rng(42)
            boot_maes = []
            for _ in range(500):
                boot_idx = rng.choice(n_samples, size=n_samples, replace=True)
                boot_maes.append(np.mean(abs_errors[boot_idx]))
            mae_ci_lower = float(np.percentile(boot_maes, 2.5))
            mae_ci_upper = float(np.percentile(boot_maes, 97.5))
        else:
            mae_ci_lower = mae
            mae_ci_upper = mae

        return {
            "mae_log10": round(mae, 4),
            "medae_log10": round(medae, 4),
            "mae_ci_95": [round(mae_ci_lower, 4), round(mae_ci_upper, 4)],
            "rmse_log10": round(rmse, 4),
            "r2_score": round(r2, 4),
            "spearman_rho": round(rho_val, 4),
            "risk_tier_accuracy": round(tier_accuracy, 4),
            "sample_size": len(y_true),
        }
