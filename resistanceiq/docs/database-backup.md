# ResistanceIQ — Production Database Backup & Disaster Recovery Specification

## 1. Backup Strategy Overview

ResistanceIQ stores proprietary molecular research pipelines, target mutations, and calibrated resistance forecasts. The disaster recovery strategy combines automated point-in-time recovery (PITR) with daily compressed snapshots.

---

## 2. Backup Schedule & Retention

| Backup Type | Frequency | Retention Period | Storage Target | Encryption |
|---|---|---|---|---|
| **Continuous Write-Ahead Logs (WAL)** | Continuous (< 1 min lag) | 7 Days | Cloud Object Storage (Encrypted) | AES-256 (SSE-KMS) |
| **Full Logical Dump (`pg_dump`)** | Daily at 02:00 UTC | 30 Days | Geographically Redundant S3 / GCS | AES-256 (SSE-KMS) |
| **Monthly Snapshot** | 1st of each month | 365 Days | Cold Archive (Glacier / Deep Archive) | AES-256 (SSE-KMS) |

---

## 3. Automated Backup Procedure

```bash
#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date -u +"%Y%m%d_%H%M%SZ")
BACKUP_DIR="/var/backups/resistanceiq"
DB_NAME="${POSTGRES_DB:-resistanceiq_prod}"
DB_USER="${POSTGRES_USER:-resistanceiq_app}"
BACKUP_FILE="${BACKUP_DIR}/riq_backup_${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "Starting automated database backup for ${DB_NAME} at ${TIMESTAMP}..."
pg_dump -h localhost -U "${DB_USER}" -d "${DB_NAME}" -F p | gzip -9 > "${BACKUP_FILE}"

echo "Backup written to ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Upload to secure object storage
aws s3 cp "${BACKUP_FILE}" "s3://resistanceiq-backups-prod/${DB_NAME}/${TIMESTAMP}/" --sse aws:kms
```

---

## 4. Disaster Recovery & Restoration Procedure

To restore a database snapshot into a clean PostgreSQL instance:

```bash
# 1. Terminate active application connections
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'resistanceiq_prod';"

# 2. Recreate clean database
dropdb -U postgres --if-exists resistanceiq_prod
createdb -U postgres -O resistanceiq_app resistanceiq_prod

# 3. Stream decompressed SQL into database
gunzip -c riq_backup_resistanceiq_prod_YYYYMMDD.sql.gz | psql -U resistanceiq_app -d resistanceiq_prod

# 4. Verify record integrity
psql -U resistanceiq_app -d resistanceiq_prod -c "SELECT count(*) FROM forecasts; SELECT count(*) FROM projects;"
```
