# ResistanceIQ — Step 26 Observability, Logging & Telemetry

## 1. Request Correlation & Tracing
- **Middleware**: `CorrelationIdMiddleware` extracts or generates a unique `request_id` (`req_...`) for every incoming HTTP request.
- **Header Propagation**: The correlation ID is attached to the response in the `X-Request-ID` header.
- **Log Correlation**: All log entries, error responses, and audit records include the `request_id` for complete traceability.

---

## 2. Structured Operational Logging
Log entries are emitted as structured JSON objects:
- `event`: e.g. `http_request`, `forecast_inference`, `otp_dispatched`, `email_transport`.
- `request_id`: Correlation identifier.
- `method` & `path`: HTTP endpoint details.
- `status_code`: Response status.
- `duration_ms`: Latency benchmark in milliseconds.

---

## 3. Telemetry & Administrative Dashboards
- **Endpoint**: `/api/v1/admin/operational-status` (restricted to `ADMIN` role).
- **Tracked Metrics**:
  - Subsystem operational statuses: API, Database, ML Inference Service, Ingestion Cache.
  - Active model version (`v2.0.0-gbrt-ecfp4`) and feature dimensionality.
  - Ingestion run statistics and APRD dataset versioning.
  - Latency percentiles ($p_{50}, p_{95}, p_{99}$).

---

## 4. Health & Readiness Probes
- `GET /health`: Liveness probe returning platform online status and scientific governance status (`REQUIRES_VALIDATION`).
- `GET /health/ready`: Readiness probe verifying DB connection, ML model integrity, and email transport readiness with zero exposed secrets.
