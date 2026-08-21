# ResistanceIQ — Step 26 Production Hardening & Reliability Report

## 1. Scope and Architecture Overview
This document specifies the reliability, deterministic execution, error handling contracts, and fail-closed configurations implemented in Step 26.

---

## 2. API Contract & Error Uniformity
All API endpoints return structured, deterministic error responses adhering to the enterprise contract:

```json
{
  "error_code": "ENTITY_NOT_FOUND",
  "stage": "ENTITY_RESOLUTION",
  "request_id": "req_a1b2c3d4",
  "message": "Required candidate molecule record unavailable.",
  "detail": "Required candidate molecule record unavailable.",
  "retryable": false
}
```

### Core Error Categories:
1. `INVALID_INPUT` / `VALIDATION_ERROR`: Input payload malformed or invalid SMILES.
2. `AUTH_UNAUTHORIZED` / `AUTH_FORBIDDEN`: Missing JWT credentials or insufficient role permissions.
3. `ENTITY_RESOLUTION_FAILED`: Referenced project, molecule, target, or pest not found.
4. `MODEL_INTEGRITY_FAILURE`: Checksum mismatch or invalid feature dimensionality.
5. `UNCERTAINTY_CALIBRATION_FAILED`: Non-finite conformal bounds.
6. `RATE_LIMIT_EXCEEDED`: Exceeded rate limit with `retryable: true` and `Retry-After` header.

---

## 3. Idempotency & Deduplication Protection

To eliminate duplicated transactions during high latency or double-clicks:
- **Forecast Pipeline Deduplication**: Rapid repeat forecast submissions for identical parameters `(project_id, molecule_id, target_id, pest_id)` within a 15-second window return the existing forecast record instead of executing duplicate model jobs or creating redundant database entries.
- **Password Reset Throttling**: Users are limited to 3 active OTP requests within a 15-minute window; older unverified codes are automatically invalidated.

---

## 4. Scientific Governance & Baseline Locking

- **Locked Benchmark Model**: `v2.0.0-gbrt-ecfp4` (`RandomForestRegressor`, 60 estimators, 1059 features).
- **Governance Mode**: `REQUIRES VALIDATION` (UI explicitly banners `RESEARCH / VALIDATION MODE`).
- **Integrity Enforcement**: Model weights and transformers are immutable; any hash drift triggers an immediate `ModelIntegrityError` upon startup or inference.

---

## 5. Automated Test Suite Metrics
- **Total Automated Tests**: 171 tests across Unit, Security, ML, Ingestion, E2E, and Regression suites.
- **Pass Rate**: 100% (171 / 171 passed).
- **Failures**: 0.
- **Errors**: 0.
