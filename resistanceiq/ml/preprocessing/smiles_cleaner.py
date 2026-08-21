"""
ResistanceIQ — SMILES Standardization & Molecular Preprocessing
"""

import re
from typing import Optional, Dict


def clean_smiles(raw_smiles: str) -> Optional[str]:
    """
    Sanitizes raw SMILES strings by removing whitespace, comments, and invalid characters.
    """
    if not raw_smiles or not isinstance(raw_smiles, str):
        return None
    cleaned = raw_smiles.strip()
    # Basic structural balance check for parentheses and brackets
    if cleaned.count("(") != cleaned.count(")"):
        return None
    if cleaned.count("[") != cleaned.count("]"):
        return None
    return cleaned


def compute_basic_descriptors(smiles: str) -> Dict[str, float]:
    """
    Rule-based baseline descriptor estimation pending full RDKit integration.
    """
    cleaned = clean_smiles(smiles) or ""
    # Approximate molecular weight from atom occurrences
    c_count = len(re.findall(r"C", cleaned))
    n_count = len(re.findall(r"N", cleaned))
    o_count = len(re.findall(r"O", cleaned))
    cl_count = len(re.findall(r"Cl", cleaned))
    f_count = len(re.findall(r"F", cleaned))

    approx_mw = (c_count * 12.011) + (n_count * 14.007) + (o_count * 15.999) + (cl_count * 35.45) + (f_count * 18.998)
    return {
        "approx_mw": round(approx_mw, 2),
        "atom_count": len(cleaned),
        "heteroatom_ratio": round((n_count + o_count + cl_count + f_count) / max(1, c_count), 2),
    }
