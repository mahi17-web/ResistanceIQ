import hashlib
import os
import json

def compute_sha256(file_path: str) -> str:
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

def lock_baseline_v2():
    files_to_lock = {
        "dataset_v2_canonical": os.path.abspath("resistanceiq/data/processed/processed_v2_canonical_dataset.jsonl"),
        "splits_v2_temporal": os.path.abspath("resistanceiq/data/splits/aprd_v2_temporal_splits.json"),
        "model_v2_storage": os.path.abspath("resistanceiq/storage/models/v2.0.0-gbrt-ecfp4.joblib"),
        "model_v2_registry": os.path.abspath("resistanceiq/ml/registry/v2.0.0-gbrt-ecfp4/model.joblib"),
    }
    
    checksums = {}
    for name, path in files_to_lock.items():
        if os.path.exists(path):
            sha = compute_sha256(path)
            checksums[name] = {
                "path": path,
                "sha256": sha,
                "size_bytes": os.path.getsize(path),
                "status": "LOCKED_IMMUTABLE"
            }
            print(f"[LOCK] {name} -> {sha[:16]}... ({os.path.getsize(path)} bytes)")
        else:
            print(f"[WARN] File not found: {path}")

    out_path = os.path.abspath("resistanceiq/data/metadata/baseline_v2_checksums.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(checksums, f, indent=2)

    print(f"\nBaseline v2 checksums recorded and locked at: {out_path}")
    return checksums

if __name__ == "__main__":
    lock_baseline_v2()
