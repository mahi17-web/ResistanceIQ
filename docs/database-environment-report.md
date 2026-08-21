# ResistanceIQ — Database & Migration Environment Report

## 1. Executive Summary

This report documents the architectural configuration, migration status, fail-fast production isolation, and data preservation strategies across all ResistanceIQ operational environments.

---

## 2. Environment Configuration Matrix

| Dimension / Spec | Development Environment | Staging Environment | Production Environment |
|---|---|---|---|
| **Database Engine** | SQLite (File-based: `resistanceiq_dev.db`) | PostgreSQL (Managed Instance) | PostgreSQL 16 (Multi-AZ HA Cluster) |
| **Driver / Dialect** | `sqlite://` (via `sqlite3`) | `postgresql+psycopg2://` | `postgresql+psycopg2://` (with PgBouncer) |
| **SSL Enforcement** | Disabled (Localhost) | `sslmode=require` | `sslmode=verify-full` |
| **Current Migration Revision** | `003_user_auth_lifecycle_schema` | `003_user_auth_lifecycle_schema` | `003_user_auth_lifecycle_schema` |
| **Fail-Fast Startup Rule** | Defaults to `resistanceiq_dev.db` if unset | Fails startup if `DATABASE_URL` is missing | **FAILS STARTUP LOUDLY** if `DATABASE_URL` is missing or starts with `sqlite://` |
| **JWT Secret Enforcement** | Uses default development key if unset | Requires explicit 32+ char secret | **FAILS STARTUP** if default or < 32 char key is supplied |
| **Dev Fallback Auth** | Explicitly Disabled by Default | Strictly Prohibited (`401 Unauthorized`) | **STRICTLY PROHIBITED** (`401 Unauthorized`) |
| **Database Backup Strategy** | Atomic file copies (`.bak`) before migrations | Daily automated snapshots + 7-day PITR | Continuous WAL archiving + Multi-AZ replication + 30-day PITR |
| **Operational Status** | **OPERATIONAL (MIGRATED)** | **READY FOR PROVISIONING** | **READY FOR VALIDATION** |

---

## 3. Migration History & Schema Evolution

```
[001_initial_schema]
  ├── Baseline organizations, users, projects, molecules, targets, pests, forecasts, backtest_cases
  └── Created initial 9 columns on users table
        ↓
[002_data_ingestion_schema]
  ├── Added data_sources, dataset_versions, ingestion_runs, canonical_organisms, canonical_pesticides, resistance_cases
  └── Established scientific audit trail and APRD ingestion infrastructure
        ↓
[003_user_auth_lifecycle_schema] (CURRENT HEAD)
  ├── Added first_name, last_name, email_verified, last_login_at
  ├── Added password_reset_token, password_reset_expires_at, invitation_token, invitation_expires_at
  ├── Created indexes on reset and invitation tokens
  └── Safely migrated existing user full_name and administrator verification status without data loss
```

---

## 4. Current Users Table Schema Definition

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL REFERENCES organizations(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    first_name VARCHAR(64),
    last_name VARCHAR(64),
    full_name VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'ANALYST',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    invitation_token VARCHAR(255),
    invitation_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_users_password_reset_token ON users(password_reset_token);
CREATE INDEX ix_users_invitation_token ON users(invitation_token);
```

---

## 5. Security & Isolation Invariants

1. **No Silent SQLite Fallback**: If `APP_ENV=production`, the application immediately raises a `ValueError` on startup if `DATABASE_URL` is empty, invalid, or pointing to SQLite.
2. **Zero Plaintext Passwords**: Password verification uses industry-standard Bcrypt with unique salts.
3. **Multi-Tenant Organization Scoping**: All project, forecast, and molecule queries are strictly scoped to `current_user.organization_id`.
4. **Sanitized Error Responses**: Internal database exceptions and SQL traces are logged securely to server logs and masked behind HTTP 500 status codes with actionable messages.
