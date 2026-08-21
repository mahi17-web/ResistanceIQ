# ResistanceIQ — Step 26 Database Management, Migration & Disaster Recovery

## 1. Multi-Environment Database Support
- **Development & Test**: SQLite with static connection pooling and session management.
- **Production Staging & Enterprise Production**: PostgreSQL (e.g. `postgresql://user:pass@host:5432/dbname`) required with SQLAlchemy ORM and Alembic migration versioning.

---

## 2. Schema Architecture & Core Tables
- `organizations`: Multi-tenant organization boundaries and subscription tiers.
- `users`: Authenticated researcher and administrator accounts with password hashes, roles, and verification states.
- `projects`: Isolated candidate research campaigns.
- `molecules`: Ingested chemical candidates with SMILES, molecular formulas, and PubChem CIDs.
- `targets`: IRAC biochemical target records with UniProt accessions.
- `pests`: Standardized agricultural target species and taxonomy.
- `crops` & `crop_threats`: Knowledge graph mapping crops, target pests, and damage potentials.
- `protein_records` & `protein_structures`: UniProt / PDB / AlphaFold structure resolution metadata.
- `forecasts`: Persisted durability inference records with durability scores, estimated years, conformal bounds, and risk tiers.
- `password_reset_codes`: Hashed OTP verification codes and single-use authorization tokens.
- `activity_logs`: Immutable audit trails recording user and system actions.

---

## 3. Atomic Transactions & Consistency
- All multi-table mutations (such as user registration with organization creation, or forecast persistence with audit logging) execute inside single atomic database transactions.
- On failure, `db.rollback()` executes immediately to prevent orphaned or partial records.

---

## 4. Disaster Recovery & Backup Strategy
- **Automated Daily Backups**: `pg_dump -Fc` automated snapshotting.
- **Point-in-Time Recovery (PITR)**: Write-Ahead Logging (WAL) archiving.
- **Health Probing**: Real-time `SELECT 1` database liveness queries exposed via `/health` and `/health/ready`.
