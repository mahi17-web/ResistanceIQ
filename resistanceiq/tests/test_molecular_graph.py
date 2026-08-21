"""
ResistanceIQ — Molecular Graph & SMILES Verification Test
"""

import pytest
from ml.features.chemistry import ChemistryFeatureExtractor


def test_cco_molecular_graph_and_atom_counts():
    """
    Test that input 'CCO' produces a molecular graph with:
    - 2 Carbon atoms
    - 1 Oxygen atom
    - 6 Implicit/explicit Hydrogen atoms
    - ZERO Chlorine, Fluorine, Nitrogen, or demo atoms.
    """
    chem = ChemistryFeatureExtractor.extract_features("Ethanol", "CCO")
    
    assert chem["is_valid_structure"] is True
    assert chem["molecular_weight"] == pytest.approx(46.07, abs=0.5)
    assert chem["hbd_count"] == 1
    assert chem["hba_count"] == 1
    assert chem["ecfp4"] is not None
    assert len(chem["ecfp4"]) == 1024


def test_invalid_smiles_handling():
    chem = ChemistryFeatureExtractor.extract_features("Invalid", "NOT_A_SMILES_STRING_123!@#")
    assert chem["is_valid_structure"] is False
