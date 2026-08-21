"""
ResistanceIQ — APRD (Arthropod Pesticide Resistance Database) Parser
"""

import csv
import json
import io
from typing import List, Dict, Any, Optional


class APRDRecord:
    def __init__(self, raw: Dict[str, Any]):
        self.raw = raw
        self.source_record_id = str(raw.get("record_id") or raw.get("id") or raw.get("Record ID") or "").strip()
        self.genus = str(raw.get("genus") or raw.get("Genus") or "").strip()
        self.species = str(raw.get("species") or raw.get("Species") or "").strip()
        self.common_name = str(raw.get("common_name") or raw.get("Common Name") or "").strip()
        self.active_ingredient = str(raw.get("active_ingredient") or raw.get("Compound") or raw.get("Pesticide") or "").strip()
        self.mode_of_action = str(raw.get("mode_of_action") or raw.get("MoA") or raw.get("Class") or "").strip()
        self.country = str(raw.get("country") or raw.get("Country") or "").strip()
        self.location = str(raw.get("location") or raw.get("State") or raw.get("Location") or "").strip()
        self.resistance_year = self._parse_int(raw.get("resistance_year") or raw.get("First Reported") or raw.get("Year"))
        self.publication_year = self._parse_int(raw.get("publication_year") or raw.get("Pub Year") or raw.get("Reference Year"))
        self.resistance_type = str(raw.get("resistance_type") or raw.get("Type") or "Field Documented Resistance").strip()
        self.reference = str(raw.get("reference") or raw.get("Reference") or raw.get("Citation") or "").strip()
        self.bioassay_method = str(raw.get("bioassay_method") or raw.get("Method") or "").strip()
        self.resistance_ratio = self._parse_float(raw.get("resistance_ratio") or raw.get("RR"))
        self.susceptible_baseline = self._parse_float(raw.get("susceptible_baseline") or raw.get("Baseline LC50"))

    def _parse_int(self, val: Any) -> Optional[int]:
        if val is None or val == "":
            return None
        try:
            return int(str(val).split(".")[0].strip())
        except (ValueError, TypeError):
            return None

    def _parse_float(self, val: Any) -> Optional[float]:
        if val is None or val == "":
            return None
        try:
            clean = str(val).replace(">", "").replace("<", "").replace("x", "").strip()
            return float(clean)
        except (ValueError, TypeError):
            return None

    @property
    def scientific_name(self) -> str:
        return f"{self.genus} {self.species}".strip()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source": "APRD",
            "source_record_id": self.source_record_id,
            "genus": self.genus,
            "species": self.species,
            "scientific_name": self.scientific_name,
            "common_name": self.common_name,
            "active_ingredient": self.active_ingredient,
            "mode_of_action": self.mode_of_action,
            "country": self.country,
            "location": self.location,
            "resistance_year": self.resistance_year,
            "publication_year": self.publication_year,
            "resistance_type": self.resistance_type,
            "reference": self.reference,
            "bioassay_method": self.bioassay_method,
            "resistance_ratio": self.resistance_ratio,
            "susceptible_baseline": self.susceptible_baseline,
            "raw_payload": json.dumps(self.raw),
        }


class APRDParser:
    """
    Parses structured APRD CSV, TSV, or JSON exports into standardized staging records.
    """

    @classmethod
    def parse_csv(cls, file_content: str) -> List[APRDRecord]:
        records: List[APRDRecord] = []
        reader = csv.DictReader(io.StringIO(file_content.strip()))
        for idx, row in enumerate(reader):
            if "record_id" not in row and "Record ID" not in row and "id" not in row:
                row["record_id"] = f"APRD-{idx+1:06d}"
            records.append(APRDRecord(row))
        return records

    @classmethod
    def parse_json(cls, json_content: str) -> List[APRDRecord]:
        data = json.loads(json_content)
        if isinstance(data, dict) and "records" in data:
            data = data["records"]
        return [APRDRecord(r) for r in data]
