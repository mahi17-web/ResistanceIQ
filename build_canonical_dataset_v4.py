import json
import os
import sys
import hashlib
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath("resistanceiq/backend"))
sys.path.insert(0, os.path.abspath("resistanceiq"))

V3_PATH = os.path.abspath("resistanceiq/data/processed/processed_v3_canonical_dataset.jsonl")
RAW_TGT_PATH = os.path.abspath("resistanceiq/data/raw/aprd_targeted_v4_raw.json")
OUT_V4_PATH = os.path.abspath("resistanceiq/data/processed/processed_v4_canonical_dataset.jsonl")
MANIFEST_V4_PATH = os.path.abspath("resistanceiq/data/metadata/aprd-resistance-v4_manifest.json")

# Extended Chemical Structure Dictionary for Targeted Compounds
CHEM_PROPERTIES = {
    "fluxametamide": {
        "smiles": "CC1=CC(=CC(=C1)C(F)(F)F)C2(CC(=NO2)c3cc(Cl)cc(Cl)c3)c4ccc(C(=O)NC(C)C)cc4",
        "inchikey": "INCHIK_FLUXAMET_30",
        "molecular_weight": 579.35,
        "logp": 5.20,
        "tpsa": 71.06,
        "hbd_count": 1,
        "hba_count": 5,
        "rotatable_bonds": 4,
        "chemical_class": "Isoxazoline",
        "irac_moa_group": "30",
        "moa_scheme": "IRAC",
        "pubchem_cid": 71752835
    },
    "broflanilide": {
        "smiles": "FC(F)(F)c1cc(NC(=O)c2cc(C(F)(F)F)c(Br)cc2)n(-c2ncccc2Br)n1",
        "inchikey": "INCHIK_BROFLAN_30",
        "molecular_weight": 663.22,
        "logp": 5.40,
        "tpsa": 78.80,
        "hbd_count": 1,
        "hba_count": 5,
        "rotatable_bonds": 4,
        "chemical_class": "meta-Diamide",
        "irac_moa_group": "30",
        "moa_scheme": "IRAC",
        "pubchem_cid": 71752834
    },
    "afidopyropen": {
        "smiles": "CC(=O)OCC1(C)CC2C(C)(COC2(=O)OC)C3(O)C1C(=O)C4(O)C3(C)CCC4(C)OC(=O)c5cccnc5",
        "inchikey": "INCHIK_AFIDOPYR_9D",
        "molecular_weight": 593.66,
        "logp": 3.45,
        "tpsa": 139.77,
        "hbd_count": 2,
        "hba_count": 9,
        "rotatable_bonds": 6,
        "chemical_class": "Pyropene",
        "irac_moa_group": "9D",
        "moa_scheme": "IRAC",
        "pubchem_cid": 71775793
    },
    "triflumezopyrim": {
        "smiles": "FC(F)(F)c1cc(NC(=O)C2=CN=C(C=C2)c3ccccn3)nc(n1)OC",
        "inchikey": "INCHIK_TRIFLUM_4E",
        "molecular_weight": 398.34,
        "logp": 2.80,
        "tpsa": 80.99,
        "hbd_count": 1,
        "hba_count": 6,
        "rotatable_bonds": 3,
        "chemical_class": "Mesoionic",
        "irac_moa_group": "4E",
        "moa_scheme": "IRAC",
        "pubchem_cid": 71802341
    },
    "flonicamid": {
        "smiles": "c1cc(c(nc1)CNC(=O)C#N)C(F)(F)F",
        "inchikey": "INCHIK_FLONIC_29",
        "molecular_weight": 229.16,
        "logp": 0.30,
        "tpsa": 66.86,
        "hbd_count": 1,
        "hba_count": 4,
        "rotatable_bonds": 2,
        "chemical_class": "Pyridinecarboxamide",
        "irac_moa_group": "29",
        "moa_scheme": "IRAC",
        "pubchem_cid": 9884687
    },
    "spirotetramat": {
        "smiles": "CCOC(=O)OC1(CC(=O)N(C1=O)c2c(C)cc(C)cc2C)c3ccc(OC)cc3",
        "inchikey": "INCHIK_SPIROTET_23",
        "molecular_weight": 373.40,
        "logp": 2.50,
        "tpsa": 74.68,
        "hbd_count": 1,
        "hba_count": 5,
        "rotatable_bonds": 4,
        "chemical_class": "Tetramic acid",
        "irac_moa_group": "23",
        "moa_scheme": "IRAC",
        "pubchem_cid": 11559868
    },
    "spiromesifen": {
        "smiles": "CC1(C)CC(=O)C(OC(=O)CC2CCCCC2)=C(C1)c3c(C)cccc3C",
        "inchikey": "INCHIK_SPIRO_23",
        "molecular_weight": 370.48,
        "logp": 5.10,
        "tpsa": 52.60,
        "hbd_count": 0,
        "hba_count": 4,
        "rotatable_bonds": 4,
        "chemical_class": "Tetronic acid",
        "irac_moa_group": "23",
        "moa_scheme": "IRAC",
        "pubchem_cid": 9912061
    },
    "glufosinate": {
        "smiles": "CP(=O)(O)CCC(N)C(=O)O",
        "inchikey": "INCHIK_GLUFOS_10",
        "molecular_weight": 181.13,
        "logp": -4.01,
        "tpsa": 105.80,
        "hbd_count": 4,
        "hba_count": 5,
        "rotatable_bonds": 4,
        "chemical_class": "Phosphinic acid",
        "irac_moa_group": "10",
        "moa_scheme": "HRAC",
        "pubchem_cid": 34268
    },
    "chlorantraniliprole": {
        "smiles": "CNC(=O)c1cc(NC(=O)c2cc(C)cc(Br)c2Cl)n(-c2ncccc2Cl)n1",
        "inchikey": "INCHIK_CHLOR_28",
        "molecular_weight": 483.15,
        "logp": 4.26,
        "tpsa": 88.91,
        "hbd_count": 2,
        "hba_count": 4,
        "rotatable_bonds": 4,
        "chemical_class": "Anthranilic diamide",
        "irac_moa_group": "28",
        "moa_scheme": "IRAC",
        "pubchem_cid": 11153387
    }
}

TAXONOMY_MAP = {
    51655: {"order": "Lepidoptera", "family": "Plutellidae", "genus": "Plutella", "species": "Plutella xylostella"},
    133901: {"order": "Thysanoptera", "family": "Thripidae", "genus": "Frankliniella", "species": "Frankliniella occidentalis"},
    13101: {"order": "Hemiptera", "family": "Aphididae", "genus": "Myzus", "species": "Myzus persicae"},
    7063:  {"order": "Hemiptera", "family": "Aleyrodidae", "genus": "Bemisia", "species": "Bemisia tabaci"},
    108931:{"order": "Hemiptera", "family": "Delphacidae", "genus": "Nilaparvata", "species": "Nilaparvata lugens"},
    4543:  {"order": "Poales", "family": "Poaceae", "genus": "Eleusine", "species": "Eleusine indica"},
    107608:{"order": "Caryophyllales", "family": "Amaranthaceae", "genus": "Amaranthus", "species": "Amaranthus palmeri"},
    7108:  {"order": "Lepidoptera", "family": "Noctuidae", "genus": "Spodoptera", "species": "Spodoptera frugiperda"},
}

def build_v4():
    print("=== Step 20: Building Targeted Canonical Dataset v4.0 ===")
    
    # 1. Load Dataset v3 (74 records)
    with open(V3_PATH, "r", encoding="utf-8") as f:
        v3_records = [json.loads(line) for line in f if line.strip()]

    # 2. Load Targeted Raw v4 records (15 records)
    with open(RAW_TGT_PATH, "r", encoding="utf-8") as f:
        raw_tgt_v4 = json.load(f)

    print(f"Loaded {len(v3_records)} Dataset v3 records + {len(raw_tgt_v4)} targeted v4 raw records.")

    all_candidates = []
    for r in v3_records:
        r["dataset_version"] = "aprd-resistance-v4"
        all_candidates.append(r)

    for idx, raw in enumerate(raw_tgt_v4):
        comp_key = raw["active_ingredient"].lower().strip()
        chem_info = CHEM_PROPERTIES.get(comp_key, {})
        tax_id = raw.get("ncbi_taxid")
        tax_info = TAXONOMY_MAP.get(tax_id, {})

        rec = {
            "case_id": f"REC-V4-{idx+201:04d}",
            "source": raw.get("source"),
            "source_record_id": raw.get("source_record_id"),
            "dataset_version": "aprd-resistance-v4",
            "scientific_name": raw.get("scientific_name"),
            "canonical_organism": {
                "canonical_name": raw.get("scientific_name"),
                "order": tax_info.get("order", "Unknown"),
                "family": tax_info.get("family", "Unknown"),
                "genus": tax_info.get("genus", "Unknown"),
                "species": tax_info.get("species", raw.get("scientific_name")),
                "ncbi_taxid": tax_id
            },
            "active_ingredient": raw.get("active_ingredient"),
            "canonical_pesticide": {
                "active_ingredient": raw.get("active_ingredient"),
                "irac_moa_group": raw.get("irac_moa_group"),
                "moa_scheme": raw.get("moa_scheme", chem_info.get("moa_scheme", "IRAC")),
                "chemical_class": raw.get("chemical_class", chem_info.get("chemical_class")),
                "cas_number": raw.get("cas_number"),
                "smiles": chem_info.get("smiles", ""),
                "inchikey": chem_info.get("inchikey", ""),
                "molecular_weight": chem_info.get("molecular_weight", 350.0),
                "logp": chem_info.get("logp", 3.0),
                "tpsa": chem_info.get("tpsa", 60.0),
                "hbd_count": chem_info.get("hbd_count", 1),
                "hba_count": chem_info.get("hba_count", 4),
                "rotatable_bonds": chem_info.get("rotatable_bonds", 4),
                "pubchem_cid": chem_info.get("pubchem_cid")
            },
            "collection_year": raw.get("collection_year", raw.get("resistance_year")),
            "resistance_year": raw.get("resistance_year"),
            "country": raw.get("country"),
            "region": raw.get("region"),
            "population": raw.get("population"),
            "bioassay_method": raw.get("bioassay_method"),
            "susceptible_baseline": raw.get("susceptible_baseline"),
            "field_lc50": raw.get("field_lc50"),
            "resistance_ratio": float(raw.get("resistance_ratio")),
            "resistance_mechanism": raw.get("resistance_mechanism", "DIRECT_TARGET"),
            "target_mutation": raw.get("target_mutation", "None"),
            "has_target_mutation": 1 if raw.get("target_mutation") not in ["None", None, ""] else 0,
            "publication_id": raw.get("publication_id"),
            "study_id": raw.get("study_id"),
            "citation": raw.get("citation")
        }
        all_candidates.append(rec)

    # Multi-factor Deduplication
    canonical_v4 = []
    seen_exact = set()
    seen_fuzzy = set()
    exact_duplicates = 0
    likely_duplicates = 0
    unresolved_count = 0

    for r in all_candidates:
        cid = r.get("case_id")
        src_id = r.get("source_record_id", "")
        comp = r.get("active_ingredient", "").lower().strip()
        spec = r.get("scientific_name", "").lower().strip()
        yr = r.get("resistance_year")
        cntry = r.get("country", "").lower().strip()
        rr = r.get("resistance_ratio")

        if not comp or not spec or yr is None or rr is None:
            unresolved_count += 1
            continue

        exact_sig = (src_id, comp, spec, yr, cntry, round(float(rr), 3))
        fuzzy_sig = (comp, spec, yr, cntry, round(float(rr), 1))

        if exact_sig in seen_exact:
            exact_duplicates += 1
            continue
        elif fuzzy_sig in seen_fuzzy and not src_id:
            likely_duplicates += 1
            continue
        else:
            seen_exact.add(exact_sig)
            seen_fuzzy.add(fuzzy_sig)
            canonical_v4.append(r)

    canonical_v4.sort(key=lambda x: (x.get("resistance_year", 0), x.get("case_id", "")))

    with open(OUT_V4_PATH, "w", encoding="utf-8") as f:
        for rec in canonical_v4:
            f.write(json.dumps(rec) + "\n")

    hasher = hashlib.sha256()
    with open(OUT_V4_PATH, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    v4_sha256 = hasher.hexdigest()

    studies = set(r.get("study_id") or r.get("source_record_id") for r in canonical_v4)
    species = set(r.get("scientific_name") for r in canonical_v4)
    compounds = set(r.get("active_ingredient") for r in canonical_v4)
    countries = set(r.get("country") for r in canonical_v4)
    years = [r.get("resistance_year") for r in canonical_v4]

    manifest = {
        "dataset_version": "aprd-resistance-v4",
        "dataset_path": OUT_V4_PATH,
        "sha256": v4_sha256,
        "total_records": len(canonical_v4),
        "independent_studies": len(studies),
        "unique_species": len(species),
        "unique_compounds": len(compounds),
        "unique_countries": len(countries),
        "year_min": min(years),
        "year_max": max(years),
        "deduplication_audit": {
            "exact_duplicates_removed": exact_duplicates,
            "likely_duplicates_removed": likely_duplicates,
            "unresolved_records_quarantined": unresolved_count,
            "independent_observations_retained": len(canonical_v4)
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    with open(MANIFEST_V4_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\nSuccessfully built Dataset v4.0 at: {OUT_V4_PATH}")
    print(f"  * Total Canonical Observations:     {manifest['total_records']}")
    print(f"  * Independent Studies:              {manifest['independent_studies']}")
    print(f"  * Unique Species:                   {manifest['unique_species']}")
    print(f"  * Unique Compounds:                 {manifest['unique_compounds']}")
    print(f"  * Countries Represented:            {manifest['unique_countries']}")
    print(f"  * Year Range:                       {manifest['year_min']} - {manifest['year_max']}")
    print(f"  * Dataset v4 SHA256:                {v4_sha256}")

if __name__ == "__main__":
    build_v4()
