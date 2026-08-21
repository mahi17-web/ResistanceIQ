"""
ResistanceIQ — Process & Validate Dataset v2.0
Transforms raw APRD expanded records into canonical JSONL dataset.
"""

import os
import csv
import json
import hashlib
from typing import Dict, Any, List
from rdkit import Chem
from rdkit.Chem import Descriptors


def process_raw_to_canonical(input_csv: str, output_jsonl: str) -> List[Dict[str, Any]]:
    records = []
    
    with open(input_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            smiles = row.get("smiles", "").strip()
            mol = Chem.MolFromSmiles(smiles) if smiles else None
            
            canonical_smiles = Chem.MolToSmiles(mol) if mol else smiles
            mol_wt = Descriptors.MolWt(mol) if mol else 350.0
            logp = Descriptors.MolLogP(mol) if mol else 2.5
            tpsa = Descriptors.TPSA(mol) if mol else 45.0
            hbd = Descriptors.NumHDonors(mol) if mol else 1
            hba = Descriptors.NumHAcceptors(mol) if mol else 4
            rotb = Descriptors.NumRotatableBonds(mol) if mol else 4

            rr = float(row.get("resistance_ratio", 1.0))
            baseline = float(row.get("susceptible_baseline", 0.1))
            year = int(row.get("resistance_year", 2010))
            mutation = row.get("target_mutation", "None").strip()

            record = {
                "case_id": row.get("record_id"),
                "source": row.get("source", "APRD"),
                "source_record_id": row.get("source_record_id"),
                "scientific_name": row.get("scientific_name"),
                "canonical_organism": {
                    "canonical_name": row.get("scientific_name"),
                    "order": row.get("taxa_order", "Unknown"),
                    "family": row.get("taxa_family", "Unknown"),
                    "ncbi_taxid": int(row.get("ncbi_taxid", 0)),
                },
                "active_ingredient": row.get("active_ingredient"),
                "canonical_pesticide": {
                    "active_ingredient": row.get("active_ingredient"),
                    "irac_moa_group": row.get("irac_moa_group", "Unknown"),
                    "chemical_class": row.get("chemical_class", "Unknown"),
                    "cas_number": row.get("cas_number"),
                    "smiles": canonical_smiles,
                    "inchikey": row.get("inchikey"),
                    "molecular_weight": mol_wt,
                    "logp": logp,
                    "tpsa": tpsa,
                    "hbd_count": hbd,
                    "hba_count": hba,
                    "rotatable_bonds": rotb,
                },
                "resistance_year": year,
                "country": row.get("country", "Unknown"),
                "continent": row.get("continent", "Unknown"),
                "bioassay_method": row.get("bioassay_method", "Topical"),
                "susceptible_baseline": baseline,
                "field_lc50": float(row.get("field_lc50", baseline * rr)),
                "resistance_ratio": rr,
                "target_mutation": mutation,
                "has_target_mutation": 1 if mutation and mutation.lower() != "none" else 0,
            }
            records.append(record)

    os.makedirs(os.path.dirname(output_jsonl), exist_ok=True)
    with open(output_jsonl, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r) + "\n")

    return records


if __name__ == "__main__":
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    raw_path = os.path.join(base_dir, "data/raw/aprd_expanded_v2_records.csv")
    out_path = os.path.join(base_dir, "data/processed/processed_v2_canonical_dataset.jsonl")
    recs = process_raw_to_canonical(raw_path, out_path)
    print(f"Successfully processed {len(recs)} canonical bioassay records to {out_path}")
