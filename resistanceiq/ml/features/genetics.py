"""
ResistanceIQ — Genetics & Target-Site Mutation Feature Engineering
"""

import numpy as np
from typing import Dict, Any, List, Optional


class GeneticFeatureExtractor:
    """
    Handles genetic target site representations and structural mutation features.
    Step 4 audit noted 0 direct sequenced field mutation records in initial benchmark;
    computational binding energetics (Delta Delta G) and known target site mutation indicators
    are processed here when available.
    """

    @classmethod
    def extract_genetics(cls, record: Dict[str, Any]) -> Dict[str, float]:
        # Default features for benchmark dataset where field sequencing is unobserved
        genetics_info = record.get("genetics") or {}
        
        has_mutation_data = 1.0 if genetics_info.get("mutation_name") else 0.0
        delta_delta_g = float(genetics_info.get("delta_delta_g", 0.0))
        mutation_count = float(genetics_info.get("mutation_count", 0))

        return {
            "has_sequenced_mutation": has_mutation_data,
            "target_site_delta_delta_g": delta_delta_g,
            "mutation_count": mutation_count,
        }
