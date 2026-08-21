"""
ResistanceIQ — ML Dataset Validation Architecture
"""

from typing import Dict, Any, List


class DatasetValidationError(Exception):
    pass


class ScientificDatasetValidator:
    """
    Validates scientific dataset integrity, schema compliance,
    and provenance records before passing to training or feature extraction.
    """

    REQUIRED_METADATA_FIELDS = [
        "dataset_name",
        "source_organization",
        "provenance_url",
        "version",
        "retrieved_at_utc",
        "license",
    ]

    @classmethod
    def validate_metadata(cls, metadata: Dict[str, Any]) -> bool:
        missing = [f for f in cls.REQUIRED_METADATA_FIELDS if f not in metadata]
        if missing:
            raise DatasetValidationError(
                f"Dataset metadata missing mandatory provenance fields: {missing}"
            )
        return True

    @classmethod
    def validate_chemical_records(cls, records: List[Dict[str, Any]]) -> Dict[str, int]:
        valid_count = 0
        invalid_count = 0
        for r in records:
            smiles = r.get("smiles", "").strip()
            if smiles and len(smiles) >= 3:
                valid_count += 1
            else:
                invalid_count += 1
        return {"valid_records": valid_count, "invalid_records": invalid_count}
