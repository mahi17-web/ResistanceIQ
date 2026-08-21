# ResistanceIQ — Step 27 Production Deployment Checklist & Gate Controls

**System**: ResistanceIQ AI-Powered Pesticide Resistance Forecasting Platform  
**Target Environment**: Production (Edge Frontend + Containerized ASGI Backend + Managed PostgreSQL)  
**Governance Requirement**: RESEARCH / VALIDATION MODE (Model Status: REQUIRES VALIDATION)  

---

## 1. Pre-Deployment Verification Gate

- [x] **GitHub Repository Clean**: Working tree clean, all files tracked or safely ignored.
- [x] **Zero Secret Leakage**: Comprehensive scan confirmed no hardcoded JWT secrets, SMTP passwords, API keys, or private keys.
- [x] **Environment Variable Template**: `.env.example` verified with safe, complete placeholders.
- [x] **Database Engine Ready**: PostgreSQL 15+ supported with connection pooling and URL normalization.
- [x] **Alembic Migrations Validated**: Schema migrations (`001` through `005`) verified for forward compatibility.
- [x] **SMTP Configuration Configured**: `resistanceiq69@gmail.com` with fail-closed security in production.
- [x] **CORS & Security Headers Configured**: Strict `allow_origins`, HSTS, nosniff, frame DENY, referrer policy.
- [x] **Model Checksum Verified**: `v2.0.0-gbrt-ecfp4.joblib` SHA256 matches `6fc915fa26716dc4a06bad71f586af95ee071acf11e9a5b8acdc5171fed55622`.
- [x] **Backend & Security Test Suites**: 171 tests passed (100% PASS rate in `pytest`).
- [x] **Frontend Production Build**: Vite 6 bundle built cleanly in $< 3$ seconds with 0 ESLint errors.
- [x] **Containerization Ready**: Non-root `Dockerfile` and `.dockerignore` configured.
- [x] **Continuous Integration Pipeline**: `.github/workflows/ci.yml` configured for automatic PR and push validation.

---

## 2. Deployment Execution Gate

- [ ] **Infrastructure Provisioning**:
  - [ ] Managed PostgreSQL 15+ provisioned with automated daily backups.
  - [ ] Container runtime (AWS ECS / Fargate / Google Cloud Run / Render / Kubernetes) provisioned.
  - [ ] Static hosting (Vercel / Netlify / Cloudflare Pages) provisioned.
- [ ] **Environment Injections**:
  - [ ] Injected production `DATABASE_URL` into secret manager.
  - [ ] Injected strong 64-char `JWT_SECRET` and `JWT_REFRESH_SECRET`.
  - [ ] Injected production `SMTP_PASSWORD` for `resistanceiq69@gmail.com`.
  - [ ] Configured `FRONTEND_URL` and `VITE_API_BASE_URL`.
- [ ] **Schema Migration Execution**:
  - [ ] Run `alembic upgrade head` on production database.
  - [ ] Verify `alembic current` matches latest migration `005`.
- [ ] **Service Launch & Health Probes**:
  - [ ] Launch backend container and verify `GET /health` returns `{"status": "HEALTHY"}`.
  - [ ] Verify `GET /health/ready` returns `{"status": "ready", "database": "ok", "model": "ok", "email": "configured"}`.

---

## 3. Post-Deployment Verification Gate

- [ ] **Authentication Lifecycle Verification**:
  - [ ] Register new test researcher account on production domain.
  - [ ] Verify JWT login and token refresh flows.
  - [ ] Execute Forgot Password flow via live SMTP dispatch to external mailbox.
  - [ ] Verify OTP verification and password reset success.
- [ ] **Scientific Forecasting Pipeline Smoke Test**:
  - [ ] Navigate to `/new-candidate`.
  - [ ] Execute Crop $\to$ Pest $\to$ Target $\to$ Structure cascade.
  - [ ] Run resistance forecast; verify conformal intervals and applicability domain gating.
- [ ] **Export & Dossier Generation**:
  - [ ] Generate PDF research dossier; verify model provenance metadata and cryptographic hash.
- [ ] **Telemetry & Security Observability**:
  - [ ] Verify structured JSON request logging in centralized log aggregator.
  - [ ] Confirm zero cleartext passwords or OTP codes in logs.
  - [ ] Verify research-mode scientific disclaimer is visible across all user interfaces.
