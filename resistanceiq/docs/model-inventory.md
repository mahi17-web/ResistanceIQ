# ResistanceIQ — Model Inventory & Registry

## 1. Overview

This document maintains the immutable audit record of all model artifacts trained, validated, and registered within the ResistanceIQ machine learning subsystem.

---

## 2. Model Catalog

| Model Version | Algorithm | Target | Dataset Version | Feature Version | Trained UTC | Train $N$ | Val $N$ | Test $N$ | Test $\text{MAE}_{\log_{10}}$ | Rank $\rho$ | Status | Artifact SHA-256 |
|---|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|---|---|
| **`v1.0.0-ridge-ecfp4`** *(Selected Frozen)* | Ridge Regressor ($\alpha=1.0$) | $\log_{10}(RR)$ | `v1.0-aprd-canonical` | `v1.0-ecfp4-irac` | 2026-08-18 | 10 | 3 | 2 | 0.3320 | 1.000 | **DEVELOPMENT ONLY** | `b4a48f90dd7a831df0725cb5501b55d497624df24012779f4063f7f7a8c4ad8b` |
| **`v0.1-ridge-ecfp4-a0.1`** | Ridge Regressor ($\alpha=0.1$) | $\log_{10}(RR)$ | `v1.0-aprd-canonical` | `v1.0-ecfp4-irac` | 2026-08-18 | 10 | 3 | 2 | 0.3458 | 1.000 | CANDIDATE | `26842f9600ca6963d613b6716a26ac262517740e62e31d47fee3e3d441dd6a4d` |
| **`v0.2-rf-ecfp4`** | Random Forest ($n=50, d=5$) | $\log_{10}(RR)$ | `v1.0-aprd-canonical` | `v1.0-ecfp4-irac` | 2026-08-18 | 10 | 3 | 2 | 0.2729 | 1.000 | CANDIDATE | `85337a20336f0bfeeb87a9f01fae795e03faac2d50bdb9600999f120cfa7729a` |
| **`global-mean-baseline`** | Global Mean $\hat{y} = \mu_{\text{train}}$ | $\log_{10}(RR)$ | `v1.0-aprd-canonical` | None | 2026-08-18 | 10 | 3 | 2 | 0.2909 | 1.000 | REFERENCE BASELINE | In-memory |
| **`species-moa-baseline`** | Conditional Group Mean | $\log_{10}(RR)$ | `v1.0-aprd-canonical` | IRAC + Order | 2026-08-18 | 10 | 3 | 2 | 0.2909 | 1.000 | REFERENCE BASELINE | In-memory |

---

## 3. Registered Model Metadata

### `v1.0.0-ridge-ecfp4` (Active Inference Model)
- **Architecture**: Scikit-Learn `Ridge(alpha=1.0, random_state=42)`
- **Input Dimension**: 1,041 features (1,024 Morgan circular bits + 6 standardized PhysChem descriptors + 5 One-Hot categories + 2 Temporal + 3 Genetic/docking indicators)
- **Target Unit**: $\log_{10}(\text{Resistance Ratio})$
- **Conformal Calibration**: 90% finite-sample coverage bound $\hat{q} = 0.4021$
- **Applicability Domain**: Morgan Fingerprint Tanimoto similarity threshold $\ge 0.40$
- **Artifact Path**: `storage/models/v1.0.0-ridge-ecfp4.joblib`
- **Integrity Checksum (SHA-256)**: `b4a48f90dd7a831df0725cb5501b55d497624df24012779f4063f7f7a8c4ad8b`
