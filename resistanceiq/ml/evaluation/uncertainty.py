"""
ResistanceIQ — Conformal Prediction Uncertainty Quantifier
"""

import numpy as np
from typing import Dict, Any, Tuple


class ConformalIntervalCalibrator:
    """
    Split Conformal Prediction for distribution-free, guaranteed finite-sample
    prediction intervals [y_hat - q_alpha, y_hat + q_alpha] at 1 - alpha coverage (e.g. 90%).
    """

    def __init__(self, alpha: float = 0.10):
        self.alpha = alpha
        self.q_hat: float = 0.50
        self.is_calibrated = False

    def calibrate(self, y_val_true: np.ndarray, y_val_pred: np.ndarray):
        y_val_true = np.asarray(y_val_true, dtype=np.float32)
        y_val_pred = np.asarray(y_val_pred, dtype=np.float32)
        
        residuals = np.abs(y_val_true - y_val_pred)
        n = len(residuals)
        
        if n == 0:
            self.q_hat = 0.50
        else:
            # Conformal quantile formula: ceiling((n + 1) * (1 - alpha)) / n
            k = int(np.ceil((n + 1) * (1.0 - self.alpha)))
            k = min(n, max(1, k))
            sorted_residuals = np.sort(residuals)
            self.q_hat = float(sorted_residuals[k - 1])

        self.is_calibrated = True
        return self

    def predict_intervals(self, y_pred: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        y_pred = np.asarray(y_pred, dtype=np.float32)
        lower = np.maximum(0.0, y_pred - self.q_hat)
        upper = y_pred + self.q_hat
        return y_pred, lower, upper
