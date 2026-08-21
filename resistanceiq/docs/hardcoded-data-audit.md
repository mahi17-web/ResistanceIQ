# ResistanceIQ — Hardcoded Value Audit & Traceability Report

## 1. Classification Methodology

Every value detected across UI templates was categorized into one of three classifications:
1. **STATIC UI**: Layout titles, button labels, and design tokens $\to$ **RETAINED AS UI STRUCTURE**.
2. **DYNAMIC STATUS / SCIENTIFIC METRIC**: Model versions, durability scores, error margins, and health states $\to$ **CONNECTED TO REAL LIVE BACKEND APIS**.
3. **MOCK / DEMO DATA**: Pre-baked mock forecast records and synthetic arrays $\to$ **COMPLETELY REMOVED**.

---

## 2. Hardcoded Values Audit Matrix

| Identifier / Value | Location | Classification | Action Taken | Real Data Source |
|---|---|---|---|---|
| `"ResistanceIQ · Intelligence Platform"` | `Dashboard.jsx`, `App.tsx` | **STATIC UI** | Retained | N/A (Editorial Header) |
| `"v0.3-mvp"` | `Backtest.jsx`, `Settings.jsx` | **DYNAMIC STATUS** | Removed hardcode | `GET /api/v1/forecasts/models` $\to$ `v1.0.0-ridge-ecfp4` |
| `"Online"` | `Backtest.jsx`, `Dashboard.jsx` | **DYNAMIC STATUS** | Removed hardcode | `GET /api/v1/system/health` $\to$ real status |
| `69, 81, 43, 58, 54` | `mockData.js` | **DEMO DATA** | Removed hardcode | `POST /api/v1/forecasts/evaluate` $\to$ real Ridge scoring |
| `0.77y MAE, 87.5%` | `Backtest.jsx` | **SCIENTIFIC METRIC** | Removed hardcode | `GET /api/v1/backtests` $\to$ real cross-validation metrics |
| `['Dr. Priya Mehta', ...]` | `Settings.jsx` | **DEMO DATA** | Removed hardcode | `GET /api/v1/settings/team` $\to$ live team members |
| `['riq_prod_sk_...', ...]` | `Settings.jsx` | **DEMO DATA** | Removed hardcode | `GET /api/v1/settings/api-keys` $\to$ real SHA-256 hashed keys |
