"""
ResistanceIQ — Out-of-Distribution (OOD) & Domain Applicability Detector
"""

import numpy as np
from typing import Dict, Any, List, Set

try:
    from rdkit import Chem, DataStructs
    from rdkit.Chem import rdFingerprintGenerator
    RDKIT_AVAILABLE = True
except ImportError:
    RDKIT_AVAILABLE = False


class DomainApplicabilityDetector:
    """
    Evaluates whether an inference candidate falls inside the training domain
    using chemical Tanimoto similarity and biochemical class representations.
    """

    def __init__(self):
        self.training_fps: List[Any] = []
        self.training_moas: Set[str] = set()
        self.training_orders: Set[str] = set()
        self.is_fitted = False

    def fit(self, training_records: List[Dict[str, Any]]):
        self.training_fps = []
        self.training_moas = set()
        self.training_orders = set()

        for r in training_records:
            active = r.get("pesticide", {}).get("active_ingredient") or r.get("active_ingredient", "")
            moa = r.get("pesticide", {}).get("irac_moa_group") or r.get("mode_of_action")
            order = r.get("organism", {}).get("order") or r.get("order")

            if moa: self.training_moas.add(str(moa))
            if order: self.training_orders.add(str(order))

            if RDKIT_AVAILABLE:
                from ml.features.chemistry import ChemistryFeatureExtractor
                smiles = ChemistryFeatureExtractor.get_smiles(active)
                if smiles:
                    m = Chem.MolFromSmiles(smiles)
                    if m:
                        try:
                            mfpgen = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=1024)
                            fp = mfpgen.GetFingerprint(m)
                        except Exception:
                            from rdkit.Chem import AllChem
                            fp = AllChem.GetMorganFingerprintAsBitVect(m, radius=2, nBits=1024)
                        self.training_fps.append(fp)

        self.is_fitted = True
        return self

    def assess_candidate(
        self,
        smiles: str,
        irac_moa: str,
        pest_order: str,
    ) -> Dict[str, Any]:
        if not self.is_fitted:
            return {"domain_status": "IN_DOMAIN", "max_tanimoto_similarity": 1.0, "notes": "Detector unfitted"}

        max_tanimoto = 0.0
        if RDKIT_AVAILABLE and smiles and len(self.training_fps) > 0:
            m = Chem.MolFromSmiles(smiles)
            if m:
                try:
                    mfpgen = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=1024)
                    query_fp = mfpgen.GetFingerprint(m)
                except Exception:
                    from rdkit.Chem import AllChem
                    query_fp = AllChem.GetMorganFingerprintAsBitVect(m, radius=2, nBits=1024)
                sims = DataStructs.BulkTanimotoSimilarity(query_fp, self.training_fps)
                max_tanimoto = float(max(sims)) if sims else 0.0

        moa_in_domain = str(irac_moa) in self.training_moas
        order_in_domain = str(pest_order) in self.training_orders

        # Classification rules
        if max_tanimoto >= 0.40 and moa_in_domain and order_in_domain:
            status = "IN_DOMAIN"
            confidence = "HIGH"
            message = "Candidate chemistry and target biology are well-represented in the training corpus."
        elif max_tanimoto >= 0.25 and (moa_in_domain or order_in_domain):
            status = "LOW_SUPPORT"
            confidence = "MEDIUM"
            message = "Candidate possesses moderate structural similarity to training series. Predictions carry widened uncertainty."
        else:
            status = "OUT_OF_DOMAIN"
            confidence = "LOW"
            message = "Candidate scaffold or MoA is novel and outside the model's verified applicability domain."

        return {
            "domain_status": status,
            "confidence_level": confidence,
            "max_tanimoto_similarity": round(max_tanimoto, 3),
            "moa_represented": moa_in_domain,
            "pest_order_represented": order_in_domain,
            "message": message,
        }
