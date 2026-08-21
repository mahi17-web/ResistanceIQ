# ResistanceIQ — User Acceptance Testing (UAT) Scorecard

## 1. Overall Acceptance Determination

> ### **UAT CLASSIFICATION: `PRIVATE BETA READY`**

---

## 2. Evaluation Scorecard by Dimension

| Dimension | Evaluation | Evidence & Validation Notes |
|---|:---:|---|
| **Navigation & Layout** | **PASS** | Minimal 72px/240px navigation rail with fluid transitions, command palette (`⌘K`), and zero layout shifts. |
| **Onboarding & First Experience** | **PASS** | Clear empty states on Dashboard and Projects guiding new users to create their first discovery pipeline. |
| **Candidate Analysis Workflow (Journey A)** | **PASS** | Instant RDKit molecular featurization, Ridge inference, 90% conformal intervals, and real-time out-of-domain checks. |
| **Candidate Comparison Workflow (Journey B)** | **PASS** | Multi-candidate selection with comparative durability curves, mutation hotspot tables, and distinct chart legends. |
| **Model Validation & Backtests (Journey C)** | **PASS** | Transparent display of active model version `v1.0.0-ridge-ecfp4`, cross-validation metrics, and historical cases. |
| **Dossier & Report Generation (Journey D)** | **PASS** | PDF and CSV export with full provenance, timestamps, target species, and scientific methodology disclaimers. |
| **Settings & Role Permissions (Journey E)** | **PASS** | Strict RBAC enforcement (`ADMIN`, `ANALYST`, `VIEWER`), one-time API key secret reveal, and team roster management. |
| **Search & Discovery** | **PASS** | Real-time project and candidate search with keyboard navigation. |
| **Error Recovery & Resilience** | **PASS** | Inline form validation for chemical syntax errors, network timeout handling, and correlation ID tracking on 5xx errors. |
| **Accessibility & Contrast** | **PASS** | High-contrast scientific palette (dark slate `#0a0e17` with emerald and cyan accents), ARIA labels, and keyboard focus outlines. |
| **Mobile & Responsive Layout** | **PASS** | Responsive grid wrapping down to 390px viewport width without horizontal clipping or broken controls. |
| **Scientific Communication** | **PASS** | Clear distinction between observed historical bioassays and model-predicted intervals; zero claims of 100% certainty. |
