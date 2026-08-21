# ResistanceIQ — Core User Personas & Requirements Matrix

## 1. Persona Definitions

### Persona 1: Dr. Elena Rostova — Senior Research Agrochemist (Lead Analyst)
- **Role & Background**: Lead discovery chemist synthesizing and testing novel insecticide and fungicide lead series.
- **Core Goals**:
  - Evaluate novel chemical structures for resistance risk before committing synthesis budget.
  - Understand whether candidate scaffolds are within the model's validated chemical domain ($T_{\max} \ge 0.40$).
  - Compare resistance emergence curves between 2–4 chemical analogs.
- **Key UX Requirements**:
  - Instant live molecular SMILES featurization and scoring preview.
  - Transparent conformal bounds $[\text{RR}_{\text{lower}}, \text{RR}_{\text{upper}}]$ rather than single-point estimates.
  - Unambiguous `OUT_OF_DOMAIN` alerts when testing novel chemotypes.

---

### Persona 2: Dr. Marcus Vance — Scientific Director (Scientific Lead)
- **Role & Background**: Head of Agrochemical R&D reviewing regulatory dossiers and discovery pipeline health.
- **Core Goals**:
  - Audit model validation metrics ($R^2$, MAE, conformal coverage) across historical field backtests.
  - Export audit-ready resistance risk PDF reports for regulatory and internal portfolio reviews.
  - Track active model versions (`v1.0.0-ridge-ecfp4`) and ensure no unapproved models are used in production.
- **Key UX Requirements**:
  - Clear separation between observed historical bioassays and model-predicted forecasts.
  - Comprehensive PDF report export with complete metadata, timestamps, and model limitations.

---

### Persona 3: Sarah Jenkins — Platform & Laboratory Administrator (Org Admin)
- **Role & Background**: Laboratory operations manager managing software access, API keys, and data integrity.
- **Core Goals**:
  - Invite team researchers with appropriate roles (`ADMIN`, `ANALYST`, `VIEWER`).
  - Generate programmatic API keys with strict one-time secret reveals.
  - Monitor system health, data ingestion provenance, and telemetry error rates.
- **Key UX Requirements**:
  - Clear role-based UI permissions (Viewers cannot invite users or delete projects).
  - One-click API key revocation with immediate invalidation.
