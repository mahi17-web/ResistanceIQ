# ResistanceIQ — Frontend Demo & API Integration Audit

## 1. Executive Summary

This audit catalogs all frontend components, identifying legacy hardcoded mock variables, demo strings, and placeholder behaviors to ensure complete migration to authoritative FastAPI endpoints and PostgreSQL/ML models.

---

## 2. Comprehensive Component Audit

| Page / Component | Former Mock / Demo Element | authoritative Backend API Endpoint | Migration & Real Data Status |
|---|---|---|:---:|
| **Dashboard (`Dashboard.tsx`)** | Static statistics cards | `GET /api/v1/dashboard/summary` | **REAL API CONNECTED** |
| **Dashboard (`Dashboard.tsx`)** | Demo project list | `GET /api/v1/projects` | **REAL API CONNECTED** |
| **Dashboard (`Dashboard.tsx`)** | Demo forecast cards | `GET /api/v1/forecasts` | **REAL API CONNECTED** |
| **TopBar (`TopBar.tsx`)** | Hardcoded `"ONLINE"` badge | `GET /api/v1/system/health` | **REAL API CONNECTED** |
| **TopBar (`TopBar.tsx`)** | Hardcoded user email/initials | `GET /api/v1/auth/me` | **REAL API CONNECTED** |
| **New Candidate (`NewCandidate.tsx`)** | Hardcoded model `"v0.3-mvp"` | `GET /api/v1/forecasts/models` | **REAL API CONNECTED** |
| **New Candidate (`NewCandidate.tsx`)** | Unvalidated prediction estimates | `POST /api/v1/forecasts/evaluate` | **REAL API CONNECTED** |
| **New Candidate (`NewCandidate.tsx`)** | Static forecast creation | `POST /api/v1/forecasts` | **REAL API CONNECTED** |
| **Comparison (`Comparison.tsx`)** | Hardcoded forecast selection | `GET /api/v1/forecasts` | **REAL API CONNECTED** |
| **Comparison (`Comparison.tsx`)** | Decorative probability curves | `Forecast.risk_trajectory_json` | **REAL API CONNECTED** |
| **Backtest (`Backtest.tsx`)** | Static benchmark tables | `GET /api/v1/backtests` | **REAL API CONNECTED** |
| **Reports (`Reports.tsx`)** | Static PDF/CSV mock rows | `GET /api/v1/reports` & `POST /api/v1/reports/generate` | **REAL API CONNECTED** |
| **Settings (`Settings.tsx`)** | Hardcoded org `"Bindwell Bio"` | `GET /api/v1/settings/org` | **REAL API CONNECTED** |
| **Settings (`Settings.tsx`)** | Hardcoded team list | `GET /api/v1/settings/team` | **REAL API CONNECTED** |
| **Settings (`Settings.tsx`)** | Static ML engine details | `GET /api/v1/forecasts/models` | **REAL API CONNECTED** |
| **Command Palette (`CommandPalette.tsx`)** | Static navigation and projects | Live Query Client Cache | **REAL API CONNECTED** |

---

## 3. Zero Fallback to Fake Data Rule

In accordance with Step 7 requirements:
1. When queries are loading, components display **structured skeleton animations**.
2. When query results are empty ($N=0$), components display **honest scientific empty states**.
3. When network or backend errors occur, components display **actionable error states with retry controls** rather than fallback mock arrays.
