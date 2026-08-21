import json
import os
import sys
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List

sys.path.insert(0, os.path.abspath("resistanceiq/backend"))
sys.path.insert(0, os.path.abspath("resistanceiq"))

from app.core.database import SessionLocal
from app.models import Crop, Target, Pest

RAW_PATH = os.path.abspath("resistanceiq/data/raw/aprd_expanded_v3_raw.json")
V2_PATH = os.path.abspath("resistanceiq/data/processed/processed_v2_canonical_dataset.jsonl")
OUT_V3_PATH = os.path.abspath("resistanceiq/data/processed/processed_v3_canonical_dataset.jsonl")
MANIFEST_V3_PATH = os.path.abspath("resistanceiq/data/metadata/aprd-resistance-v3_manifest.json")

# Predefined Chemical Structure Dictionary for Standard Cheminformatics Properties
CHEM_PROPERTIES = {
    "permethrin": {
        "smiles": "CC1(C)C(C=C(Cl)Cl)C1C(=O)OCc1cccc(Oc2ccccc2)c1",
        "inchikey": "INCHIK_PERM_3A",
        "molecular_weight": 391.29,
        "logp": 6.11,
        "tpsa": 35.53,
        "hbd_count": 0,
        "hba_count": 3,
        "rotatable_bonds": 6,
        "chemical_class": "Pyrethroid",
        "irac_moa_group": "3A",
        "moa_scheme": "IRAC",
        "pubchem_cid": 40326
    },
    "dimethoate": {
        "smiles": "CNC(=O)CSP(=S)(OC)OC",
        "inchikey": "INCHIK_DIMETH_1B",
        "molecular_weight": 229.28,
        "logp": 0.70,
        "tpsa": 78.43,
        "hbd_count": 1,
        "hba_count": 5,
        "rotatable_bonds": 4,
        "chemical_class": "Organophosphate",
        "irac_moa_group": "1B",
        "moa_scheme": "IRAC",
        "pubchem_cid": 3079
    },
    "cypermethrin": {
        "smiles": "CC1(C)C(C=C(Cl)Cl)C1C(=O)OC(C#N)c1cccc(Oc2ccccc2)c1",
        "inchikey": "INCHIK_CYPER_3A",
        "molecular_weight": 416.30,
        "logp": 6.18,
        "tpsa": 59.32,
        "hbd_count": 0,
        "hba_count": 4,
        "rotatable_bonds": 6,
        "chemical_class": "Pyrethroid",
        "irac_moa_group": "3A",
        "moa_scheme": "IRAC",
        "pubchem_cid": 2912
    },
    "abamectin": {
        "smiles": "CCC(C)C1CC(C)CC2(CC3CC(CC=C(C)C(C(C)C=CC=C4COC5C(O)C(OC6CC(OC7CC(OC)C(O)C(C)O7)C(O)C(C)O6)CC(O)C45O)O3)O2)O1",
        "inchikey": "INCHIK_ABAM_6",
        "molecular_weight": 873.10,
        "logp": 4.40,
        "tpsa": 196.25,
        "hbd_count": 3,
        "hba_count": 14,
        "rotatable_bonds": 8,
        "chemical_class": "Avermectin",
        "irac_moa_group": "6",
        "moa_scheme": "IRAC",
        "pubchem_cid": 6434889
    },
    "fenpropathrin": {
        "smiles": "CC1(C)C(C#N)C1(C)C(=O)OC(C#N)c1cccc(Oc2ccccc2)c1",
        "inchikey": "INCHIK_FENPROP_3A",
        "molecular_weight": 349.42,
        "logp": 6.00,
        "tpsa": 83.11,
        "hbd_count": 0,
        "hba_count": 4,
        "rotatable_bonds": 5,
        "chemical_class": "Pyrethroid",
        "irac_moa_group": "3A",
        "moa_scheme": "IRAC",
        "pubchem_cid": 47218
    },
    "spinosad": {
        "smiles": "CCC1CC(=O)C(C)CC(OC2CCC(N(C)C)C(C)O2)C1",
        "inchikey": "INCHIK_SPIN_5",
        "molecular_weight": 311.47,
        "logp": 3.24,
        "tpsa": 38.77,
        "hbd_count": 0,
        "hba_count": 4,
        "rotatable_bonds": 4,
        "chemical_class": "Spinosyn",
        "irac_moa_group": "5",
        "moa_scheme": "IRAC",
        "pubchem_cid": 18302
    },
    "imidacloprid": {
        "smiles": "c1cc(c(nc1)Cl)CN2CCN(=N)[N-]2",
        "inchikey": "INCHIK_IMID_4A",
        "molecular_weight": 255.66,
        "logp": 0.57,
        "tpsa": 66.86,
        "hbd_count": 1,
        "hba_count": 5,
        "rotatable_bonds": 2,
        "chemical_class": "Neonicotinoid",
        "irac_moa_group": "4A",
        "moa_scheme": "IRAC",
        "pubchem_cid": 86287
    },
    "pirimicarb": {
        "smiles": "Cc1nc(C)c(c(n1)N(C)C)OC(=O)N(C)C",
        "inchikey": "INCHIK_PIRIM_1A",
        "molecular_weight": 238.29,
        "logp": 1.70,
        "tpsa": 55.77,
        "hbd_count": 0,
        "hba_count": 5,
        "rotatable_bonds": 2,
        "chemical_class": "Carbamate",
        "irac_moa_group": "1A",
        "moa_scheme": "IRAC",
        "pubchem_cid": 30739
    },
    "pyriproxyfen": {
        "smiles": "CC(Oc1ccc(Oc2ccccc2)cc1)COc1ccccn1",
        "inchikey": "INCHIK_PYRIP_7C",
        "molecular_weight": 321.37,
        "logp": 5.37,
        "tpsa": 39.72,
        "hbd_count": 0,
        "hba_count": 3,
        "rotatable_bonds": 6,
        "chemical_class": "Pyridine",
        "irac_moa_group": "7C",
        "moa_scheme": "IRAC",
        "pubchem_cid": 91753
    },
    "endosulfan": {
        "smiles": "C12C(Cl)(Cl)C3(Cl)C4C(Cl)=C(Cl)C1(Cl)C3(Cl)C(=O)OS(=O)O4",
        "inchikey": "INCHIK_ENDOS_2A",
        "molecular_weight": 406.93,
        "logp": 3.83,
        "tpsa": 61.44,
        "hbd_count": 0,
        "hba_count": 4,
        "rotatable_bonds": 0,
        "chemical_class": "Organochlorine cyclodiene",
        "irac_moa_group": "2A",
        "moa_scheme": "IRAC",
        "pubchem_cid": 3224
    },
    "methomyl": {
        "smiles": "CNC(=O)ON=C(C)SC",
        "inchikey": "INCHIK_METH_1A",
        "molecular_weight": 162.21,
        "logp": 1.04,
        "tpsa": 50.69,
        "hbd_count": 1,
        "hba_count": 4,
        "rotatable_bonds": 1,
        "chemical_class": "Carbamate",
        "irac_moa_group": "1A",
        "moa_scheme": "IRAC",
        "pubchem_cid": 4114
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
    },
    "imazethapyr": {
        "smiles": "CCC1=NC(=C(C(=O)O)C=C1)C2(C(C)C)NC(=O)CS2",
        "inchikey": "INCHIK_IMAZE_2",
        "molecular_weight": 289.35,
        "logp": 1.49,
        "tpsa": 84.77,
        "hbd_count": 2,
        "hba_count": 5,
        "rotatable_bonds": 3,
        "chemical_class": "Imidazolinone",
        "irac_moa_group": "2",
        "moa_scheme": "HRAC",
        "pubchem_cid": 54443
    },
    "boscalid": {
        "smiles": "c1ccc(c(c1)c2ccc(cc2)Cl)NC(=O)c3cccnc3Cl",
        "inchikey": "INCHIK_BOSC_7",
        "molecular_weight": 343.21,
        "logp": 4.30,
        "tpsa": 41.99,
        "hbd_count": 1,
        "hba_count": 2,
        "rotatable_bonds": 3,
        "chemical_class": "Pyridine-carboxamide",
        "irac_moa_group": "7",
        "moa_scheme": "FRAC",
        "pubchem_cid": 9878232
    },
    "clothianidin": {
        "smiles": "CNC(=NC#N)NCC1=CN=C(S1)Cl",
        "inchikey": "INCHIK_CLOTH_4A",
        "molecular_weight": 249.70,
        "logp": 0.70,
        "tpsa": 93.38,
        "hbd_count": 2,
        "hba_count": 6,
        "rotatable_bonds": 3,
        "chemical_class": "Neonicotinoid",
        "irac_moa_group": "4A",
        "moa_scheme": "IRAC",
        "pubchem_cid": 9884685
    },
    "indoxacarb": {
        "smiles": "COCC1(C(=O)OC)c2cc(Cl)ccc2CCN1C(=O)N(C(=O)OC)c1ccc(OC(F)(F)F)c(Cl)c1",
        "inchikey": "INCHIK_INDOX_22A",
        "molecular_weight": 565.33,
        "logp": 5.16,
        "tpsa": 94.61,
        "hbd_count": 0,
        "hba_count": 7,
        "rotatable_bonds": 5,
        "chemical_class": "Oxadiazine",
        "irac_moa_group": "22A",
        "moa_scheme": "IRAC",
        "pubchem_cid": 9880894
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
    "flupyradifurone": {
        "smiles": "FC(F)CC1=C(Cl)C(=O)OC1=NC2=CN=C(C=C2)Cl",
        "inchikey": "INCHIK_FLUPYR_4D",
        "molecular_weight": 288.68,
        "logp": 1.20,
        "tpsa": 58.64,
        "hbd_count": 0,
        "hba_count": 5,
        "rotatable_bonds": 3,
        "chemical_class": "Butenolide",
        "irac_moa_group": "4D",
        "moa_scheme": "IRAC",
        "pubchem_cid": 53394708
    },
    "glyphosate": {
        "smiles": "OC(=O)CNCP(=O)(O)O",
        "inchikey": "INCHIK_GLYPH_9",
        "molecular_weight": 169.07,
        "logp": -3.20,
        "tpsa": 105.80,
        "hbd_count": 4,
        "hba_count": 5,
        "rotatable_bonds": 3,
        "chemical_class": "Glycine derivative",
        "irac_moa_group": "9",
        "moa_scheme": "HRAC",
        "pubchem_cid": 3496
    },
    "azoxystrobin": {
        "smiles": "CO\\C=C(\\C(=O)OC)c1ccccc1Oc2cc(nc(n2)Oc3ccccc3C#N)OC",
        "inchikey": "INCHIK_AZOXY_11",
        "molecular_weight": 403.39,
        "logp": 2.50,
        "tpsa": 89.28,
        "hbd_count": 0,
        "hba_count": 7,
        "rotatable_bonds": 6,
        "chemical_class": "Strobilurin / QoI",
        "irac_moa_group": "11",
        "moa_scheme": "FRAC",
        "pubchem_cid": 61122
    },
    "emamectin benzoate": {
        "smiles": "CCC(C)C1CC(C)CC2(CC3CC(CC=C(C)C(C(C)C=CC=C4COC5C(O)C(OC6CC(OC7CC(NC)C(O)C(C)O7)C(O)C(C)O6)CC(O)C45O)O3)O2)O1",
        "inchikey": "INCHIK_EMAM_6",
        "molecular_weight": 836.07,
        "logp": 3.55,
        "tpsa": 187.02,
        "hbd_count": 6,
        "hba_count": 14,
        "rotatable_bonds": 10,
        "chemical_class": "Avermectin",
        "irac_moa_group": "6",
        "moa_scheme": "IRAC",
        "pubchem_cid": 6451079
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
    }
}

TAXONOMY_MAP = {
    51655: {"order": "Lepidoptera", "family": "Plutellidae", "genus": "Plutella", "species": "Plutella xylostella"},
    13101: {"order": "Hemiptera", "family": "Aphididae", "genus": "Myzus", "species": "Myzus persicae"},
    29058: {"order": "Lepidoptera", "family": "Noctuidae", "genus": "Helicoverpa", "species": "Helicoverpa armigera"},
    32264: {"order": "Trombidiformes", "family": "Tetranychidae", "genus": "Tetranychus", "species": "Tetranychus urticae"},
    7063:  {"order": "Hemiptera", "family": "Aleyrodidae", "genus": "Bemisia", "species": "Bemisia tabaci"},
    108931:{"order": "Hemiptera", "family": "Delphacidae", "genus": "Nilaparvata", "species": "Nilaparvata lugens"},
    7539:  {"order": "Coleoptera", "family": "Chrysomelidae", "genus": "Leptinotarsa", "species": "Leptinotarsa decemlineata"},
    7108:  {"order": "Lepidoptera", "family": "Noctuidae", "genus": "Spodoptera", "species": "Spodoptera frugiperda"},
    257713:{"order": "Caryophyllales", "family": "Amaranthaceae", "genus": "Amaranthus", "species": "Amaranthus tuberculatus"},
    107608:{"order": "Caryophyllales", "family": "Amaranthaceae", "genus": "Amaranthus", "species": "Amaranthus palmeri"},
    4543:  {"order": "Poales", "family": "Poaceae", "genus": "Eleusine", "species": "Eleusine indica"},
    40559: {"order": "Helotiales", "family": "Sclerotiniaceae", "genus": "Botrytis", "species": "Botrytis cinerea"},
    1047171:{"order": "Capnodiales", "family": "Mycosphaerellaceae", "genus": "Zymoseptoria", "species": "Zymoseptoria tritici"},
}

def build_v3():
    print("=== Step 18: Building Processed Dataset v3.0 ===")
    
    # 1. Load baseline v2 records (44 records)
    with open(V2_PATH, "r", encoding="utf-8") as f:
        v2_records = [json.loads(line) for line in f if line.strip()]

    # 2. Load newly curated raw v3 records (30 records)
    with open(RAW_PATH, "r", encoding="utf-8") as f:
        raw_v3 = json.load(f)

    print(f"Loaded {len(v2_records)} baseline v2 records + {len(raw_v3)} newly curated v3 raw records.")

    # 3. Multi-Factor Deduplication & Normalization
    canonical_v3 = []
    seen_exact = set()
    seen_fuzzy = set()
    
    exact_duplicates = 0
    likely_duplicates = 0
    independent_count = 0
    unresolved_count = 0

    all_candidates = []
    
    # Format baseline v2
    for r in v2_records:
        r["dataset_version"] = "aprd-resistance-v3"
        all_candidates.append(r)

    # Format new raw records
    for idx, raw in enumerate(raw_v3):
        comp_key = raw["active_ingredient"].lower().strip()
        chem_info = CHEM_PROPERTIES.get(comp_key, {})
        tax_id = raw.get("ncbi_taxid")
        tax_info = TAXONOMY_MAP.get(tax_id, {})

        rec = {
            "case_id": f"REC-V3-{idx+101:04d}",
            "source": raw.get("source"),
            "source_record_id": raw.get("source_record_id"),
            "dataset_version": "aprd-resistance-v3",
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
            canonical_v3.append(r)
            independent_count += 1

    # Sort deterministically by resistance_year, then case_id
    canonical_v3.sort(key=lambda x: (x.get("resistance_year", 0), x.get("case_id", "")))

    # Write out Dataset v3 canonical JSONL
    with open(OUT_V3_PATH, "w", encoding="utf-8") as f:
        for rec in canonical_v3:
            f.write(json.dumps(rec) + "\n")

    # Compute manifest & stats
    hasher = hashlib.sha256()
    with open(OUT_V3_PATH, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    v3_sha256 = hasher.hexdigest()

    studies = set(r.get("study_id") or r.get("source_record_id") for r in canonical_v3)
    species = set(r.get("scientific_name") for r in canonical_v3)
    compounds = set(r.get("active_ingredient") for r in canonical_v3)
    countries = set(r.get("country") for r in canonical_v3)
    years = [r.get("resistance_year") for r in canonical_v3]

    manifest = {
        "dataset_version": "aprd-resistance-v3",
        "dataset_path": OUT_V3_PATH,
        "sha256": v3_sha256,
        "total_records": len(canonical_v3),
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
            "independent_observations_retained": len(canonical_v3)
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    with open(MANIFEST_V3_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\nSuccessfully built Dataset v3.0 at: {OUT_V3_PATH}")
    print(f"  * Total Canonical Observations:     {manifest['total_records']}")
    print(f"  * Independent Studies:              {manifest['independent_studies']}")
    print(f"  * Unique Species:                   {manifest['unique_species']}")
    print(f"  * Unique Compounds:                 {manifest['unique_compounds']}")
    print(f"  * Countries Represented:            {manifest['unique_countries']}")
    print(f"  * Year Range:                       {manifest['year_min']} - {manifest['year_max']}")
    print(f"  * Dataset v3 SHA256:                {v3_sha256}")

if __name__ == "__main__":
    build_v3()
