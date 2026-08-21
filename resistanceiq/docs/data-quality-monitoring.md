# ResistanceIQ — Scientific Data Quality & Schema Drift Monitoring

## 1. Scope & Objectives

Scientific bioassay databases (e.g. APRD, IRAC MoA taxonomy, NCBI taxonomy) periodically update formats, add novel active ingredients, or adjust baseline susceptible strains. This protocol establishes rigorous schema drift detection and data sanity thresholds.

---

## 2. Ingestion Run Validation Gate

Every scheduled or manual ingestion execution must pass automated pre-commit gates:

| Quality Dimension | Metric / Criterion | Threshold / Tolerance | Action on Violation |
|---|---|---|---|
| **Volume Anomaly** | $\Delta N_{\text{records}} = |N_{\text{new}} - N_{\text{prev}}|$ | $> 50\%$ sudden change | Hold ingestion in `PENDING_REVIEW` state |
| **Null Rate** | Missing SMILES or Pest Species | $> 0.5\%$ null values | Reject defective batch |
| **Unit Sanity** | Resistance Ratio unit bounds | $\text{RR} < 0.1$ or $\text{RR} > 100,000$ | Quarantine extreme outliers for toxicological audit |
| **Taxonomy Drift** | Pest Order not in canonical index | New unmapped order | Tag records with `NEW_TAXON_ALERT` |
| **Schema Integrity** | Missing or renamed CSV/JSON columns | 100% column adherence | Ingestion aborts with fatal schema error |

---

## 3. Freshness & Provenance Tracking

Every dataset release in PostgreSQL `dataset_versions` records:
- `version_tag`: Semantic version string (e.g. `dset_2026_q3`).
- `records_accepted` vs `records_rejected`.
- `source_url` & `checksum_sha256`.
- `created_at`: Explicit real timestamp displayed in the internal admin UI (zero fake "updated today" strings).
