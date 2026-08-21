import json
import os
import sys
from typing import Dict, Any, List

sys.path.insert(0, os.path.abspath("resistanceiq/backend"))

DATA_PATH = os.path.abspath("resistanceiq/data/processed/processed_v2_canonical_dataset.jsonl")

def run_deduplication_and_profiling() -> Dict[str, Any]:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f if line.strip()]

    print(f"=== Loaded {len(records)} Bioassay Records for Deduplication Analysis ===")

    exact_duplicates = []
    likely_duplicates = []
    independent_observations = []
    unresolved_records = []

    seen_signatures = {}

    for idx, r in enumerate(records):
        case_id = r.get("case_id", f"REC-{idx}")
        source_id = r.get("source_record_id", "")
        compound = r.get("active_ingredient", "").lower().strip()
        species = r.get("scientific_name", "").lower().strip()
        year = r.get("resistance_year")
        country = r.get("country", "").lower().strip()
        rr = r.get("resistance_ratio")
        method = r.get("bioassay_method", "").lower().strip()
        smiles = r.get("canonical_pesticide", {}).get("smiles", "")
        taxid = r.get("canonical_organism", {}).get("ncbi_taxid")

        if not compound or not species or year is None or rr is None:
            unresolved_records.append({
                "case_id": case_id,
                "reason": "Missing required matching attributes (compound, species, year, or RR)",
                "record": r
            })
            continue

        # Signature 1: Exact Duplicate (Same source ID or exact same assay params)
        exact_sig = (source_id, compound, species, year, country, round(float(rr), 3), method)
        # Signature 2: Likely Duplicate (Same compound + species + year + country + RR without unique source ID)
        fuzzy_sig = (compound, species, year, country, round(float(rr), 2))

        if exact_sig in seen_signatures:
            prev_id = seen_signatures[exact_sig]
            exact_duplicates.append({
                "case_id": case_id,
                "duplicate_of": prev_id,
                "signature": exact_sig,
                "classification": "EXACT_DUPLICATE"
            })
        elif fuzzy_sig in seen_signatures:
            prev_id = seen_signatures[fuzzy_sig]
            likely_duplicates.append({
                "case_id": case_id,
                "matches": prev_id,
                "signature": fuzzy_sig,
                "classification": "LIKELY_DUPLICATE"
            })
        else:
            seen_signatures[exact_sig] = case_id
            seen_signatures[fuzzy_sig] = case_id
            independent_observations.append(case_id)

    # Profiling
    unique_compounds = set(r.get("active_ingredient") for r in records if r.get("active_ingredient"))
    unique_species = set(r.get("scientific_name") for r in records if r.get("scientific_name"))
    unique_sources = set(r.get("source_record_id") for r in records if r.get("source_record_id"))
    unique_orders = set(r.get("canonical_organism", {}).get("order") for r in records if r.get("canonical_organism", {}).get("order"))
    unique_moas = set(r.get("canonical_pesticide", {}).get("irac_moa_group") for r in records if r.get("canonical_pesticide", {}).get("irac_moa_group"))
    
    years = [r.get("resistance_year") for r in records if r.get("resistance_year")]
    rrs = [r.get("resistance_ratio") for r in records if r.get("resistance_ratio")]

    profile = {
        "total_dataset_size": len(records),
        "independent_observations_count": len(independent_observations),
        "exact_duplicates_count": len(exact_duplicates),
        "likely_duplicates_count": len(likely_duplicates),
        "unresolved_records_count": len(unresolved_records),
        "unique_compounds_count": len(unique_compounds),
        "unique_species_count": len(unique_species),
        "unique_source_records_count": len(unique_sources),
        "unique_taxonomic_orders": sorted(list(unique_orders)),
        "unique_moa_groups": sorted(list(unique_moas)),
        "year_min": min(years) if years else None,
        "year_max": max(years) if years else None,
        "rr_min": min(rrs) if rrs else None,
        "rr_max": max(rrs) if rrs else None,
    }

    print("\n=== Bioassay Deduplication & Profiling Summary ===")
    print(f"  * Total Canonical Dataset Records:   {profile['total_dataset_size']}")
    print(f"  * Independent Unique Observations:   {profile['independent_observations_count']}")
    print(f"  * Exact Duplicates Detected:         {profile['exact_duplicates_count']}")
    print(f"  * Likely Duplicates Detected:        {profile['likely_duplicates_count']}")
    print(f"  * Unresolved Records (Quarantined):  {profile['unresolved_records_count']}")
    print(f"  * Unique Active Ingredients:         {profile['unique_compounds_count']}")
    print(f"  * Unique Species:                    {profile['unique_species_count']}")
    print(f"  * Unique Source Study Records:       {profile['unique_source_records_count']}")
    print(f"  * Unique Taxonomic Orders:           {profile['unique_taxonomic_orders']}")
    print(f"  * Unique MoA Groups:                 {profile['unique_moa_groups']}")
    print(f"  * Temporal Span:                     {profile['year_min']} - {profile['year_max']}")
    print(f"  * Resistance Ratio (RR) Range:       {profile['rr_min']}x - {profile['rr_max']}x")

    return profile

if __name__ == "__main__":
    run_deduplication_and_profiling()
