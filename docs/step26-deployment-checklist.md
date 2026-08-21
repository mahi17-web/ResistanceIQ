# ResistanceIQ — Step 26 Production Deployment Checklist

## Pre-Deployment Verification Checklist

### 1. Environment & Configuration
- [x] Copy `.env.example` to production `.env`.
- [x] Configure `APP_ENV=production`.
- [x] Set strong, random `JWT_SECRET` ($\ge 32$ characters).
- [x] Configure PostgreSQL `DATABASE_URL` (e.g. `postgresql://...`).
- [x] Configure authenticated `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, and `SMTP_PASSWORD` (or transactional `EMAIL_API_KEY`).
- [x] Ensure `EMAIL_PROVIDER != dev`.

### 2. ML Model & Storage Integrity
- [x] Verify model artifact exists: `resistanceiq/storage/models/v2.0.0-gbrt-ecfp4.joblib`.
- [x] Verify SHA-256 matches `6fc915fa26716dc4a06bad71f586af95ee071acf11e9a5b8acdc5171fed55622`.
- [x] Verify estimator feature count is exactly 1059.
- [x] Ensure `storage/reports` and `storage/models` directories have proper read/write permissions.

### 3. Backend & API Services
- [x] Run automated test suite: `python -m pytest resistanceiq/tests/ -v` (171 / 171 passed).
- [x] Verify `/health` and `/health/ready` endpoints return 200 OK.
- [x] Confirm CORS origins match frontend domain (`BACKEND_CORS_ORIGINS`).
- [x] Verify HTTPS and HSTS headers are active.

### 4. Frontend Application
- [x] Build production bundle: `npm run build` (vite build succeeds).
- [x] Verify scientific governance banner displays `RESEARCH / VALIDATION MODE`.
- [x] Confirm forgot password OTP flow connects cleanly to backend.

### 5. Security & Post-Deployment Validation
- [x] Verify `.gitignore` excludes `.env`, `*.db`, `storage/dev_emails/`.
- [x] Test unauthenticated and cross-tenant access rejection.
- [x] Dispatch test password reset email to verify SMTP delivery.
