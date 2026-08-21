"""
ResistanceIQ — IRAC (Insecticide Resistance Action Committee) MoA Parser
"""

import json
from typing import List, Dict, Any


class IRACMoARecord:
    def __init__(self, raw: Dict[str, Any]):
        self.raw = raw
        self.irac_group = str(raw.get("group") or raw.get("irac_group") or raw.get("Main Group") or "").strip()
        self.subgroup = str(raw.get("subgroup") or raw.get("Sub-group") or "").strip()
        self.primary_target = str(raw.get("target_site") or raw.get("Primary Target Site") or "").strip()
        self.chemical_subgroup = str(raw.get("chemical_class") or raw.get("Chemical Sub-group") or "").strip()
        self.active_ingredients = raw.get("actives") or raw.get("Active Ingredients") or []
        if isinstance(self.active_ingredients, str):
            self.active_ingredients = [a.strip() for a in self.active_ingredients.split(",") if a.strip()]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source": "IRAC",
            "irac_group": self.irac_group,
            "subgroup": self.subgroup,
            "primary_target": self.primary_target,
            "chemical_subgroup": self.chemical_subgroup,
            "active_ingredients": self.active_ingredients,
            "raw_payload": json.dumps(self.raw),
        }


class IRACParser:
    """
    Parses structured IRAC Mode of Action Classification catalogs.
    """

    @classmethod
    def parse_json(cls, json_content: str) -> List[IRACMoARecord]:
        data = json.loads(json_content)
        if isinstance(data, dict) and "moa_groups" in data:
            data = data["moa_groups"]
        return [IRACMoARecord(r) for r in data]
