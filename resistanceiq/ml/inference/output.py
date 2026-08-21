"""
ResistanceIQ — Inference Output Contracts & Dataclasses
"""

from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class ConformalIntervalOutput(BaseModel):
    alpha: float = Field(default=0.10, description="Significance level (1 - alpha = 90% coverage)")
    q_hat: float = Field(..., description="Conformal quantile bound on log10 scale")
    rr_lower: float = Field(..., description="Lower 90% confidence bound for resistance ratio")
    rr_upper: float = Field(..., description="Upper 90% confidence bound for resistance ratio")


class DomainApplicabilityOutput(BaseModel):
    domain_status: str = Field(..., description="IN_DOMAIN | LIMITED_SUPPORT | OUT_OF_DOMAIN")
    confidence_level: str = Field(..., description="HIGH | MEDIUM | LOW")
    max_tanimoto_similarity: float = Field(..., description="Max Morgan fingerprint similarity to training set")
    moa_represented: bool = Field(..., description="Whether IRAC MoA was present in training distribution")
    pest_order_represented: bool = Field(..., description="Whether pest order was present in training distribution")
    message: str = Field(..., description="Explanatory domain assessment message")


class PredictionResult(BaseModel):
    status: str = Field(default="COMPLETED", description="COMPLETED | OUT_OF_DOMAIN | FAILED")
    model_version: str = Field(..., description="Frozen model version identifier")
    model_type: str = Field(..., description="Model algorithm e.g. RIDGE")
    predicted_log10_rr: float = Field(..., description="Predicted log10(Resistance Ratio)")
    predicted_resistance_ratio: float = Field(..., description="Estimated resistance ratio (10^y)")
    estimated_years_to_resistance: float = Field(..., description="Estimated field durability horizon in years")
    durability_score: float = Field(..., description="Normalized durability index [0.0 - 1.0]")
    risk_tier: str = Field(..., description="SUSCEPTIBLE | TOLERANCE | MODERATE | CRITICAL")
    conformal_interval: ConformalIntervalOutput
    domain_applicability: DomainApplicabilityOutput
    features_used: Dict[str, Any]
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
