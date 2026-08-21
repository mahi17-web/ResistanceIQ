"""
ResistanceIQ — Cheminformatics Feature Extraction (RDKit Morgan Fingerprints & Descriptors)
"""

import numpy as np
from typing import Dict, Any, Optional

try:
    from rdkit import Chem
    from rdkit.Chem import Descriptors, rdMolDescriptors, rdFingerprintGenerator
    RDKIT_AVAILABLE = True
except ImportError:
    RDKIT_AVAILABLE = False


class ChemistryFeatureExtractor:
    """
    Extracts 1024-bit Morgan circular fingerprints (ECFP4) and
    physicochemical molecular descriptors from canonical SMILES strings.
    """

    N_BITS = 1024
    RADIUS = 2

    # Curated SMILES mapping for standard active ingredients
    KNOWN_SMILES: Dict[str, str] = {
        "imidacloprid": "C1CN(C(=N1)NC(=O)N)CC2=CN=C(C=C2)Cl",
        "clothianidin": "CNC(=N[N+](=O)[O-])NCC1=CN=C(S1)Cl",
        "thiamethoxam": "CN1COCN(C1=N[N+](=O)[O-])CC2=CN=C(S2)Cl",
        "pirimicarb": "CCN(CC)C(=O)OC1=C(N=C(N(C1=O)C)C)N(C)C",
        "methomyl": "CC(=NOC(=O)NC)SC",
        "chlorpyrifos": "CCOP(=S)(OCC)OC1=NC(=C(C=C1Cl)Cl)Cl",
        "diazinon": "CCOP(=S)(OCC)OC1=NC(=NC(=C1)C(C)C)C",
        "abamectin": "CC1CCC2(CC1)CC3CC(O2)CC=C(C(C(C=CC=C4COC5C4(C(CC(O5)C(=CC3=O)C)O)O)C)OC6CC(C(C(O6)C)OC7CC(C(C(O7)C)O)OC)OC)C",
        "permethrin": "CC1(C(C1C(=O)OCC2=CC(=CC=C2)OC3=CC=CC=C3)C=C(Cl)Cl)C",
        "cypermethrin": "CC1(C(C1C(=O)OC(C#N)C2=CC(=CC=C2)OC3=CC=CC=C3)C=C(Cl)Cl)C",
        "deltamethrin": "CC1(C(C1C(=O)OC(C#N)C2=CC(=CC=C2)OC3=CC=CC=C3)C=C(Br)Br)C",
        "chlorantraniliprole": "CC1=CC(=CC(=C1C(=O)NC2=CC(=CC(=C2C(=O)NC)Cl)C)Cl)N3N=C(C=N3)C4=NC=CC=C4Cl",
        "spiromesifen": "CC1(CCC2(CC1)C(=O)C(=C(O2)C3=CC(=CC(=C3)C)C)OC(=O)CC(C)(C)C)C",
        "ddt": "C1=CC(=CC=C1C(C2=CC=C(C=C2)Cl)C(Cl)(Cl)Cl)Cl",
    }

    @classmethod
    def get_smiles(cls, active_ingredient: str, explicit_smiles: Optional[str] = None) -> Optional[str]:
        if explicit_smiles and len(explicit_smiles) >= 3:
            return explicit_smiles
        return cls.KNOWN_SMILES.get(active_ingredient.lower().strip())

    @classmethod
    def extract_features(cls, active_ingredient: str, explicit_smiles: Optional[str] = None) -> Dict[str, Any]:
        smiles = cls.get_smiles(active_ingredient, explicit_smiles)
        
        # Default zero-filled descriptors if SMILES unresolvable
        desc = {
            "molecular_weight": 300.0,
            "logp": 2.5,
            "tpsa": 50.0,
            "hbd_count": 1,
            "hba_count": 4,
            "rotatable_bonds": 3,
            "ecfp4": np.zeros(cls.N_BITS, dtype=np.float32),
            "smiles": smiles,
            "is_valid_structure": False,
        }

        if not smiles or not RDKIT_AVAILABLE:
            return desc

        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            return desc

        # Compute Descriptors
        desc["molecular_weight"] = float(Descriptors.MolWt(mol))
        desc["logp"] = float(Descriptors.MolLogP(mol))
        desc["tpsa"] = float(Descriptors.TPSA(mol))
        desc["hbd_count"] = int(rdMolDescriptors.CalcNumHBD(mol))
        desc["hba_count"] = int(rdMolDescriptors.CalcNumHBA(mol))
        desc["rotatable_bonds"] = int(rdMolDescriptors.CalcNumRotatableBonds(mol))
        desc["is_valid_structure"] = True

        # Generate 1024-bit Morgan Fingerprint
        try:
            mfpgen = rdFingerprintGenerator.GetMorganGenerator(radius=cls.RADIUS, fpSize=cls.N_BITS)
            fp = mfpgen.GetFingerprint(mol)
        except Exception:
            from rdkit.Chem import AllChem
            fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius=cls.RADIUS, nBits=cls.N_BITS)
            
        arr = np.zeros((cls.N_BITS,), dtype=np.float32)
        for bit in fp.GetOnBits():
            arr[bit] = 1.0
        desc["ecfp4"] = arr

        return desc
