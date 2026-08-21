"""
ResistanceIQ — Taxonomy Normalizer & Entity Resolution
"""

from typing import Dict, Any, Optional

# Verified curated taxonomy registry for key agricultural pests
TAXONOMY_REGISTRY: Dict[str, Dict[str, Any]] = {
    "myzus persicae": {
        "canonical_name": "Myzus persicae",
        "scientific_name": "Myzus persicae",
        "common_name": "Green Peach Aphid",
        "genus": "Myzus",
        "species": "persicae",
        "family": "Aphididae",
        "order": "Hemiptera",
        "ncbi_taxid": 7070,
    },
    "green peach aphid": {
        "canonical_name": "Myzus persicae",
        "scientific_name": "Myzus persicae",
        "common_name": "Green Peach Aphid",
        "genus": "Myzus",
        "species": "persicae",
        "family": "Aphididae",
        "order": "Hemiptera",
        "ncbi_taxid": 7070,
    },
    "plutella xylostella": {
        "canonical_name": "Plutella xylostella",
        "scientific_name": "Plutella xylostella",
        "common_name": "Diamondback Moth",
        "genus": "Plutella",
        "species": "xylostella",
        "family": "Plutellidae",
        "order": "Lepidoptera",
        "ncbi_taxid": 51655,
    },
    "diamondback moth": {
        "canonical_name": "Plutella xylostella",
        "scientific_name": "Plutella xylostella",
        "common_name": "Diamondback Moth",
        "genus": "Plutella",
        "species": "xylostella",
        "family": "Plutellidae",
        "order": "Lepidoptera",
        "ncbi_taxid": 51655,
    },
    "tetranychus urticae": {
        "canonical_name": "Tetranychus urticae",
        "scientific_name": "Tetranychus urticae",
        "common_name": "Two-Spotted Spider Mite",
        "genus": "Tetranychus",
        "species": "urticae",
        "family": "Tetranychidae",
        "order": "Trombidiformes",
        "ncbi_taxid": 32264,
    },
    "two-spotted spider mite": {
        "canonical_name": "Tetranychus urticae",
        "scientific_name": "Tetranychus urticae",
        "common_name": "Two-Spotted Spider Mite",
        "genus": "Tetranychus",
        "species": "urticae",
        "family": "Tetranychidae",
        "order": "Trombidiformes",
        "ncbi_taxid": 32264,
    },
    "helicoverpa armigera": {
        "canonical_name": "Helicoverpa armigera",
        "scientific_name": "Helicoverpa armigera",
        "common_name": "Cotton Bollworm",
        "genus": "Helicoverpa",
        "species": "armigera",
        "family": "Noctuidae",
        "order": "Lepidoptera",
        "ncbi_taxid": 29058,
    },
    "cotton bollworm": {
        "canonical_name": "Helicoverpa armigera",
        "scientific_name": "Helicoverpa armigera",
        "common_name": "Cotton Bollworm",
        "genus": "Helicoverpa",
        "species": "armigera",
        "family": "Noctuidae",
        "order": "Lepidoptera",
        "ncbi_taxid": 29058,
    },
    "musca domestica": {
        "canonical_name": "Musca domestica",
        "scientific_name": "Musca domestica",
        "common_name": "House Fly",
        "genus": "Musca",
        "species": "domestica",
        "family": "Muscidae",
        "order": "Diptera",
        "ncbi_taxid": 7370,
    },
    "spodoptera frugiperda": {
        "canonical_name": "Spodoptera frugiperda",
        "scientific_name": "Spodoptera frugiperda",
        "common_name": "Fall Armyworm",
        "genus": "Spodoptera",
        "species": "frugiperda",
        "family": "Noctuidae",
        "order": "Lepidoptera",
        "ncbi_taxid": 7108,
    },
}


class TaxonomyNormalizer:
    """
    Resolves diverse organism names and synonyms into canonical NCBI taxonomy records,
    while strictly preserving the original source text.
    """

    @classmethod
    def normalize(cls, raw_scientific: str, raw_common: str = "", raw_genus: str = "", raw_species: str = "") -> Dict[str, Any]:
        original_name = raw_scientific.strip() or f"{raw_genus} {raw_species}".strip() or raw_common.strip()
        search_key = original_name.lower().strip()

        # Direct registry match
        if search_key in TAXONOMY_REGISTRY:
            meta = dict(TAXONOMY_REGISTRY[search_key])
            meta["original_name"] = original_name
            return meta

        # Fallback to structured parsing
        tokens = original_name.split()
        genus = raw_genus.strip() or (tokens[0].capitalize() if len(tokens) >= 1 else None)
        species = raw_species.strip() or (tokens[1].lower() if len(tokens) >= 2 else None)
        canonical_name = f"{genus} {species}".strip() if genus and species else original_name

        return {
            "original_name": original_name,
            "canonical_name": canonical_name,
            "scientific_name": canonical_name,
            "common_name": raw_common.strip() or None,
            "genus": genus,
            "species": species,
            "family": None,
            "order": None,
            "ncbi_taxid": None,
        }
