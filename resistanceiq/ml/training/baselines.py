"""
ResistanceIQ — Scientific Baseline Models
"""

import numpy as np
from typing import Dict, Any, List, Optional
from collections import defaultdict


class GlobalMeanBaseline:
    """
    Naive baseline predicting the constant training set mean: hat{y} = mean(y_train).
    """

    def __init__(self):
        self.mean_val: float = 0.0
        self.is_fitted: bool = False

    def fit(self, y_train: np.ndarray):
        self.mean_val = float(np.mean(y_train))
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("GlobalMeanBaseline must be fitted before predict.")
        return np.full(shape=(X.shape[0],), fill_value=self.mean_val, dtype=np.float32)


class SpeciesMoAGroupMeanBaseline:
    """
    Contextual baseline predicting the training mean conditional on (Pest Order, IRAC MoA Group).
    Falls back to global mean for unseen pairs.
    """

    def __init__(self):
        self.group_means: Dict[Tuple[str, str], float] = {}
        self.global_mean: float = 0.0
        self.is_fitted: bool = False

    def fit(self, records: List[Dict[str, Any]], y_train: np.ndarray):
        group_sums = defaultdict(float)
        group_counts = defaultdict(int)

        for r, y in zip(records, y_train):
            order = r.get("organism", {}).get("order") or "Unknown"
            moa = r.get("pesticide", {}).get("irac_moa_group") or "Unknown"
            key = (order, moa)
            group_sums[key] += float(y)
            group_counts[key] += 1

        self.group_means = {k: group_sums[k] / group_counts[k] for k in group_sums}
        self.global_mean = float(np.mean(y_train)) if len(y_train) > 0 else 0.0
        self.is_fitted = True
        return self

    def predict(self, records: List[Dict[str, Any]]) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("SpeciesMoAGroupMeanBaseline must be fitted before predict.")
        
        preds = []
        for r in records:
            order = r.get("organism", {}).get("order") or "Unknown"
            moa = r.get("pesticide", {}).get("irac_moa_group") or "Unknown"
            key = (order, moa)
            preds.append(self.group_means.get(key, self.global_mean))
        return np.array(preds, dtype=np.float32)
