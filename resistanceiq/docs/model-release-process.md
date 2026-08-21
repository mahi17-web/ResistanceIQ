# ResistanceIQ — Model Release & Acceptance Gate Process

## 1. Zero Automatic Promotion Principle

No trained machine learning model can be deployed to production automatically. All candidate models must pass the formal 5-stage qualification gate:

```text
[ Step 5 Training Pipeline ]
            │
            ▼
[ Step 6 5-Fold Stratified Group K-Fold Cross-Validation ]
            │
            ▼
[ Split Conformal Coverage Audit (Empirical >= 88% at alpha=0.10) ]
            │
            ▼
[ Cryptographic SHA-256 Checksum Freezing & Metadata Serialization ]
            │
            ▼
[ Principal Scientific Review & Manual Promotion Approval ]
```

---

## 2. Release Metadata Requirements

Every model artifact registered in `storage/models` must contain:
1. `model_version`: e.g. `v1.0.0-ridge-ecfp4`.
2. `artifact_sha256`: Cryptographic hash verified at loader initialization.
3. `dataset_version`: ID of canonical training split.
4. `q_hat`: Split conformal calibration quantile ($\hat{q} = 0.4021$).
5. `status`: Set explicitly to `PRODUCTION` or `DEVELOPMENT_ONLY`.
