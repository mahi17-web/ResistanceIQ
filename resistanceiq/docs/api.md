# ResistanceIQ — API Reference (v1)

## Base URL
`/api/v1`

---

## Authentication
All protected routes require a Bearer token in the `Authorization` header:
`Authorization: Bearer <JWT_TOKEN>`

---

## Endpoint Groups

### 1. System & Health
- `GET /api/v1/system/health`: Service health check, uptime, DB connectivity, model registry readiness.
- `GET /api/v1/system/info`: Platform metadata, build version, environment.

### 2. Authentication
- `POST /api/v1/auth/login`: Form-encoded/JSON login returning JWT token.
- `POST /api/v1/auth/logout`: Invalidate session.
- `GET /api/v1/auth/me`: Current user profile and permissions.

### 3. Dashboard
- `GET /api/v1/dashboard/summary`: Live statistical counts (total projects, active forecasts, average durability, validated backtest count). Returns empty states when database is unpopulated.

### 4. Projects & Candidates
- `GET /api/v1/projects`: List organization projects.
- `POST /api/v1/projects`: Create new research project.
- `GET /api/v1/projects/{id}`: Detailed project view with associated candidates.
- `GET /api/v1/candidates`: List all candidate molecules under evaluation.

### 5. Molecules, Targets & Pests
- `GET /api/v1/molecules`: Retrieve registered chemical structures and SMILES.
- `POST /api/v1/molecules`: Register new molecule with SMILES validation.
- `GET /api/v1/targets`: List biological protein targets (AChE1, GluCl, VGSC, RyR) with UniProt IDs and binding pockets.
- `GET /api/v1/pests`: List pest species with generation times and mutation rates.

### 6. Forecasts & Comparison
- `POST /api/v1/forecasts`: Submit a new forecast pipeline job (molecule + target + pest).
- `GET /api/v1/forecasts/{id}`: Retrieve forecast status, durability score, and resistance trajectory curve.
- `GET /api/v1/comparison`: Multi-candidate resistance trajectory comparison data.

### 7. Backtest & Model Validation
- `GET /api/v1/backtests`: Historical validation cases (APRD / IRAC) and model MAE accuracy metrics.

### 8. Reports & Settings
- `GET /api/v1/reports`: List generated reports.
- `POST /api/v1/reports/generate`: Generate and export PDF / CSV research dossiers.
- `GET /api/v1/settings/org`: Organization settings.
- `GET /api/v1/settings/team`: Team member roster and role assignments.
- `GET /api/v1/settings/api-keys`: API keys management.
