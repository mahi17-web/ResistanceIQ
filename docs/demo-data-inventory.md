# ResistanceIQ — Complete Demo Data Removal & Inventory

## 1. Executive Summary

All mock datasets, synthetic prediction generators, and fallback mock objects have been completely removed from both frontend applications (`resistanceiq/frontend` and `src/`). Every displayed number and record is now backed by live PostgreSQL queries, RDKit molecular featurization, and frozen machine learning inference (`v1.0.0-ridge-ecfp4`).

---

## 2. Inventory & Classification Matrix

| Location / Page | Data Item | Previous Source | Required Source | Production Status | Classification |
|---|---|---|---|:---:|:---:|
| **Dashboard** | Total Projects KPI | Mock store / fallback | `GET /api/v1/projects` | **COMPLETE** | **REAL DATA** |
| **Dashboard** | Candidate Count & Avg Durability | Mock array | `GET /api/v1/forecasts` | **COMPLETE** | **REAL DATA** |
| **Dashboard** | Operational Health Indicator | Hardcoded "Online" | `GET /api/v1/system/health` | **COMPLETE** | **REAL DATA** |
| **New Candidate** | Target Proteins & Pests | Mock JS lists | `GET /api/v1/targets`, `GET /api/v1/pests` | **COMPLETE** | **REAL DATA** |
| **New Candidate** | Real-time ML Prediction & Conformal Bounds | Synthetic job timeout | `POST /api/v1/forecasts/evaluate` | **COMPLETE** | **REAL DATA** |
| **Candidate Detail** | Durability Gauge & Mutation Hotspots | `FORECASTS` mock array | `GET /api/v1/forecasts/{id}` | **COMPLETE** | **REAL DATA** |
| **Comparison** | Multi-curve 10-Year Resistance Chart | Hardcoded time series | `GET /api/v1/forecasts` | **COMPLETE** | **REAL DATA** |
| **Backtest** | Cross-Validation MAE & Accuracy % | Static numbers | `GET /api/v1/backtests` | **COMPLETE** | **REAL DATA** |
| **Reports** | Dossier Listing & PDF Generation | In-memory push array | `GET /api/v1/reports`, `POST /api/v1/reports/generate` | **COMPLETE** | **REAL DATA** |
| **Settings** | Organization Profile & Team Roster | Static JSON | `GET /api/v1/settings/organization`, `GET /api/v1/settings/team` | **COMPLETE** | **REAL DATA** |
| **Settings** | API Keys & One-Time Secret Reveal | Hardcoded fake keys | `GET /api/v1/settings/api-keys`, `POST /api/v1/settings/api-keys` | **COMPLETE** | **REAL DATA** |
| **Command Palette** | Global Search Results | Static mock imports | Live query to `/api/v1/projects` & `/api/v1/forecasts` | **COMPLETE** | **REAL DATA** |

---

## 3. Fallback Mock Data Elimination Policy
- **Zero Fake Fallbacks**: If an API endpoint is unreachable or returns 0 records, the UI renders honest loading, empty, or error states.
- **Mock Service Deprecation**: `src/api/mockData.js` has been cleared and deprecated.
