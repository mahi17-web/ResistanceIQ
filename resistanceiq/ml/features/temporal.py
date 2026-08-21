"""
ResistanceIQ — Temporal Feature Engineering (Strictly Pre-Event)
"""

import numpy as np
from typing import Dict, Any, List


class TemporalFeatureExtractor:
    """
    Extracts time-anchored features relative to historical baseline without future leakage.
    Baseline year 1946 represents the start of modern synthetic chemical pesticide field observation (DDT era).
    """

    BASELINE_YEAR = 1946

    @classmethod
    def extract_temporal_features(cls, record: Dict[str, Any]) -> Dict[str, float]:
        year = int(record.get("resistance_year", 2000))
        years_since_baseline = max(0, year - cls.BASELINE_YEAR)
        
        return {
            "observation_year": float(year),
            "years_since_1946_baseline": float(years_since_baseline),
        }
