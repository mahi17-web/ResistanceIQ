import json
import os
import numpy as np

V3_PATH = os.path.abspath("resistanceiq/data/processed/processed_v3_canonical_dataset.jsonl")
AUDIT_DIR = os.path.abspath("resistanceiq/data/audit/step18")
os.makedirs(AUDIT_DIR, exist_ok=True)

def profile():
    with open(V3_PATH, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f if line.strip()]

    print("================================================================================")
    print("STEP 18 — TEMPORAL SPLIT & DATASET QUALITY AUDIT FOR DATASET V3")
    print("================================================================================")
    
    train_recs = [r for r in records if r["resistance_year"] <= 2012]
    val_recs = [r for r in records if 2013 <= r["resistance_year"] <= 2018]
    test_recs = [r for r in records if r["resistance_year"] >= 2019]

    def split_stats(split_name, recs):
        studies = set(r.get("study_id") or r.get("source_record_id") for r in recs)
        species = set(r.get("scientific_name") for r in recs)
        comps = set(r.get("active_ingredient") for r in recs)
        countries = set(r.get("country") for r in recs)
        rrs = [r.get("resistance_ratio") for r in recs]
        return {
            "name": split_name,
            "count": len(recs),
            "pct": len(recs) / len(records) * 100,
            "studies": len(studies),
            "species": len(species),
            "compounds": len(comps),
            "countries": len(countries),
            "rr_min": min(rrs),
            "rr_max": max(rrs),
            "rr_median": float(np.median(rrs)),
        }

    s_train = split_stats("Train (<= 2012)", train_recs)
    s_val = split_stats("Validation (2013-2018)", val_recs)
    s_test = split_stats("Held-Out Test (2019-2024)", test_recs)

    for s in [s_train, s_val, s_test]:
        print(f"\n[{s['name']}]")
        print(f"  Records:            {s['count']} ({s['pct']:.1f}%)")
        print(f"  Independent Studies: {s['studies']}")
        print(f"  Unique Species:     {s['species']}")
        print(f"  Unique Compounds:   {s['compounds']}")
        print(f"  Countries:          {s['countries']}")
        print(f"  RR Range:           {s['rr_min']:.1f}x - {s['rr_max']:.1f}x (Median: {s['rr_median']:.1f}x)")

    # Longitudinal Series Analysis
    series_map = {}
    for r in records:
        key = (r.get("scientific_name"), r.get("active_ingredient"))
        series_map.setdefault(key, []).append(r)

    longitudinal_series = {k: v for k, v in series_map.items() if len(v) > 1}
    series_lens = [len(v) for v in longitudinal_series.values()]

    print("\n--------------------------------------------------------------------------------")
    print("LONGITUDINAL REPEATED OBSERVATIONS AUDIT")
    print("--------------------------------------------------------------------------------")
    print(f"Total Unique Organism-Compound Pairs: {len(series_map)}")
    print(f"Longitudinal Series (>= 2 time points): {len(longitudinal_series)}")
    print(f"Median Longitudinal Length:            {np.median(series_lens) if series_lens else 0:.1f}")
    print(f"Maximum Longitudinal Length:           {max(series_lens) if series_lens else 0}")
    print("--------------------------------------------------------------------------------")

    # Save audit JSON
    audit_data = {
        "dataset_version": "aprd-resistance-v3",
        "total_records": len(records),
        "splits": {
            "train": s_train,
            "validation": s_val,
            "test": s_test
        },
        "longitudinal_series_count": len(longitudinal_series),
        "longitudinal_species": sorted(list(set(k[0] for k in longitudinal_series.keys()))),
        "longitudinal_compounds": sorted(list(set(k[1] for k in longitudinal_series.keys())))
    }

    with open(os.path.join(AUDIT_DIR, "v3_temporal_audit.json"), "w", encoding="utf-8") as f:
        json.dump(audit_data, f, indent=2)

    # Save split JSON to data/splits
    splits_dict = {
        "dataset_version": "aprd-resistance-v3",
        "train_case_ids": [r["case_id"] for r in train_recs],
        "val_case_ids": [r["case_id"] for r in val_recs],
        "test_case_ids": [r["case_id"] for r in test_recs]
    }
    with open(os.path.abspath("resistanceiq/data/splits/aprd_v3_temporal_splits.json"), "w", encoding="utf-8") as f:
        json.dump(splits_dict, f, indent=2)

if __name__ == "__main__":
    profile()
