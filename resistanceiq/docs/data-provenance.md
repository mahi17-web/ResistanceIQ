# ResistanceIQ — Scientific Data Provenance & Ingestion Architecture

## 1. Provenance Mandate

In scientific computing, every machine learning feature and evaluation metric is only as credible as its underlying data provenance. **ResistanceIQ enforces strict immutability and lineage tracking for all ingested datasets.**

---

## 2. Ingestion Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    External Raw Sources                     │
│        (APRD CSV, IRAC XLSX, ChEMBL SDF, UniProt FASTA)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Step 1: Raw Ingestion
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Raw Data Storage                       │
│    Immutable, versioned raw payloads with hash verification │
│                (storage/raw/{source}/{version}/)            │
└──────────────────────────────┬──────────────────────────────┘
                               │ Step 2: Schema Validation
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Validation & Sanitization Layer               │
│   • Check mandatory fields                                  │
│   • RDKit SMILES structural parsing                         │
│   • NCBI Taxonomy ID resolution                             │
│   • Rejection of invalid records with logged rejection cause│
└──────────────────────────────┬──────────────────────────────┘
                               │ Step 3: Entity Resolution & Harmonization
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Entity Resolution & Normalization              │
│   • Chemical Name -> Canonical InChIKey (PubChem/ChEMBL)    │
│   • Pest Common/Scientific -> NCBI TaxID                    │
│   • Target Receptor -> UniProtKB Accession                  │
│   • Assay Units -> Standardized mg/L or ppm                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Step 4: Canonical Storage
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Canonical SQL Data Lake                    │
│   Versioned tables with original source_id, retrieved_at    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Step 5: Feature Pipeline
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Feature Store (ML)                       │
│   Precomputed fingerprints, descriptors, ΔΔG, and splits    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Mandatory Provenance Tracking Metadata

Every scientific observation in the canonical database must record the following 7 metadata attributes:

1. `source_name`: String identifier of the originating database (e.g. `APRD_MSU`, `IRAC_MOA_V11`, `CHEMBL_33`, `UNIPROT_2026_01`).
2. `source_url`: Permanent URI or DOI to the specific source record.
3. `source_record_id`: Exact primary key in the originating database (e.g., APRD record number, ChEMBL Assay ID, UniProt ID).
4. `source_version`: Version or release tag of the external database at time of fetch.
5. `retrieved_at`: ISO 8601 UTC timestamp of retrieval.
6. `raw_checksum`: SHA-256 hash of the originating raw file/payload.
7. `processing_pipeline_version`: Git commit SHA of the ResistanceIQ ingestion code used to parse and sanitize the record.

---

## 4. Entity Resolution & Harmonization Rules

### 4.1 Chemical Entities (Pesticides & Molecules)
- **Problem**: A single active ingredient appears under dozens of trade names (e.g., "Confidor", "Gaucho", "Admire", "Imidacloprid", "BAY NTN 33893").
- **Resolution Strategy**:
  1. Map input string against PubChem Synonym Thesaurus and ChEMBL Compound Dictionary.
  2. Generate canonical RDKit SMILES and Standard InChIKey.
  3. The **InChIKey** serves as the immutable canonical primary key for chemical structures.

### 4.2 Biological Targets
- **Problem**: Receptors are referenced inconsistently (e.g., "AChE", "AChE1", "ace-1", "acetylcholinesterase", "E.C. 3.1.1.7").
- **Resolution Strategy**:
  1. Map to NCBI Taxonomy ID + UniProtKB Accession (e.g., `Q9BMJ1` for *Myzus persicae* AChE1).
  2. Verify active site residues match standard multiple sequence alignment reference numbering.

### 4.3 Pest Species
- **Problem**: Common names vary across geographic regions (e.g., "Diamondback moth", "cabbage moth", "Plutella maculipennis", "Plutella xylostella").
- **Resolution Strategy**:
  1. Resolve all common and obsolete scientific names to the canonical **NCBI Taxonomy ID** (e.g., NCBI TaxID `51655` for *Plutella xylostella*).

---

## 5. Automated Data Quality & Rejection Filters

During ingestion, records are automatically routed to a `data_quality_rejections` quarantine table if they fail any of the following checks:

| Filter Rule | Error Condition | Action |
|---|---|---|
| **Invalid SMILES** | SMILES fails RDKit `MolFromSmiles()` parsing | Reject with `ERR_CHEM_INVALID_SMILES` |
| **Impossible Bioassay Ratio** | $RR \le 0$ or $RR > 1,000,000$ without verified target amplification | Reject with `ERR_BIOASSAY_OUTLIER_RATIO` |
| **Missing Reference Baseline** | Resistance reported without susceptible control strain or baseline $LC_{50}$ | Flag as `WARN_NO_SUSCEPTIBLE_BASELINE` |
| **Ambiguous Year** | Collection year is missing, future, or prior to commercial synthesis ($<1935$) | Reject with `ERR_INVALID_TEMPORAL_ANCHOR` |
| **Unresolvable Species** | Scientific name not found in NCBI Taxonomy database | Reject with `ERR_TAXONOMY_UNRESOLVED` |
