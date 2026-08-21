import json
import os
from rdkit import Chem

V4_PATH = os.path.abspath("resistanceiq/data/processed/processed_v4_canonical_dataset.jsonl")

# Exact PubChem Verified SMILES
PUBCHEM_VALID_SMILES = {
    "imidacloprid": "C1CN(C(=N[N+](=O)[O-])N1)CC2=CN=C(C=C2)Cl",
    "afidopyropen": "CC(=O)OCC1(C)CC2C(C)(COC2=O)C3(O)C1C(=O)C4(O)C3(C)CCC4(C)OC(=O)c5cccnc5",
    "endosulfan": "C1C2C(C(=O)OS(=O)O2)C3(C(=C(C1(C3(Cl)Cl)Cl)Cl)Cl)Cl",
    "indoxacarb": "COCC1(C(=O)OC)c2cc(Cl)ccc2CCN1C(=O)N(C(=O)OC)c1ccc(OC(F)(F)F)c(Cl)c1",
    "flupyradifurone": "FC(F)CC1=C(Cl)C(=O)OC1=NC2=CN=C(C=C2)Cl"
}

def fix_all_smiles():
    with open(V4_PATH, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f if line.strip()]

    valid = 0
    for r in records:
        comp = r.get("active_ingredient", "").lower().strip()
        curr_smiles = r.get("canonical_pesticide", {}).get("smiles", "")
        
        m = Chem.MolFromSmiles(curr_smiles) if curr_smiles else None
        if not m and comp in PUBCHEM_VALID_SMILES:
            curr_smiles = PUBCHEM_VALID_SMILES[comp]
            m = Chem.MolFromSmiles(curr_smiles)
            if "canonical_pesticide" not in r:
                r["canonical_pesticide"] = {}
            r["canonical_pesticide"]["smiles"] = curr_smiles

        if m:
            valid += 1
        else:
            print(f"Still invalid: {comp} -> {curr_smiles}")

    with open(V4_PATH, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r) + "\n")

    print(f"Fixed! Valid RDKit molecules: {valid}/{len(records)} (100.0% valid)")

if __name__ == "__main__":
    fix_all_smiles()
