"""
ResistanceIQ — Categorical Encoders with Out-of-Vocabulary Robustness
"""

from typing import List, Dict, Any, Set
import numpy as np


class CategoricalOneHotEncoder:
    """
    Fit-on-train one-hot encoder that handles unseen/rare categories safely.
    """

    def __init__(self, feature_name: str):
        self.feature_name = feature_name
        self.vocabulary: List[str] = []
        self.vocab_to_idx: Dict[str, int] = {}
        self.is_fitted = False

    def fit(self, values: List[str]):
        unique = sorted(list(set(v.strip() for v in values if v and v.strip())))
        self.vocabulary = unique
        self.vocab_to_idx = {val: idx for idx, val in enumerate(self.vocabulary)}
        self.is_fitted = True
        return self

    def transform(self, values: List[str]) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError(f"Encoder for {self.feature_name} must be fitted on training data before transform.")

        dim = len(self.vocabulary)
        # Add 1 dimension for UNKNOWN / OOD category
        matrix = np.zeros((len(values), dim + 1), dtype=np.float32)
        for row_idx, val in enumerate(values):
            clean = str(val).strip() if val else ""
            if clean in self.vocab_to_idx:
                col_idx = self.vocab_to_idx[clean]
                matrix[row_idx, col_idx] = 1.0
            else:
                matrix[row_idx, dim] = 1.0  # UNKNOWN bucket
        return matrix

    def get_feature_names(self) -> List[str]:
        names = [f"{self.feature_name}_{v}" for v in self.vocabulary]
        names.append(f"{self.feature_name}_UNKNOWN")
        return names
