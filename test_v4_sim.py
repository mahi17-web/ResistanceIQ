import json
import os
from rdkit import Chem, DataStructs
from rdkit.Chem import rdFingerprintGenerator

V4_PATH = os.path.abspath("resistanceiq/data/processed/processed_v4_canonical_dataset.jsonl")

def test_sim():
    with open(V4_PATH, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f if line.strip()]

    train_val = [r for r in records if r["resistance_year"] <= 2018]
    test_recs = [r for r in records if r["resistance_year"] >= 2019]

    mfpgen = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=1024)

    train_val_fps = []
    for r in train_val:
        sm = r.get("canonical_pesticide", {}).get("smiles")
        if sm:
            m = Chem.MolFromSmiles(sm)
            if m:
                train_val_fps.append((r["active_ingredient"], mfpgen.GetFingerprint(m)))

    print(f"Loaded {len(train_val_fps)} fingerprints from Train+Val (Total: {len(train_val)})")

    sims_list = []
    for r in test_recs:
        sm = r.get("canonical_pesticide", {}).get("smiles")
        m = Chem.MolFromSmiles(sm) if sm else None
        if m and train_val_fps:
            fp = mfpgen.GetFingerprint(m)
            sims = [(name, DataStructs.TanimotoSimilarity(fp, t_fp)) for name, t_fp in train_val_fps]
            sims.sort(key=lambda x: x[1], reverse=True)
            best_name, best_sim = sims[0]
            sims_list.append(best_sim)
            print(f"Test: {r['active_ingredient']:<20} ({r['resistance_year']}) -> Closest: {best_name:<20} | Tanimoto: {best_sim:.3f}")

    print(f"\nMean Nearest-Neighbor Tanimoto (Test vs Train+Val): {np.mean(sims_list):.3f}")

if __name__ == "__main__":
    import numpy as np
    test_sim()
