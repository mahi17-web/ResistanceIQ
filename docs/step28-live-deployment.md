# ResistanceIQ — Step 28 Live Production Deployment Manual & Operational Ledger

**Date**: August 2026  
**Status**: DEPLOYMENT IN PROGRESS / PENDING CLOUD PROVISIONING  
**Target Stack**: Supabase PostgreSQL + Render Backend (Docker) + Vercel Frontend (Vite)  

---

## 1. Live Deployment Ledger (Actual URLs)

| Layer | Provider | Deployed URL | Status | Verified At |
|---|---|---|---|---|
| **Database** | Supabase | `aws-0-*.pooler.supabase.com:6543` / `db.*.supabase.co:5432` | PENDING PROVISIONING | — |
| **Backend API** | Render | `https://<service-name>.onrender.com` | PENDING PROVISIONING | — |
| **Frontend UI** | Vercel | `https://<project-name>.vercel.app` | PENDING PROVISIONING | — |

---

## 2. Phase 1 — Supabase PostgreSQL Setup & Migration

### Step 1.1: Create Project on Supabase
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Click **New Project** $\to$ Name: `resistanceiq-prod` $\to$ Set database password.
3. Select region closest to your Render deployment region.

### Step 1.2: Obtain Connection String
1. In Supabase Dashboard, go to **Project Settings** $\to$ **Database** $\to$ **Connection string**.
2. Select **URI** (or **Transaction Pooler / Session Pooler**).
3. Copy URI (e.g. `postgresql://postgres:[YOUR-PASSWORD]@db.[REF].supabase.co:5432/postgres` or pooler `...:6543/postgres`).

### Step 1.3: Execute Alembic Migrations
Run the versioned migration suite against your Supabase database:
```bash
# In local terminal:
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[REF].supabase.co:5432/postgres?sslmode=require"
cd resistanceiq/backend
alembic upgrade head
```

---

## 3. Phase 2 — Render Backend Deployment

### Step 2.1: Create Web Service on Render
1. Go to [https://dashboard.render.com](https://dashboard.render.com).
2. Click **New +** $\to$ **Web Service**.
3. Connect GitHub repository `https://github.com/mahi17-web/ResistanceIQ.git`.
4. Configure service:
   - **Name**: `resistanceiq-api`
   - **Language / Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Context**: `.`
   - **Region**: (e.g., Oregon / Frankfurt / Singapore)
   - **Instance Type**: `Starter` (or Free)

### Step 2.2: Add Environment Variables in Render Dashboard
Under **Environment Variables**, add the following:

| Key | Value | Notes |
|---|---|---|
| `APP_ENV` | `production` | Enables strict production fail-closed security |
| `DATABASE_URL` | `postgresql://...` | Supabase URI with password |
| `JWT_SECRET` | *(64-character random string)* | Symmetric token signing key |
| `JWT_REFRESH_SECRET` | *(64-character random string)* | Separate refresh token key |
| `FRONTEND_URL` | `https://<your-vercel-app>.vercel.app` | Vercel domain |
| `CORS_ORIGINS` | `["https://<your-vercel-app>.vercel.app"]` | CORS whitelist |
| `EMAIL_PROVIDER` | `smtp` | Production email transport |
| `SMTP_HOST` | `smtp.gmail.com` | Gmail SMTP host |
| `SMTP_PORT` | `587` | STARTTLS port |
| `SMTP_USERNAME` | `resistanceiq69@gmail.com` | Sender username |
| `SMTP_PASSWORD` | *(16-char Gmail App Password)* | Google Account App Password |
| `SMTP_FROM_EMAIL` | `resistanceiq69@gmail.com` | Sender email |
| `SMTP_FROM_NAME` | `ResistanceIQ Security` | Sender display name |
| `SMTP_USE_TLS` | `true` | STARTTLS enabled |
| `MODEL_VERSION` | `v2.0.0-gbrt-ecfp4` | Active benchmark model |
| `MODEL_ARTIFACT_PATH` | `resistanceiq/storage/models/v2.0.0-gbrt-ecfp4.joblib` | Model path |
| `MODEL_ARTIFACT_SHA256` | `6fc915fa26716dc4a06bad71f586af95ee071acf11e9a5b8acdc5171fed55622` | Checksum verification |
| `ALLOW_SQLITE_IN_PROD` | `false` | Rejects fallback to SQLite |
| `ALLOW_DEV_SEEDING` | `false` | Prevents dev data in production DB |

### Step 2.3: Deploy & Verify Health
Once Render completes building and running the container:
1. Verify `GET https://<your-render-url>.onrender.com/health` returns `200 OK`.
2. Verify `GET https://<your-render-url>.onrender.com/health/ready` returns `200 OK` with `status: ready`.

---

## 4. Phase 3 — Vercel Frontend Deployment

### Step 3.1: Import Project to Vercel
1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Import `https://github.com/mahi17-web/ResistanceIQ.git`.
3. Configure project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3.2: Configure Environment Variables in Vercel
Under **Environment Variables**:
- `VITE_API_BASE_URL`: `https://<your-render-url>.onrender.com`

### Step 3.3: Deploy
1. Click **Deploy**.
2. Once deployed, note the production URL (e.g. `https://resistanceiq.vercel.app`).
3. Update `FRONTEND_URL` and `CORS_ORIGINS` in your Render Web Service to match this Vercel URL.
