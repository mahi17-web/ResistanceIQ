"""
ResistanceIQ — Pesticide & Active Ingredient Normalizer
"""

from typing import Dict, Any, Optional

# Verified curated active ingredient and IRAC Mode of Action registry
PESTICIDE_REGISTRY: Dict[str, Dict[str, Any]] = {
    "imidacloprid": {
        "active_ingredient": "Imidacloprid",
        "cas_number": "138261-41-3",
        "irac_moa_group": "4A",
        "chemical_class": "Neonicotinoid",
    },
    "clothianidin": {
        "active_ingredient": "Clothianidin",
        "cas_number": "210880-92-5",
        "irac_moa_group": "4A",
        "chemical_class": "Neonicotinoid",
    },
    "thiamethoxam": {
        "active_ingredient": "Thiamethoxam",
        "cas_number": "153719-23-4",
        "irac_moa_group": "4A",
        "chemical_class": "Neonicotinoid",
    },
    "pirimicarb": {
        "active_ingredient": "Pirimicarb",
        "cas_number": "23103-98-2",
        "irac_moa_group": "1A",
        "chemical_class": "Carbamate",
    },
    "methomyl": {
        "active_ingredient": "Methomyl",
        "cas_number": "16752-77-5",
        "irac_moa_group": "1A",
        "chemical_class": "Carbamate",
    },
    "chlorpyrifos": {
        "active_ingredient": "Chlorpyrifos",
        "cas_number": "2921-88-2",
        "irac_moa_group": "1B",
        "chemical_class": "Organophosphate",
    },
    "diazinon": {
        "active_ingredient": "Diazinon",
        "cas_number": "333-41-5",
        "irac_moa_group": "1B",
        "chemical_class": "Organophosphate",
    },
    "abamectin": {
        "active_ingredient": "Abamectin",
        "cas_number": "71751-41-2",
        "irac_moa_group": "6",
        "chemical_class": "Avermectin / Macrocyclic Lactone",
    },
    "permethrin": {
        "active_ingredient": "Permethrin",
        "cas_number": "52645-53-1",
        "irac_moa_group": "3A",
        "chemical_class": "Pyrethroid",
    },
    "cypermethrin": {
        "active_ingredient": "Cypermethrin",
        "cas_number": "52315-07-8",
        "irac_moa_group": "3A",
        "chemical_class": "Pyrethroid",
    },
    "deltamethrin": {
        "active_ingredient": "Deltamethrin",
        "cas_number": "52918-63-5",
        "irac_moa_group": "3A",
        "chemical_class": "Pyrethroid",
    },
    "chlorantraniliprole": {
        "active_ingredient": "Chlorantraniliprole",
        "cas_number": "500008-45-7",
        "irac_moa_group": "28",
        "chemical_class": "Diamide",
    },
    "spiromesifen": {
        "active_ingredient": "Spiromesifen",
        "cas_number": "283594-90-1",
        "irac_moa_group": "23",
        "chemical_class": "Tetronic acid derivative",
    },
    "ddt": {
        "active_ingredient": "DDT",
        "cas_number": "50-29-3",
        "irac_moa_group": "3B",
        "chemical_class": "Organochlorine",
    },
}


class PesticideNormalizer:
    """
    Normalizes active ingredient names, assigns verified CAS numbers and IRAC MoA codes,
    while preserving original source naming.
    """

    @classmethod
    def normalize(cls, raw_active: str, raw_moa: str = "", raw_class: str = "") -> Dict[str, Any]:
        original_name = raw_active.strip()
        search_key = original_name.lower().strip()

        if search_key in PESTICIDE_REGISTRY:
            meta = dict(PESTICIDE_REGISTRY[search_key])
            meta["original_name"] = original_name
            return meta

        # Fallback to normalized title-case
        canonical_active = original_name.capitalize()
        return {
            "original_name": original_name,
            "active_ingredient": canonical_active,
            "cas_number": None,
            "irac_moa_group": raw_moa.strip() or None,
            "chemical_class": raw_class.strip() or None,
        }
