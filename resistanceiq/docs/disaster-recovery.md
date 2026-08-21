# ResistanceIQ — Disaster Recovery & Business Continuity Plan

## 1. Objectives & Metrics

- **Recovery Point Objective (RPO)**: $\le 1\text{ hour}$ (Maximum acceptable data loss window; achieved via continuous WAL archiving and daily automated dumps).
- **Recovery Time Objective (RTO)**: $\le 30\text{ minutes}$ (Maximum acceptable platform downtime before primary services are restored).

---

## 2. Failure Scenarios & Recovery Workflows

### 2.1 Complete Database Corruption or Data Loss
1. **Detection**: Healthcheck `/api/v1/system/health` reports `database_connected: false`.
2. **Action**:
   - Spin up new PostgreSQL instance or RDS read replica.
   - Execute restore playbook from latest verified S3/GCS snapshot: `docs/backup-and-restore.md`.
   - Update `DATABASE_URL` environment variable.
3. **Verification**: Execute smoke test suite `python -m pytest tests/test_step8_production_qa.py`.

### 2.2 Model Artifact File Corruption or Accidental Deletion
1. **Detection**: Predictor raises `FileNotFoundError` or SHA-256 mismatch during boot.
2. **Action**:
   - Re-sync frozen model directory from immutable versioned object storage:
     `aws s3 sync s3://resistanceiq-models-prod/v1.0.0/ storage/models/ --exact-timestamps`
3. **Verification**: Verify checksum matches `b4a48f90dd7a831df0725cb5501b55d497624df24012779f4063f7f7a8c4ad8b`.

### 2.3 Failed Application Deployment (Bad Release)
1. **Action**: Trigger container rollback to previous release tag.
2. **Database Schema**: If Alembic migration failed, run `alembic downgrade -1`.
