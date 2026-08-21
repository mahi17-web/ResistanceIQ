# ResistanceIQ — Step 28 Cloud Infrastructure Topology & Architecture

**Deployment Target Approved**:
- **Backend API Gateway**: Render (Docker Runtime Web Service)
- **Frontend SPA**: Vercel (Edge Network / Static Build)
- **Production Database**: Supabase (Managed PostgreSQL 15+)
- **Transactional Mail**: Gmail SMTP (`resistanceiq69@gmail.com`) with App Password

---

## 1. Multi-Tier Production Architecture

```mermaid
flowchart TB
    subgraph Users_Layer [Clients & Researchers]
        Browser[Modern Web Browser / Mobile Device]
    end

    subgraph Vercel_Edge [Frontend Layer - Vercel]
        CDN[Vercel Global Edge Network]
        ReactSPA[React 18 / Vite 6 SPA]
        VercelConfig[vercel.json - SPA Rewrites & Headers]
    end

    subgraph Render_Cloud [Backend Layer - Render]
        RenderProxy[Render TLS / HTTPS Reverse Proxy]
        UvicornWorkers[Uvicorn ASGI Production Server]
        FastAPIApp[FastAPI v2.0.0 Application]
        AuthRBAC[JWT Authentication & RBAC]
        MLCore[In-Container ML Engine & Conformal Predictor]
        ModelDisk[(Locked Joblib v2.0.0-gbrt-ecfp4)]
    end

    subgraph Supabase_Cloud [Persistence Layer - Supabase]
        SupaPG[(PostgreSQL 15+ Database)]
        Pooling[Connection Pooler / Direct Connection]
        Migrations[Alembic Revisions 001 - 005]
    end

    subgraph External_Services [Transactional Mail]
        GmailSMTP[Gmail SMTP Gateway (smtp.gmail.com:587)]
    end

    Browser -->|HTTPS / TLS 1.3| CDN
    CDN --> ReactSPA
    ReactSPA -->|REST HTTPS /api/v1| RenderProxy
    RenderProxy --> UvicornWorkers
    UvicornWorkers --> FastAPIApp
    FastAPIApp --> AuthRBAC
    FastAPIApp --> MLCore
    MLCore --> ModelDisk
    FastAPIApp -->|SSL Encrypted DATABASE_URL| Pooling
    Pooling --> SupaPG
    FastAPIApp -->|STARTTLS :587| GmailSMTP
```

---

## 2. Component Specifications & Boundaries

### 1. Frontend (Vercel):
- **Source**: Root directory (`package.json`, `src/`, `index.html`)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variable**: `VITE_API_BASE_URL=https://<your-render-app>.onrender.com`
- **Routing**: `vercel.json` rewrites `/(.*)` $\to$ `/index.html`.

### 2. Backend (Render):
- **Runtime**: Docker (`Dockerfile`)
- **Port**: `8000`
- **Health Probes**: `GET /health` (liveness), `GET /health/ready` (readiness)
- **Model Storage**: Embedded immutable `/app/resistanceiq/storage/models/v2.0.0-gbrt-ecfp4.joblib`
- **User**: Non-root `riquser` (UID 1001)

### 3. Database (Supabase PostgreSQL):
- **Version**: PostgreSQL 15.x / 16.x
- **Connection URI**: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require` (or direct `:5432`)
- **Migrations**: Alembic (`001_initial_schema` $\to$ `005_production_auth_rbac_audit_schema`)

### 4. Transactional Mail:
- **Account**: `resistanceiq69@gmail.com`
- **Transport**: STARTTLS on port 587
- **Authentication**: 16-character Google Account App Password injected via Render Environment Secrets.
