# ResistanceIQ — Scientific Data Ingestion Architecture

## 1. Overview

The ResistanceIQ ingestion pipeline transforms disparate, heterogeneous scientific records from external toxicological and resistance databases into a validated, canonical, and cryptographically tracked internal data model.

---

## 2. Ingestion Stages & Directory Contracts

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  data/raw/   │ ──> │ data/staging │ ──> │  VALIDATION  │ ──> │ NORMALIZATION│ ──> │data/processed│
│ (Source Files│     │(Parsed JSONL)│     │ & REJECTION  │     │(Taxon/Chem)  │     │ (Canonical)  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │data/rejected/│
                                          │(Error Codes) │
                                          └──────────────┘
```

1. **`data/raw/` (Raw Source Preservation)**:
   - Contains exact byte-for-byte copies of external source files (CSVs, SDFs, FASTA, XLSX).
   - Files are named with dataset version and SHA-256 checksum tags.
   - **Rule**: Raw files are append-only and strictly immutable.
2. **`data/staging/` (Intermediate Syntactic Parsing)**:
   - Source-specific parsers (`APRDParser`, `IRACParser`) convert raw file formats into standardized staging dictionaries.
3. **Validation & `data/rejected/` (Semantic Quarantine)**:
   - Staged records pass through `SchemaValidator`.
   - Records failing required fields, temporal sanity, or numerical thresholds are quarantined in `data/rejected/` and recorded in `data_quality_rejections` with explicit error codes.
4. **Normalization & Deduplication**:
   - `TaxonomyNormalizer` resolves organism synonyms while preserving `original_name` vs `canonical_name`.
   - `PesticideNormalizer` standardizes active ingredient names and assigns verified IRAC MoA codes and CAS numbers.
   - `Deduplicator` flags candidate duplicates (`is_duplicate_candidate = True`) without silent deletion.
5. **`data/processed/` & Database Insertion**:
   - Validated canonical records are batch-inserted inside database transactions into `canonical_organisms`, `canonical_pesticides`, and `resistance_cases`.
6. **`data/metadata/` (Profiling & Run Auditing)**:
   - Produces machine-readable `data_profile.json` and human-readable Markdown data quality reports.

---

## 3. Pipeline Execution & Restartability

The ingestion pipeline is completely idempotent and restartable:
```bash
# Execute standard APRD ingestion run
python -m app.ingestion.run_ingest
```

If an ingestion run fails midway, the database transaction is automatically rolled back, the `IngestionRun` status is marked `FAILED`, and the database remains in a consistent state.
