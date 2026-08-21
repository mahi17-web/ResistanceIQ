# ResistanceIQ — Production Deployment Architecture

## 1. System Overview

ResistanceIQ is deployed as a high-performance, cost-effective containerized application designed for enterprise agrochemical research. The architecture emphasizes operational simplicity, low latency, robust data isolation, and cryptographic reproducibility.

```text
                                INTERNET
                                    │
                                    ▼
                         [ HTTPS / TLS 1.3 ]
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
      [ FRONTEND HOST / CDN ]             [ BACKEND API HOST ]
      app.resistanceiq.example.com        api.resistanceiq.example.com
      (Nginx / Static Web)                (FastAPI ASGI / Uvicorn)
                                                    │
                                   ┌────────────────┼────────────────┐
                                   │                │                │
                                   ▼                ▼                ▼
                           [ PostgreSQL 16 ]  [ ML Engine ]  [ Object Storage ]
                           (Multi-Tenant DB)  (Embedded)     (Dossiers & Models)
```

---

## 2. Component Specifications

### 2.1 Frontend Tier (`frontend`)
- **Technology**: React 19 SPA + Vite + Tailwind/Vanilla Design System + Nginx Alpine.
- **Hosting**: Static edge CDN with HTTPS reverse proxy.
- **Asset Strategy**: Gzip/Brotli compressed, immutable content-hashed bundles.
- **Routing**: Client-side history pushState with fallback to `/index.html`.

### 2.2 Backend & Embedded ML Tier (`backend`)
- **Technology**: FastAPI (Python 3.11) + Uvicorn ASGI workers.
- **Inference Mode**: Embedded single-process in-memory scoring engine (`ml.inference.predictor`).
- **Concurrency**: 4 Uvicorn workers behind Gunicorn process manager.
- **Health Checks**: Synchronous `/api/v1/system/health` checking database connectivity and ML artifact integrity.

### 2.3 Database Tier (`postgres`)
- **Technology**: PostgreSQL 16+.
- **Isolation**: Tenant foreign key constraints on every table (`organization_id`).
- **Connection Management**: Connection pooling with recycle timeouts and automatic reconnections.

### 2.4 Persistent Storage Tier
- **Model Registry**: Local ephemeral volume backed by S3/GCS version-locked bucket.
- **Report Archives**: Local persistent volume `report_storage` mounted at `/app/storage/reports`.

---

## 3. Network Topology & Ports

| Service | Internal Port | External Port | Protocol | Access Level |
|---|:---:|:---:|:---:|---|
| **Frontend Nginx** | 80 | 80 / 443 | HTTP / HTTPS | Public |
| **FastAPI Backend** | 8000 | N/A (Proxied) | HTTP | Internal Docker Network |
| **PostgreSQL** | 5432 | N/A (Internal) | TCP / SSL | Internal Docker Network |
