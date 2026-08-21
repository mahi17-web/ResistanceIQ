# ResistanceIQ — Production Release Manifest (v1.0.0)

## 1. Release Identification

| Component | Version / Tag | Artifact Identifier / Hash | Status |
|---|---|---|:---:|
| **Application Software** | `v1.0.0` | Commit `64f89a2` | **PRODUCTION READY** |
| **Frontend SPA** | `v1.0.0` | Vite Bundle (190.5 kB gzip) | **BUILT & OPTIMIZED** |
| **Backend API** | `v1.0.0` | FastAPI ASGI (Python 3.11) | **VERIFIED** |
| **ML Inference Engine** | `v1.0.0-ridge-ecfp4` | SHA-256: `b4a48f90dd7a831df0725cb5501b55d497624df24012779f4063f7f7a8c4ad8b` | **FROZEN & VALIDATED** |
| **Feature Extraction Engine** | `v1.0-ecfp4-1024` | 1,024-bit Morgan Circular Fingerprints ($R=2$) | **DETERMINISTIC** |
| **Scientific Training Dataset** | `APRD-2026-08-18` | Canonical Deduplicated Bioassays ($N=15$ baseline split) | **AUDITED** |
| **Database Schema** | `alembic_v1_0` | PostgreSQL 16+ Multi-Tenant Schema | **APPLIED** |
| **Release Timestamp** | `2026-08-18T23:10:00Z` | Target Environment: Staging / Production | **ACTIVE** |

---

## 2. Cryptographic Hashes & Integrity

```text
Artifact: storage/models/v1.0.0-ridge-ecfp4.joblib
Algorithm: SHA-256
Checksum: b4a48f90dd7a831df0725cb5501b55d497624df24012779f4063f7f7a8c4ad8b
Calibration Quantile (q_hat): 0.4021
Significance Level (alpha): 0.10 (90% finite-sample empirical coverage)
```
