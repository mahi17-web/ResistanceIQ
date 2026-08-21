# ResistanceIQ — Internal Operations Dashboard Specification

## 1. Scope & Access Control

The Internal Operations Dashboard provides real-time infrastructure, ML telemetry, and data ingestion health exclusively to authorized platform administrators (`ADMIN` role).

Endpoint: `GET /api/v1/admin/operational-status`

---

## 2. Dashboard Sections & Real Data Fields

1. **Subsystem Status Indicators**:
   - `API`: `OPERATIONAL` (FastAPI ASGI worker status).
   - `Database`: `OPERATIONAL` (PostgreSQL ping latency).
   - `ML Inference`: `OPERATIONAL` (Active model loader status).
   - `Storage`: `OPERATIONAL` (Persistent reports volume).
2. **Active Scientific Model**:
   - Model version (e.g. `v1.0.0-ridge-ecfp4`).
   - SHA-256 integrity hash.
   - Formal validation status (`DEVELOPMENT_ONLY` / `PRODUCTION`).
3. **Last Scientific Data Ingestion**:
   - Ingestion timestamp.
   - Records seen, accepted, and rejected.
4. **Live Telemetry Counters**:
   - Total HTTP request count and status distribution.
   - Total forecast executions, out-of-domain queries, and average inference latency.
5. **Recent Security & Audit Events**:
   - Top 10 recent administrative and mutation logs from `activity_logs`.
