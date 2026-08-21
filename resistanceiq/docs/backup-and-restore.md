# ResistanceIQ — Database Backup & Restoration Playbook

## 1. Overview & Verification

This document specifies the step-by-step procedures for automated backups, periodic test restorations, and disaster recovery validation for ResistanceIQ.

---

## 2. Backup Execution (Automated & Manual)

### 2.1 Automated Docker Backup Script
```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="./storage/backups"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%SZ")
BACKUP_FILE="${BACKUP_DIR}/resistanceiq_dump_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "Creating compressed database backup..."
docker compose exec -T postgres pg_dump -U resistanceiq_app resistanceiq_prod | gzip -9 > "${BACKUP_FILE}"

echo "Backup completed: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"
```

---

## 3. Database Restoration Playbook

### Step 1: Prepare Clean Target Database
```bash
docker compose exec postgres psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'resistanceiq_prod';"
docker compose exec postgres dropdb -U postgres --if-exists resistanceiq_prod
docker compose exec postgres createdb -U postgres -O resistanceiq_app resistanceiq_prod
```

### Step 2: Stream Backup SQL into Database
```bash
gunzip -c ./storage/backups/resistanceiq_dump_YYYYMMDD_HHMMSSZ.sql.gz | docker compose exec -T postgres psql -U resistanceiq_app -d resistanceiq_prod
```

### Step 3: Verify Restoration Integrity
```bash
docker compose exec postgres psql -U resistanceiq_app -d resistanceiq_prod -c "
  SELECT 
    (SELECT count(*) FROM organizations) AS org_count,
    (SELECT count(*) FROM projects) AS project_count,
    (SELECT count(*) FROM forecasts) AS forecast_count,
    (SELECT count(*) FROM canonical_pesticides) AS pesticide_count;
"
```
