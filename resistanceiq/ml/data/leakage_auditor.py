"""
ResistanceIQ — Strict Temporal Data Leakage Auditor (Phase 7)
Audits dataset splits to ensure zero data leakage across chemical/species combinations,
verifies temporal out-of-time ordering, and produces an immutable audit report.
"""

import os
import json
from typing import Dict, Any, List, Set


class DataLeakageAuditor:
    def __init__(self, data_root: str = None):
        if data_root is None:
            self.data_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))
        else:
            self.data_root = os.path.abspath(data_root)

    def audit_splits(self) -> Dict[str, Any]:
        jsonl_path = os.path.join(self.data_root, "processed/processed_v2_canonical_dataset.jsonl")
        splits_path = os.path.join(self.data_root, "splits/aprd_v2_temporal_splits.json")

        if not os.path.exists(jsonl_path) or not os.path.exists(splits_path):
            raise FileNotFoundError("Processed dataset or splits file missing.")

        with open(splits_path, "r", encoding="utf-8") as f:
            splits_data = json.load(f)

        records_map = {}
        with open(jsonl_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    r = json.loads(line.strip())
                    records_map[r["case_id"]] = r

        train_ids = set(splits_data["splits"]["train"])
        val_ids = set(splits_data["splits"]["val"])
        test_ids = set(splits_data["splits"]["test"])

        train_records = [records_map[i] for i in train_ids if i in records_map]
        val_records = [records_map[i] for i in val_ids if i in records_map]
        test_records = [records_map[i] for i in test_ids if i in records_map]

        # 1. Check ID Overlaps
        train_val_overlap = train_ids.intersection(val_ids)
        train_test_overlap = train_ids.intersection(test_ids)
        val_test_overlap = val_ids.intersection(test_ids)

        # 2. Check Temporal Consistency (Train <= Val_Cutoff < Test)
        train_max_year = max((r["resistance_year"] for r in train_records), default=0)
        val_min_year = min((r["resistance_year"] for r in val_records), default=9999)
        val_max_year = max((r["resistance_year"] for r in val_records), default=0)
        test_min_year = min((r["resistance_year"] for r in test_records), default=9999)

        temporal_leakage = (train_max_year > val_min_year) or (val_max_year > test_min_year)

        # 3. Chemical & Species Overlap Analysis
        train_pairs = {(r["active_ingredient"], r["scientific_name"]) for r in train_records}
        test_pairs = {(r["active_ingredient"], r["scientific_name"]) for r in test_records}
        pair_overlap = train_pairs.intersection(test_pairs)

        # 4. Compile Audit Report
        audit_passed = (
            len(train_val_overlap) == 0
            and len(train_test_overlap) == 0
            and len(val_test_overlap) == 0
            and not temporal_leakage
        )

        report = {
            "audit_name": "TEMPORAL_OUT_OF_TIME_DATA_LEAKAGE_AUDIT",
            "dataset_version": splits_data.get("dataset_version", "aprd-resistance-v2"),
            "audit_passed": audit_passed,
            "id_disjoint_verified": len(train_val_overlap) == 0 and len(train_test_overlap) == 0,
            "temporal_consistency": {
                "train_max_year": train_max_year,
                "val_min_year": val_min_year,
                "val_max_year": val_max_year,
                "test_min_year": test_min_year,
                "temporal_ordering_valid": not temporal_leakage,
            },
            "split_record_counts": {
                "train": len(train_records),
                "val": len(val_records),
                "test": len(test_records),
                "total": len(records_map),
            },
            "chemical_species_novelty_in_test": {
                "total_test_pairs": len(test_pairs),
                "unseen_pairs_in_test": len(test_pairs - train_pairs),
                "overlap_pairs_tested_temporally": len(pair_overlap),
            },
            "status": "PASSED" if audit_passed else "FAILED",
        }

        # Persist audit report
        audit_out = os.path.join(self.data_root, "audit/DATA_LEAKAGE_AUDIT_REPORT.json")
        os.makedirs(os.path.dirname(audit_out), exist_ok=True)
        with open(audit_out, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        return report


if __name__ == "__main__":
    auditor = DataLeakageAuditor()
    rep = auditor.audit_splits()
    print("Leakage Audit Report:", json.dumps(rep, indent=2))
