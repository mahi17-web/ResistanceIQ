# ResistanceIQ — Comprehensive Operations Runbook & Incident Response

## 1. Master Incident Response Procedures

This runbook defines exact detection, diagnosis, immediate action, verification, and recovery steps for 10 operational scenarios.

---

### Procedure 1: API Outage / High Error Rate (5xx $> 5\%$)
- **Detection**: `/api/v1/system/health` fails or error status distribution spike in telemetry.
- **Diagnosis**: Run `docker compose logs --tail=200 backend`.
- **Immediate Action**: If container crashed, restart with `docker compose restart backend`.
- **Verification**: `curl -I http://localhost:8000/api/v1/system/health`.
- **Rollback**: `docker compose up -d --build backend` from last stable Git commit.

---

### Procedure 2: Database Outage / Connection Exhaustion
- **Detection**: API logs report `OperationalError: could not connect to server` or `QueuePool limit exceeded`.
- **Diagnosis**: Connect via CLI `docker compose exec postgres pg_isready` and inspect `pg_stat_activity`.
- **Immediate Action**: Terminate leaked or idle connections. Restart PostgreSQL if hung.
- **Verification**: Query `SELECT 1;` from backend shell.

---

### Procedure 3: ML Inference Outage / Failure Spike
- **Detection**: Predictor raises unhandled exception; telemetry shows sudden spike in `failed_forecasts`.
- **Diagnosis**: Check model file accessibility in `storage/models` and test loading via Python shell.
- **Immediate Action**: Re-verify model binary SHA-256 against registry inventory.
- **Verification**: Submit test payload to `/api/v1/forecasts/evaluate`.

---

### Procedure 4: Ingestion Run Schema Failure
- **Detection**: Ingestion job aborts with `SchemaValidationError` or `NullRateExceeded`.
- **Diagnosis**: Inspect rejected records CSV in `storage/quarantine/`.
- **Immediate Action**: Do NOT force commit to `dataset_versions`. Contact data provider or update parser.
- **Verification**: Re-run parser in dry-run mode.

---

### Procedure 5: Data Drift & Novel Chemotype Surge
- **Detection**: Telemetry `out_of_domain_count` $> 30\%$ of queries.
- **Diagnosis**: Discovery scientists are querying novel chemical scaffolds unrepresented in APRD training set.
- **Immediate Action**: Verify UI clearly renders `OUT_OF_DOMAIN` badge and widened conformal intervals ($[\text{RR}_{\text{lower}}, \text{RR}_{\text{upper}}]$).
- **Verification**: Plan future APRD ingestion sprint for missing chemotype classes.

---

### Procedure 6: Model Drift Detection (Delayed Ground Truth)
- **Detection**: Post-2026 bioassay records reveal $\text{MAE}_{\log_{10}} > 0.415$ (baseline $+ 25\%$).
- **Diagnosis**: Run 5-fold cross-validation on combined historical + new dataset.
- **Immediate Action**: Trigger Step 5 and Step 6 training & validation pipeline for candidate architectures.
- **Verification**: Formal Model Acceptance Gate sign-off before production promotion.

---

### Procedure 7: Failed Application Deployment
- **Detection**: CI or post-deployment smoke test fails on staging.
- **Diagnosis**: Inspect migration logs and container exit codes.
- **Immediate Action**: Roll back Docker image tag or run `git checkout <PREVIOUS_STABLE_TAG> && docker compose up -d --build`.

---

### Procedure 8: Database Backup Failure
- **Detection**: Backup cron script exits with non-zero status code or backup archive age $> 24\text{ hours}$.
- **Diagnosis**: Check disk space in `/var/backups` and S3 bucket IAM permissions.
- **Immediate Action**: Manually execute `bash scripts/backup_db.sh` and verify `.sql.gz` file size.

---

### Procedure 9: Object Storage Failure
- **Detection**: Report generation returns 500 error when saving PDF/CSV artifacts.
- **Diagnosis**: Verify directory permissions on `/app/storage/reports`.
- **Immediate Action**: Fix directory permissions: `chmod 755 storage/reports`.

---

### Procedure 10: Model Artifact File Corruption
- **Detection**: `ModelLoader` raises `ModelIntegrityError: SHA-256 mismatch`.
- **Diagnosis**: Model file was modified or partially downloaded.
- **Immediate Action**: Re-download frozen joblib file from read-only S3 bucket.
