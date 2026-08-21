# ResistanceIQ — Scientific Data Release & Versioning Process

## 1. Lifecycle of Scientific Datasets

All public and proprietary scientific bioassay data flows through an audited versioning pipeline:

```text
[ Raw APRD / Field Ingestion ]
             │
             ▼
[ Deduplication & Molecular Standardization (RDKit Canonical SMILES) ]
             │
             ▼
[ Quality & Sanity Gates (docs/data-quality-monitoring.md) ]
             │
             ▼
[ Immutable Dataset Snapshot in PostgreSQL 'dataset_versions' ]
             │
             ▼
[ Feature Extraction Cache Generation ]
```

---

## 2. Ingestion Run Provenance

Each ingestion run creates an immutable row in `ingestion_runs` recording:
- Records seen vs records accepted.
- Canonical duplicate count.
- Validation rejection log.
- Operator or cron execution timestamp.
