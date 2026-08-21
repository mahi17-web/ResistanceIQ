# ResistanceIQ — Production Incident Response & Alerting Protocol

## 1. Alert Severity Matrix

| Severity Level | Response SLA | Trigger Conditions | Notification Channel |
|---|---|---|---|
| **CRITICAL** | $\le 15\text{ mins}$ | API Down (5xx $> 5\%$), Database unreachable, Corrupted active model binary | PagerDuty / Ops Phone Call / Slack `#incident-critical` |
| **HIGH** | $\le 1\text{ hour}$ | Ingestion pipeline failure, Conformal inference failure spike, Storage $> 90\%$ | Slack `#ops-alerts` + Email |
| **MEDIUM** | $\le 4\text{ hours}$ | Data freshness delay $> 7$ days, Elevated 4xx validation errors | Slack `#ops-warnings` |
| **LOW** | Next Business Day | Non-critical deprecation warning, Sub-optimal cache hit rate | Daily digest report |

---

## 2. Six-Phase Incident Lifecycle

1. **Detection**: Automated health check alert or operator monitoring anomaly on `/api/v1/admin/operational-status`.
2. **Triage**: Assign Incident Commander and identify blast radius (tenant isolation intact vs compromised).
3. **Containment**: Route traffic to maintenance page or roll back to last verified stable container version.
4. **Resolution**: Apply root cause patch or execute database disaster restore playbook.
5. **Verification**: Execute full automated smoke test suite `pytest tests/test_step8_production_qa.py`.
6. **Post-Incident Review (PIR)**: Publish blameless RCA within 48 hours.
