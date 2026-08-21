# ResistanceIQ — Step 27 Pre-Deployment Architecture & Infrastructure Audit

**Document Status**: COMPLETED  
**Date**: August 2026  
**Repository Branch**: `main`  
**Remote**: `https://github.com/mahi17-web/ResistanceIQ.git`  
**Scientific Governance**: REQUIRES VALIDATION  
**Operational Mode**: RESEARCH / VALIDATION MODE  

---

## 1. Executive Summary

This pre-deployment audit evaluates the complete ResistanceIQ codebase, runtime environment, data boundaries, and infrastructure interfaces ahead of production deployment. The objective is to establish an immutable, secure, reproducible production deployment architecture while preserving the locked ML model (`v2.0.0-gbrt-ecfp4.joblib`), zero mock predictions, research governance, and enterprise authentication controls.

---

## 2. Current Architecture & Component Topology

```mermaid
flowchart TB
    subgraph Client_Layer [Frontend Static Hosting]
        SPA[React 18 SPA + Vite 6]
        Vercel[Static Edge / CDN]
    end

    subgraph Gateway_Layer [Backend API Container]
        FastAPI[FastAPI ASGI Application]
        Uvicorn[Uvicorn Production Server]
        AuthMW[Auth / RBAC Middleware]
        Telemetry[Correlation ID & Rate Limiting]
    end

    subgraph Intelligence_Core [Scientific Core]
        Parser[SMILES / RDKit Pipeline]
        OOD[Applicability Domain Gate]
        ModelLoader[Locked Model Registry Singleton]
        Conformal[Conformal Risk Estimator]
    end

    subgraph Persistence_Layer [Production Data Store]
        PG[(PostgreSQL Database)]
        Alembic[Alembic Migration Engine]
        Models[(Locked Joblib Artifacts)]
    end

    subgraph External_Services [Transactional Transports]
        SMTP[External SMTP Gateway / Gmail SMTP]
    end

    SPA -->|HTTPS REST| FastAPI
    FastAPI --> AuthMW --> Telemetry
    Telemetry --> Intelligence_Core
    Telemetry --> Persistence_Layer
    Intelligence_Core --> Models
    FastAPI --> PG
    FastAPI --> SMTP
    Alembic -.-> PG
```

### Key System Components:
1. **Frontend**: Single-Page Application built with React 18, Vite 6, Tailwind CSS, Lucide React, and Recharts. Communicates with `/api/v1` via environment-driven `VITE_API_BASE_URL`.
2. **Backend**: FastAPI 0.110+ ASGI service running on Python 3.11+, providing token authentication, RBAC, crop-threat-target knowledge graph traversal, and ML forecast pipelines.
3. **ML Inference Core**: Local deterministic inference engine loading the immutable `v2.0.0-gbrt-ecfp4.joblib` artifact (SHA256: `6fc915fa26716dc4a06bad71f586af95ee071acf11e9a5b8acdc5171fed55622`), performing Tanimoto/Mahalanobis OOD gating and inductive split conformal prediction.
4. **Database Layer**: SQLAlchemy 2.0+ engine supporting PostgreSQL in production with connection pooling (`pool_size=10, max_overflow=20, pool_pre_ping=True`), with Alembic migration versioning (versions `001` through `005`).
5. **Transactional Email**: Pluggable SMTP engine with strict fail-closed security in production (disallowing local development mailboxes).

---

## 3. Runtime Requirements & Prerequisites

| Dimension | Development / Testing | Production Specification |
|---|---|---|
| **Python Runtime** | Python 3.11 – 3.14 | Python 3.11 (Debian Slim container) |
| **Node Runtime** | Node.js 18+ / npm 9+ | Node.js 20 LTS (Vite Static Build) |
| **Database** | SQLite 3 (`resistanceiq_dev.db`) | PostgreSQL 15+ (`DATABASE_URL`) |
| **ASGI Server** | `uvicorn --reload` | `uvicorn --host 0.0.0.0 --port 8000 --workers 2` |
| **Static Hosting** | Vite Local Dev Server (`:5173`) | Vercel / Netlify / Cloudflare Pages / Nginx |
| **Memory / CPU** | 2 CPU / 4 GB RAM | Minimum 2 vCPU / 4 GB RAM (ML feature memory) |
| **Storage** | Local disk | Read-only container root + ephemeral `/tmp` |

---

## 4. Environment Variables Audit

| Variable | Type | Purpose | Dev Default | Production Requirement |
|---|---|---|---|---|
| `APP_ENV` | `string` | Environment discriminator | `development` | `production` |
| `DATABASE_URL` | `string` | Database connection string | `sqlite:///./resistanceiq_dev.db` | `postgresql://user:pass@host:5432/dbname` (Mandatory) |
| `JWT_SECRET` | `string` | Symmetric signing secret | Test fallback | $\ge 32$ cryptographically random chars |
| `JWT_REFRESH_SECRET` | `string` | Separate refresh signing key | Optional | $\ge 32$ cryptographically random chars |
| `FRONTEND_URL` | `string` | Primary UI domain for CORS/reset links | `http://localhost:5173` | `https://app.resistanceiq.bio` |
| `CORS_ORIGINS` | `list[str]` | Allowed CORS origins | Localhost array | Explicit production frontend domain(s) |
| `SMTP_HOST` | `string` | Transactional SMTP server | `smtp.gmail.com` | Verified SMTP host |
| `SMTP_PORT` | `int` | SMTP port | `587` | `587` (STARTTLS) or `465` (SSL) |
| `SMTP_USERNAME` | `string` | SMTP account | `resistanceiq69@gmail.com` | Injected securely |
| `SMTP_PASSWORD` | `string` | SMTP App password | Injected via `.env` | Injected via secret store |
| `SMTP_FROM_EMAIL` | `string` | Sender email address | `resistanceiq69@gmail.com` | Injected securely |
| `SMTP_FROM_NAME` | `string` | Sender display name | `ResistanceIQ` | `ResistanceIQ` |
| `MODEL_ARTIFACT_SHA256` | `string` | Immutable artifact checksum | Hardcoded lock | `6fc915fa26716dc4a06bad71f586af95ee071acf11e9a5b8acdc5171fed55622` |
| `VITE_API_BASE_URL` | `string` | Frontend backend API URL | Empty (`/api/v1`) | `https://api.resistanceiq.bio` or same-origin |

---

## 5. Security & Isolation Audit

1. **Secret Leakage Elimination**:
   - Automated scan confirmed zero exposed secrets in tracked git repository files.
   - `.env`, `.env.*`, `*.db`, and `storage/dev_emails/` are strictly ignored by `.gitignore`.
2. **Production Fail-Closed Isolation**:
   - `APP_ENV=production` automatically disables development seeding (`ALLOW_DEV_SEEDING = False`).
   - SQLite is rejected at startup in production unless explicit override flag is present.
   - Development mailbox fallback is completely rejected when `APP_ENV=production`.
   - Weak JWT signing keys ($<32$ characters) cause immediate fatal configuration termination.
3. **Cryptographic Integrity**:
   - Model artifact `v2.0.0-gbrt-ecfp4.joblib` SHA256 checksum is validated against expected constant at startup and before inference.

---

## 6. Identified Deployment Blockers & Remediation

| Blocker | Severity | Status | Remediation in Step 27 |
|---|---|---|---|
| **Root CI/CD Workflow Missing** | High | Resolved | Create `.github/workflows/ci.yml` at repository root |
| **Backend Containerization Missing** | High | Resolved | Create multi-stage non-root `Dockerfile` and `.dockerignore` |
| **Docker Compose Missing** | Medium | Resolved | Create clean `docker-compose.yml` with Postgres and Backend |
| **SPA Static Routing Config Missing** | Medium | Resolved | Add `vercel.json` rewrite configuration for React Router |
| **Dynamic API Base URL in Frontend** | Low | Resolved | Client updated to check `import.meta.env.VITE_API_BASE_URL` |
| **Production Database Migration Docs** | Medium | Resolved | Document Alembic migration execution procedure |

---

## 7. Audit Sign-Off

The pre-deployment audit confirms that ResistanceIQ has a clean, decoupled architecture ready for containerized backend hosting and static frontend CDN distribution.
