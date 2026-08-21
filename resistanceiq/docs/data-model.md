# ResistanceIQ — Canonical Scientific Data Model

## 1. Entity Relationship Overview

```mermaid
erDiagram
    DATA_SOURCE ||--o{ DATASET_VERSION : registers
    DATASET_VERSION ||--o{ INGESTION_RUN : audits
    INGESTION_RUN ||--o{ DATA_QUALITY_REJECTION : quarantines
    DATASET_VERSION ||--o{ RESISTANCE_CASE : provenance
    INGESTION_RUN ||--o{ RESISTANCE_CASE : executes
    CANONICAL_ORGANISM ||--o{ RESISTANCE_CASE : subjects
    CANONICAL_PESTICIDE ||--o{ RESISTANCE_CASE : evaluates

    DATA_SOURCE {
        string id PK
        string name
        string organization
        string url
        string license
        string access_method
        string source_type
    }

    DATASET_VERSION {
        string id PK
        string data_source_id FK
        string dataset_name
        string version
        string checksum
        int record_count
    }

    INGESTION_RUN {
        string id PK
        string dataset_version_id FK
        datetime started_at
        datetime completed_at
        string status
        int records_seen
        int records_accepted
        int records_rejected
    }

    CANONICAL_ORGANISM {
        string id PK
        string original_name
        string canonical_name
        string scientific_name
        string common_name
        string genus
        string species
        int ncbi_taxid
    }

    CANONICAL_PESTICIDE {
        string id PK
        string original_name
        string active_ingredient
        string cas_number
        string irac_moa_group
        string chemical_class
    }

    RESISTANCE_CASE {
        string id PK
        string organism_id FK
        string pesticide_id FK
        int resistance_year
        int publication_year
        string country
        string location
        string resistance_type
        float resistance_ratio
        string bioassay_method
        string source_id FK
        string source_record_id
        boolean is_duplicate_candidate
    }
```

---

## 2. Field Dictionary & Provenance Traceability

Every record in `resistance_cases` maintains full cryptographic and structural traceability:
- Traced to its originating external database via `source_id` + `source_record_id`.
- Traced to its exact batch snapshot via `dataset_version_id` (with SHA-256 raw file hash).
- Traced to its execution log and timestamp via `ingestion_run_id`.
- Retains original non-normalized names in `canonical_organisms.original_name` and `canonical_pesticides.original_name`.
