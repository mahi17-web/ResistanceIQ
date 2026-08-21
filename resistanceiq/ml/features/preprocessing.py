"""
ResistanceIQ — Train-Isolated Numerical Preprocessing
"""

import numpy as np
from typing import Optional, List


class IsolatedStandardScaler:
    """
    Standardizes continuous features (mean=0, variance=1) computed strictly from training split.
    Prevents temporal and test set statistical leakage.
    """

    def __init__(self):
        self.means: Optional[np.ndarray] = None
        self.stds: Optional[np.ndarray] = None
        self.is_fitted = False

    def fit(self, X: np.ndarray):
        X = np.asarray(X, dtype=np.float32)
        self.means = np.nanmean(X, axis=0)
        self.stds = np.nanstd(X, axis=0)
        # Avoid division by zero for constant features
        self.stds[self.stds < 1e-7] = 1.0
        self.is_fitted = True
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("IsolatedStandardScaler must be fitted on training fold prior to transform.")
        X = np.asarray(X, dtype=np.float32)
        # Impute NaNs with training fold mean
        inds = np.where(np.isnan(X))
        X[inds] = np.take(self.means, inds[1])
        return (X - self.means) / self.stds
