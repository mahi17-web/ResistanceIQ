# ResistanceIQ — Step 27 Production Backup & Disaster Recovery Runbook

**Document Type**: Operational Disaster Recovery Plan (DRP)  
**Target RPO (Recovery Point Objective)**: $< 1$ Hour  
**Target RTO (Recovery Time Objective)**: $< 30$ Minutes  
**Scope**: Relational Database, Model Artifacts, Environment Secrets, and Container Workloads  

---

## 1. Backup Topology & Retention Schedule

| Component | Backup Method | Frequency | Retention | Storage Target |
|---|---|---|---|---|
| **PostgreSQL Database** | Automated WAL Archiving | Continuous | 7 – 30 Days | Encrypted S3 / Cloud Storage |
| **PostgreSQL Full Dump** | `pg_dump -Fc` snapshot | Daily @ 02:00 UTC | 30 Days | S3 Standard-IA |
| **Model Registry Artifacts** | Git LFS / Immutable Artifact Vault | On release / Immutable | Indefinite | Multi-Region Bucket |
| **Environment Configuration** | Infrastructure-as-Code / Vault | On change | Indefinite | AWS Secrets Manager / Vault |

---

## 2. Disaster Recovery Scenarios & Playbooks

### Scenario A: Database Corruption or Data Loss
1. **Identify Target Timestamp**: Determine exact timestamp prior to corruption event.
2. **Provision New Database Node**: Create a fresh PostgreSQL instance to avoid overwriting forensics.
3. **Execute Point-in-Time Restore (PITR)**:
   ```bash
   pg_restore -h $RECOVERY_DB_HOST -U $DB_USER -d resistanceiq_recovery -v /backups/daily_snapshot.dump
   ```
4. **Run Alembic Verification**:
   ```bash
   cd resistanceiq/backend && alembic current
   ```
5. **Switch Traffic**: Update backend `DATABASE_URL` in container orchestration and trigger rolling deployment.

---

### Scenario B: Model Artifact Checksum Tampering / Corruption
If application raises `MODEL_INTEGRITY_FAILURE` (`6fc915fa26716dc4a06bad71f586af95ee071acf11e9a5b8acdc5171fed55622` mismatch):
1. **Isolate Node**: Route traffic away from compromised container instance.
2. **Re-fetch Canonical Artifact**:
   ```bash
   git checkout origin/main -- resistanceiq/storage/models/v2.0.0-gbrt-ecfp4.joblib
   ```
3. **Validate Checksum Locally**:
   ```bash
   python -c "import hashlib; print(hashlib.sha256(open('resistanceiq/storage/models/v2.0.0-gbrt-ecfp4.joblib', 'rb').read()).hexdigest())"
   ```
4. **Re-deploy Container**: Push fresh container image built from verified GitHub commit.

---

### Scenario C: Secret Compromise / Rotation Protocol
1. **JWT Secret Compromise**:
   - Generate fresh 64-character hex secret: `openssl rand -hex 32`
   - Update `JWT_SECRET` in secret store.
   - Trigger backend restart. Note: Active user access tokens will expire immediately, forcing re-authentication via password.
2. **SMTP Password Compromise**:
   - Revoke compromised Gmail App Password in Google Account Security.
   - Generate fresh App Password.
   - Update `SMTP_PASSWORD` in secret manager.
3. **Database Credentials**:
   - Rotate database password using zero-downtime dual-user mechanism in PostgreSQL.

---

## 3. Incident Response Escalation Path

1. **Detection**: Prometheus / CloudWatch alerts on `HTTP 5xx > 1%` or `Readiness Status: Degraded`.
2. **Triage**: On-call DevOps / Security engineer reviews structured correlation logs.
3. **Mitigation**: Roll back to previous verified container image version.
4. **Root Cause Analysis (RCA)**: Document incident in post-mortem report within 48 hours.
