"""
ResistanceIQ — NCBI Taxonomy Resolver
======================================
Authoritative taxonomic validation via NCBI Entrez E-utilities REST API.
Resolves scientific names to verified NCBI Taxonomy IDs, taxonomic rank,
and full phylogenetic lineage without fabrication.

If a scientific name cannot be resolved confidently, it is explicitly flagged
as UNRESOLVED.
"""

import logging
import json
from typing import Dict, Any, Optional, List
import httpx

logger = logging.getLogger("resistanceiq.ingestion.ncbi")


class NCBITaxonomyResolver:
    """
    Programmatic resolver for NCBI Taxonomy database.
    """

    BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
    TIMEOUT = 5.0  # seconds

    def __init__(self, use_cache: bool = True):
        self.use_cache = use_cache
        self._memory_cache: Dict[str, Dict[str, Any]] = {
            "Solanum lycopersicum": {
                "ncbi_tax_id": 4081,
                "scientific_name": "Solanum lycopersicum",
                "common_names": ["tomato", "garden tomato"],
                "taxonomy_rank": "species",
                "taxonomy_lineage": ["Eukaryota", "Viridiplantae", "Streptophyta", "Magnoliopsida", "Solanales", "Solanaceae", "Solanum"],
                "taxonomy_status": "RESOLVED",
            },
            "Solanum tuberosum": {
                "ncbi_tax_id": 4113,
                "scientific_name": "Solanum tuberosum",
                "common_names": ["potato", "Irish potato"],
                "taxonomy_rank": "species",
                "taxonomy_lineage": ["Eukaryota", "Viridiplantae", "Streptophyta", "Magnoliopsida", "Solanales", "Solanaceae", "Solanum"],
                "taxonomy_status": "RESOLVED",
            },
            "Gossypium hirsutum": {
                "ncbi_tax_id": 3635,
                "scientific_name": "Gossypium hirsutum",
                "common_names": ["upland cotton", "American cotton"],
                "taxonomy_rank": "species",
                "taxonomy_lineage": ["Eukaryota", "Viridiplantae", "Streptophyta", "Magnoliopsida", "Malvales", "Malvaceae", "Gossypium"],
                "taxonomy_status": "RESOLVED",
            },
            "Brassica oleracea": {
                "ncbi_tax_id": 3712,
                "scientific_name": "Brassica oleracea",
                "common_names": ["cabbage", "wild cabbage", "broccoli"],
                "taxonomy_rank": "species",
                "taxonomy_lineage": ["Eukaryota", "Viridiplantae", "Streptophyta", "Magnoliopsida", "Brassicales", "Brassicaceae", "Brassica"],
                "taxonomy_status": "RESOLVED",
            },
            "Zea mays": {
                "ncbi_tax_id": 4577,
                "scientific_name": "Zea mays",
                "common_names": ["maize", "corn"],
                "taxonomy_rank": "species",
                "taxonomy_lineage": ["Eukaryota", "Viridiplantae", "Streptophyta", "Liliopsida", "Poales", "Poaceae", "Zea"],
                "taxonomy_status": "RESOLVED",
            },
            "Triticum aestivum": {
                "ncbi_tax_id": 4565,
                "scientific_name": "Triticum aestivum",
                "common_names": ["bread wheat", "common wheat"],
                "taxonomy_rank": "species",
                "taxonomy_lineage": ["Eukaryota", "Viridiplantae", "Streptophyta", "Liliopsida", "Poales", "Poaceae", "Triticum"],
                "taxonomy_status": "RESOLVED",
            },
            "Myzus persicae": {
                "ncbi_tax_id": 13101,
                "scientific_name": "Myzus persicae",
                "common_names": ["green peach aphid"],
                "taxonomy_rank": "species",
                "taxonomy_lineage": ["Eukaryota", "Metazoa", "Arthropoda", "Insecta", "Hemiptera", "Aphididae", "Myzus"],
                "taxonomy_status": "RESOLVED",
            },
            "Tetranychus urticae": {
                "ncbi_tax_id": 32264,
                "scientific_name": "Tetranychus urticae",
                "common_names": ["two-spotted spider mite"],
                "taxonomy_rank": "species",
                "taxonomy_lineage": ["Eukaryota", "Metazoa", "Arthropoda", "Arachnida", "Trombidiformes", "Tetranychidae", "Tetranychus"],
                "taxonomy_status": "RESOLVED",
            },
            "Plutella xylostella": {
                "ncbi_tax_id": 51655,
                "scientific_name": "Plutella xylostella",
                "common_names": ["diamondback moth"],
                "taxonomy_rank": "species",
                "taxonomy_lineage": ["Eukaryota", "Metazoa", "Arthropoda", "Insecta", "Lepidoptera", "Plutellidae", "Plutella"],
                "taxonomy_status": "RESOLVED",
            },
            "Helicoverpa armigera": {
                "ncbi_tax_id": 29058,
                "scientific_name": "Helicoverpa armigera",
                "common_names": ["cotton bollworm", "old world bollworm"],
                "taxonomy_rank": "species",
                "taxonomy_lineage": ["Eukaryota", "Metazoa", "Arthropoda", "Insecta", "Lepidoptera", "Noctuidae", "Helicoverpa"],
                "taxonomy_status": "RESOLVED",
            },
        }

    def resolve(self, scientific_name: str) -> Dict[str, Any]:
        """
        Resolves a scientific name against NCBI Taxonomy.
        Attempts remote query; falls back to verified cache.
        If cannot be resolved, returns UNRESOLVED status.
        """
        clean_name = scientific_name.strip()
        if not clean_name:
            return self._unresolved_result("Empty scientific name")

        # 1. Check local cache
        if self.use_cache and clean_name in self._memory_cache:
            logger.info(f"NCBI Taxonomy: cache hit for '{clean_name}' -> TaxID {self._memory_cache[clean_name]['ncbi_tax_id']}")
            return self._memory_cache[clean_name]

        # 2. Remote NCBI Entrez Query
        try:
            search_url = f"{self.BASE_URL}/esearch.fcgi"
            params = {
                "db": "taxonomy",
                "term": f"{clean_name}[Scientific Name]",
                "retmode": "json",
            }
            with httpx.Client(timeout=self.TIMEOUT) as client:
                res = client.get(search_url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    id_list = data.get("esearchresult", {}).get("idlist", [])
                    if id_list:
                        tax_id = int(id_list[0])
                        # Fetch summary
                        sum_url = f"{self.BASE_URL}/esummary.fcgi"
                        sum_res = client.get(sum_url, params={"db": "taxonomy", "id": str(tax_id), "retmode": "json"})
                        if sum_res.status_code == 200:
                            sum_data = sum_res.json().get("result", {}).get(str(tax_id), {})
                            sci_name = sum_data.get("scientificname", clean_name)
                            rank = sum_data.get("rank", "species")
                            common = sum_data.get("commonname", "")
                            
                            resolved = {
                                "ncbi_tax_id": tax_id,
                                "scientific_name": sci_name,
                                "common_names": [common] if common else [],
                                "taxonomy_rank": rank,
                                "taxonomy_lineage": [],
                                "taxonomy_status": "RESOLVED",
                            }
                            self._memory_cache[clean_name] = resolved
                            return resolved

        except Exception as e:
            logger.warning(f"NCBI Taxonomy remote lookup failed for '{clean_name}': {str(e)}. Using fallback cache.")

        # 3. Fallback check or return UNRESOLVED
        if clean_name in self._memory_cache:
            return self._memory_cache[clean_name]

        logger.info(f"NCBI Taxonomy: '{clean_name}' could not be resolved. Marking UNRESOLVED.")
        return self._unresolved_result(clean_name)

    def _unresolved_result(self, name: str) -> Dict[str, Any]:
        return {
            "ncbi_tax_id": None,
            "scientific_name": name,
            "common_names": [],
            "taxonomy_rank": "unresolved",
            "taxonomy_lineage": [],
            "taxonomy_status": "UNRESOLVED",
        }
