"""
ResistanceIQ — Inference Input Validator
"""

import re
from typing import Dict, Any, Tuple, Optional
from pydantic import BaseModel, Field, field_validator


class InferenceRequest(BaseModel):
    chemical_name: str = Field(..., min_length=1, max_length=200, description="Active ingredient or compound code")
    smiles: str = Field(..., min_length=2, max_length=1000, description="Canonical or valid SMILES string")
    irac_moa_group: str = Field(default="4A", description="IRAC Mode of Action class e.g. 1A, 3A, 4A, 28")
    pest_name: str = Field(default="Myzus persicae", description="Target organism scientific name")
    pest_order: str = Field(default="Hemiptera", description="Pest taxonomic order")
    bioassay_method: str = Field(default="Leaf-Dip", description="Bioassay protocol method")
    model_version: Optional[str] = Field(default=None, description="Optional explicit model version to request")

    @field_validator("smiles")
    @classmethod
    def validate_smiles_string(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("SMILES string cannot be empty.")
        # Basic character and bracket balance check
        if s.count("(") != s.count(")") or s.count("[") != s.count("]"):
            raise ValueError("Unbalanced parentheses or brackets in SMILES string.")
        invalid_chars = set(s) - set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@+\\-[]()=#$%./\\:")
        if invalid_chars:
            raise ValueError(f"Invalid chemical characters in SMILES string: {invalid_chars}")
        return s


class InputValidator:
    """
    Validation utilities for model inference parameters.
    """

    @classmethod
    def validate_payload(cls, data: Dict[str, Any]) -> InferenceRequest:
        return InferenceRequest.model_validate(data)
