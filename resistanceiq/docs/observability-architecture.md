# ResistanceIQ — Observability & Monitoring Architecture

## 1. Executive Summary

This architecture establishes end-to-end monitoring across all 9 subsystems of the ResistanceIQ platform: Application API, Multi-Tenant Database, Machine Learning Inference, Scientific Data Ingestion, Model Behavior, Report Generation, File Storage, and Authentication.

```text
                             RESISTANCEIQ PLATFORM
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
  [ API / FASTAPI ]             [ DATABASE / PG ]             [ ML INFERENCE ]
  • HTTP Status Distribution    • Connection Pool Latency     • Conformal Uncertainty Bounds
  • Request Correlation IDs     • Slow Query Tracking         • Morgan Tanimoto OOD Alerts
  • Endpoint Latency (p50/p99)  • Transaction Error Rates     • Microsecond Scoring Latency
        │                              │                              │
        └──────────────────────────────┼──────────────────────────────┘
                                       │
                                       ▼
                       [ TELEMETRY & AUDIT COLLECTOR ]
                                       │
                      ┌────────────────┴────────────────┐
                      │                                 │
                      ▼                                 ▼
         [ REAL-TIME OPERATIONAL ALERTS ]    [ INTERNAL ADMIN STATUS DASHBOARD ]
         (CRITICAL / HIGH / MEDIUM / LOW)    (/api/v1/admin/operational-status)
```

---

## 2. Telemetry Ingestion & Correlation IDs

Every incoming HTTP request receives or inherits a unique `X-Request-ID` (UUID4). This identifier is propagated across:
1. **HTTP Request Headers** (`X-Request-ID`).
2. **Structured JSON Logs** (`request_id`).
3. **Database Activity Logs** (`ActivityLog.details.request_id`).
4. **Error Response Payloads** (`{"detail": "...", "code": "...", "request_id": "..."}`).

---

## 3. Metrics Breakdown by Subsystem

| Subsystem | Metric Name | Type | Sampling / Window | Target SLA |
|---|---|---|---|---|
| **API** | `http_requests_total` | Counter | Cumulative | $99.9\%$ Success Rate |
| **API** | `http_request_duration_ms` | Histogram | Rolling 500 requests | $p95 < 25\text{ ms}$ |
| **ML** | `forecast_requests_total` | Counter | Cumulative | Zero silent crashes |
| **ML** | `inference_latency_ms` | Gauge | Rolling 1,000 queries | $< 1.5\text{ ms}$ |
| **ML** | `out_of_domain_rate` | Gauge | Cumulative $\%$ | Flagged if $> 20\%$ |
| **Database** | `db_pool_active_connections` | Gauge | Instantaneous | $< 80\%$ Pool Limit |
| **Ingestion** | `ingestion_records_accepted` | Counter | Per Ingestion Run | Validated against schema |
