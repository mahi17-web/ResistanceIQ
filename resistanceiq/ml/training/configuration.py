"""
ResistanceIQ — Model Training Configuration
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, List


class TrainingConfig(BaseModel):
    target: str = Field(default="log10_rr", description="Primary regression prediction target")
    dataset_version: str = Field(default="v1.0-aprd-canonical", description="Canonical input dataset version")
    feature_version: str = Field(default="v1.0-ecfp4-irac", description="Feature extractor version")
    split_strategy: str = Field(default="TEMPORAL_OUT_OF_TIME", description="Validation split strategy")
    train_year_cutoff: int = 2000
    val_year_cutoff: int = 2010
    model_type: str = Field(default="RIDGE", description="ML algorithm identifier (RIDGE / RANDOM_FOREST / GRADIENT_BOOSTING)")
    hyperparameters: Dict[str, Any] = Field(default_factory=lambda: {"alpha": 1.0}, description="Model hyperparameters")
    random_seed: int = 42
    storage_dir: str = "../storage/models"
