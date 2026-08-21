"""
ResistanceIQ — Dataset Loader & Time-Forward Splitter
"""

import os
import json
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from app.models import ResistanceCase, CanonicalOrganism, CanonicalPesticide


class DatasetLoader:
    """
    Loads verified canonical resistance observations from the database
    or processed canonical storage, and partitions into strict Out-of-Time temporal splits.
    """

    @classmethod
    def load_from_jsonl(cls, file_path: Optional[str] = None) -> List[Dict[str, Any]]:
        if file_path is None:
            # Locate default processed JSONL file (preferring v2)
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/processed"))
            if os.path.exists(base_dir):
                files = os.listdir(base_dir)
                v2_files = [f for f in files if "v2" in f and f.endswith(".jsonl")]
                if v2_files:
                    file_path = os.path.join(base_dir, v2_files[0])
                else:
                    for f in files:
                        if f.endswith(".jsonl"):
                            file_path = os.path.join(base_dir, f)
                            break

        records = []
        if file_path and os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        r = json.loads(line.strip())
                        records.append({
                            "case_id": r.get("source_record_id"),
                            "source_id": r.get("source", "APRD"),
                            "source_record_id": r.get("source_record_id"),
                            "organism": {
                                "canonical_name": r.get("canonical_organism", {}).get("canonical_name") or r.get("scientific_name"),
                                "order": r.get("canonical_organism", {}).get("order") or "Unknown",
                                "family": r.get("canonical_organism", {}).get("family") or "Unknown",
                                "ncbi_taxid": r.get("canonical_organism", {}).get("ncbi_taxid"),
                            },
                            "pesticide": {
                                "active_ingredient": r.get("canonical_pesticide", {}).get("active_ingredient") or r.get("active_ingredient"),
                                "irac_moa_group": r.get("canonical_pesticide", {}).get("irac_moa_group") or r.get("mode_of_action"),
                                "cas_number": r.get("canonical_pesticide", {}).get("cas_number"),
                                "chemical_class": r.get("canonical_pesticide", {}).get("chemical_class"),
                            },
                            "resistance_year": int(r.get("resistance_year", 2000)),
                            "country": r.get("country", "Unknown"),
                            "bioassay_method": r.get("bioassay_method", "Topical"),
                            "resistance_ratio": float(r.get("resistance_ratio", 1.0)),
                            "susceptible_baseline": float(r.get("susceptible_baseline", 0.1)),
                        })
        return records

    @classmethod
    def load_canonical_records(cls, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        # First attempt loading from database if session provided
        if db is not None:
            try:
                cases = (
                    db.query(ResistanceCase)
                    .join(CanonicalOrganism, ResistanceCase.organism_id == CanonicalOrganism.id)
                    .join(CanonicalPesticide, ResistanceCase.pesticide_id == CanonicalPesticide.id)
                    .all()
                )
                if len(cases) >= 10:
                    records = []
                    for c in cases:
                        records.append({
                            "case_id": c.id,
                            "source_id": c.source_id,
                            "source_record_id": c.source_record_id,
                            "organism": {
                                "canonical_name": c.organism.canonical_name,
                                "order": c.organism.order,
                                "family": c.organism.family,
                                "ncbi_taxid": c.organism.ncbi_taxid,
                            },
                            "pesticide": {
                                "active_ingredient": c.pesticide.active_ingredient,
                                "irac_moa_group": c.pesticide.irac_moa_group,
                                "cas_number": c.pesticide.cas_number,
                                "chemical_class": c.pesticide.chemical_class,
                            },
                            "resistance_year": c.resistance_year,
                            "country": c.country,
                            "bioassay_method": c.bioassay_method,
                            "resistance_ratio": c.resistance_ratio,
                            "susceptible_baseline": c.susceptible_baseline,
                        })
                    return records
            except Exception:
                pass

        # Fall back to canonical processed dataset
        return cls.load_from_jsonl()

    @classmethod
    def temporal_split(
        cls,
        records: List[Dict[str, Any]],
        train_year_cutoff: int = 2000,
        val_year_cutoff: int = 2010,
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        train_records = []
        val_records = []
        test_records = []

        for r in records:
            year = r.get("resistance_year", 2000)
            if year <= train_year_cutoff:
                train_records.append(r)
            elif year <= val_year_cutoff:
                val_records.append(r)
            else:
                test_records.append(r)

        return train_records, val_records, test_records
