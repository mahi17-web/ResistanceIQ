"""
ResistanceIQ — Continuous Numerical Feature Engineering
"""

import numpy as np
from typing import Dict, Any, List


class NumericalFeatureExtractor:
    """
    Extracts continuous physicochemical and molecular descriptors.
    """

    NUMERICAL_FEATURE_NAMES = [
        "molecular_weight",
        "logp",
        "tpsa",
        "hbd_count",
        "hba_count",
        "rotatable_bonds",
    ]

    @classmethod
    def extract_from_dict(cls, chem_dict: Dict[str, Any]) -> np.ndarray:
        return np.array([
            float(chem_dict.get("molecular_weight", 300.0)),
            float(chem_dict.get("logp", 2.5)),
            float(chem_dict.get("tpsa", 50.0)),
            float(chem_dict.get("hbd_count", 1)),
            float(chem_dict.get("hba_count", 4)),
            float(chem_dict.get("rotatable_bonds", 3)),
        ], dtype=np.float32)
