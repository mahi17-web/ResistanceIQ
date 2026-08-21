"""
ResistanceIQ — Resistance Model Service Interface
"""

import os
from typing import Dict, Any, Optional
from ml.inference.predictor import ResistancePredictor
from ml.inference.loader import ModelLoader
from ml.inference.output import PredictionResult


class ResistanceModelService:
    """
    Production inference engine executing real model predictions,
    calibrated conformal intervals, and out-of-domain sanity checks.
    """

    def __init__(self, model_version: Optional[str] = None, storage_dir: Optional[str] = None):
        self.model_version = model_version or ModelLoader.DEFAULT_MODEL_VERSION
        self.storage_dir = storage_dir
        self.predictor = ResistancePredictor(storage_dir=storage_dir)

    def predict(
        self,
        chemical_name: str,
        smiles: str,
        irac_moa_group: str = "4A",
        pest_name: str = "Myzus persicae",
        pest_order: str = "Hemiptera",
        assay_method: str = "Leaf-Dip",
    ) -> Dict[str, Any]:
        try:
            res: PredictionResult = self.predictor.predict({
                "chemical_name": chemical_name,
                "smiles": smiles,
                "irac_moa_group": irac_moa_group,
                "pest_name": pest_name,
                "pest_order": pest_order,
                "bioassay_method": assay_method,
                "model_version": self.model_version,
            })
            return {
                "status": res.status,
                "model_version": res.model_version,
                "model_type": res.model_type,
                "domain_applicability": res.domain_applicability.model_dump(),
                "predictions": {
                    "predicted_log10_rr": res.predicted_log10_rr,
                    "predicted_resistance_ratio": res.predicted_resistance_ratio,
                    "conformal_90pct_interval": {
                        "rr_lower_90pct": res.conformal_interval.rr_lower,
                        "rr_upper_90pct": res.conformal_interval.rr_upper,
                    },
                    "risk_tier": res.risk_tier,
                    "estimated_years_to_field_resistance": res.estimated_years_to_resistance,
                    "durability_score": res.durability_score,
                },
                "features_used": res.features_used,
            }
        except Exception as e:
            return {
                "status": "FAILED",
                "message": f"Inference execution failed: {str(e)}",
                "is_valid": False,
            }
