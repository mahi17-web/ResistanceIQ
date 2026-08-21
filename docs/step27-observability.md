# ResistanceIQ — Step 27 Production Observability & Telemetry Architecture

**Subsystem**: ResistanceIQ Structured Observability & Metrics Engine  
**Logging Format**: JSON Structured Output with Request-ID Tracing  
**Telemetry Scope**: Latency distribution, HTTP status codes, ML inference durability, and OOD event frequency  

---

## 1. Request Tracing & Correlation IDs

Every inbound HTTP request to the FastAPI backend is assigned a unique, cryptographically random correlation ID:
- **Format**: `req_<12-hex-characters>` (e.g. `req_7f2b91c0e481`)
- **Header Propagation**: Returned to caller in `X-Request-ID` response header.
- **Log Binding**: Every subsequent structured log entry associated with that request contains `"request_id"`.

### Example Structured Request Log:
```json
{
  "event": "http_request",
  "request_id": "req_84a1bc093e11",
  "method": "POST",
  "path": "/api/v1/forecast/predict",
  "status_code": 200,
  "duration_ms": 42.18
}
```

---

## 2. Sensitive Data Redaction Invariants

The logging pipeline strictly enforces data sanitation:
1. **Passwords**: Plaintext passwords in `/auth/login`, `/auth/register`, and `/auth/reset-password` are never logged.
2. **OTP Codes**: Single-use 6-digit recovery codes are never written to standard logs.
3. **JWT Tokens**: Bearer authorization headers and refresh tokens are excluded from log outputs.
4. **SMTP Passwords**: SMTP credentials are never serialized in diagnostic logs.
5. **PII**: User addresses, tenant records, and personal identification details are omitted from telemetry streams.

---

## 3. Real-Time Telemetry & Health Metrics

The in-memory `MetricsCollector` tracks operational performance:
- **Traffic Breakdown**: Request counts by HTTP status code bucket (`2xx`, `4xx`, `5xx`).
- **Endpoint Latencies**: 95th and 99th percentile execution times.
- **ML Inference Monitoring**: Total forecasts, inference latency (avg ms), out-of-domain (OOD) flag counts, and model version breakdown.
- **Telemetry Endpoint**: `GET /api/v1/telemetry/metrics` (Admin / Lead Scientist role access).
