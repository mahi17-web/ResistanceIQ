# ResistanceIQ — Step 27 Production Database Deployment & Operations Guide

**System**: ResistanceIQ Relational Persistence Subsystem  
**Engine**: PostgreSQL 15+ (Production) / SQLite 3 (Local Development & Isolated Unit Testing)  
**ORM**: SQLAlchemy 2.0+ with Alembic Migration Control  

---

## 1. Production PostgreSQL Topology & Requirements

ResistanceIQ requires PostgreSQL 15 or higher for production operation.

### Recommended Infrastructure Sizing:
- **Instance Type**: AWS RDS / Aurora PostgreSQL / Google Cloud SQL / Supabase / Neon / Self-hosted
- **vCPU**: $\ge 2$ vCPUs
- **Memory**: $\ge 4$ GB RAM
- **Storage**: $\ge 20$ GB SSD (gp3 / NVMe with automated expansion)
- **Connections**: Configured for $\ge 50$ max concurrent connections with pooling

---

## 2. Database Connection Configuration

Configure the `DATABASE_URL` environment variable using standard PostgreSQL URI format:

```bash
# Standard PostgreSQL connection format
DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>

# Example with SSL mode enforced
DATABASE_URL=postgresql://riq_app:SecureProdPass2026!@postgres.internal.resistanceiq.bio:5432/resistanceiq_prod?sslmode=require
```

### Connection Pooling Architecture:
- **`pool_size`**: `10` persistent connections per application worker.
- **`max_overflow`**: `20` burst connections for peak inference / batch exports.
- **`pool_pre_ping`**: `True` (validates socket liveness before checkout to prevent stale disconnects).
- **`pool_recycle`**: `300` seconds (refreshes idle connections every 5 minutes).

---

## 3. Alembic Schema Migrations

All schema changes in ResistanceIQ are version-controlled via Alembic migrations.

### Migration Execution Procedure:

#### 1. Inspect Current Revision:
```bash
cd resistanceiq/backend
alembic current
```

#### 2. Execute Pending Migrations:
```bash
cd resistanceiq/backend
alembic upgrade head
```

#### 3. Migration History & Lineage:
- `001_initial_schema.py`: Base organization, users, projects, molecules, targets, pests, forecasts.
- `002_data_ingestion_schema.py`: Data ingestion sources, raw records, batches, canonical entities.
- `003_user_auth_lifecycle_schema.py`: Password reset codes, rate limits, session tokens.
- `004_knowledge_graph_schema.py`: Crop, pest, target, protein, and structure graph associations.
- `005_production_auth_rbac_audit_schema.py`: Extended RBAC roles, audit logs, email verification tokens.

---

## 4. Production Database Backup Strategy

| Backup Type | Frequency | Retention | Mechanism |
|---|---|---|---|
| **Continuous WAL Archiving** | Real-time (Point-in-Time Recovery) | 7 – 30 Days | AWS RDS / pgBackRest |
| **Full Database Snapshot** | Daily at 02:00 UTC | 30 Days | `pg_dump` automated snapshot |
| **Weekly Offline Archive** | Weekly (Sunday 03:00 UTC) | 365 Days | Encrypted S3 / Cloud Storage Glacier |

### Manual Snapshot Command:
```bash
pg_dump -Fc --no-owner --no-privileges -h $DB_HOST -U $DB_USER -d $DB_NAME > /backups/resistanceiq_$(date +%Y%m%d_%H%M%S).dump
```

---

## 5. Restore & Recovery Procedure

### Full Database Restore:
```bash
# 1. Terminate existing connections
psql -h $DB_HOST -U $DB_USER -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'resistanceiq_prod' AND pid <> pg_backend_pid();"

# 2. Recreate target database
dropdb -h $DB_HOST -U $DB_USER resistanceiq_prod
createdb -h $DB_HOST -U $DB_USER -O riq_app resistanceiq_prod

# 3. Restore from custom-format backup
pg_restore -h $DB_HOST -U $DB_USER -d resistanceiq_prod -v /backups/resistanceiq_backup.dump

# 4. Verify Alembic schema migration level
cd resistanceiq/backend && alembic check
```

---

## 6. Production Safety Invariants

1. **Zero Destructive Table Creation**: `Base.metadata.create_all()` is never executed automatically in production. All schema evolution is governed by Alembic.
2. **Zero Seed Data Injection**: `ALLOW_DEV_SEEDING` is enforced as `False` in production; mock accounts (`priya@bindwell.bio`, etc.) are never inserted into production databases.
3. **Transaction Rollbacks**: Every FastAPI database dependency session rolls back on unhandled exceptions, preventing orphaned transactions.
4. **Least-Privilege Database Role**: Application runtime connects using an unprivileged application user (`riq_app`) without `SUPERUSER` or `CREATEDB` permissions.
