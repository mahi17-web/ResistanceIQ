# Scientific Data Provenance & Verification Policy

## 1. Zero Fabrication Policy
Scientific credibility is foundational to ResistanceIQ. Under no circumstance does the platform synthesize, fabricate, or randomly associate biological entities:
- **No Fabricated Crops**: All entries originate from the FAO Indicative Crop Classification (ICC v1.1).
- **No Fabricated TaxIDs**: All taxonomic identifiers are verified via NCBI Entrez E-utilities. Unresolved records are explicitly flagged `UNRESOLVED`.
- **No Arbitrary Associations**: Pests are only associated with crops when supported by documented agricultural literature (EPPO, CABI, USDA).
- **No Fabricated UniProt IDs or Sequences**: Only real, curated Swiss-Prot accessions are linked to biological targets.
- **No Fabricated PDB IDs or Structures**: Coordinate structures must exist in RCSB PDB or AlphaFold DB. If absent, the platform explicitly reports *"Protein structure unavailable"*.

---

## 2. Mandatory Provenance Metadata on Every Record
Every database entity and graph relationship maintains strict provenance attributes:

```sql
source           VARCHAR(128) NOT NULL, -- e.g. "FAO Indicative Crop Classification v1.1"
source_version   VARCHAR(32)  NOT NULL, -- e.g. "ICC-1.1-2020", "UniProtKB 2024_04"
evidence_level   VARCHAR(32)  NOT NULL, -- e.g. "CURATED_EXPERIMENTAL", "FIELD_OBSERVED"
retrieved_at     TIMESTAMPTZ  NOT NULL, -- ISO 8601 UTC timestamp of ingestion
updated_at       TIMESTAMPTZ  NOT NULL
```

---

## 3. Data Source Attribution Registry

| Domain | Authoritative Primary Source | Standard / Version | Primary Access Method | Licensing / Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Crop Taxonomy** | FAO Statistics Division | FAO ICC v1.1 (WCA 2020) | Reference Ingestion File | Open Access (FAO Data Policy) |
| **Phylogeny** | NCBI Entrez Taxonomy | Entrez Taxonomy API | REST API / E-utilities | Public Domain (US Gov / NIH) |
| **Pest-Host Matrix** | EPPO Global Database / CABI | EPPO 2024.1 / CABI CPC | Curated Relationship Table | Academic & Commercial Research |
| **Resistance Targets** | IRAC MoA / APRD | IRAC MoA v11.1 / APRD 2026 | Curated Target Registry | IRAC Open Educational Access |
| **Protein Sequences** | UniProtKB / Swiss-Prot | UniProtKB Release 2024_04 | UniProt REST API | Creative Commons CC-BY 4.0 |
| **3D Structures** | RCSB Protein Data Bank | wwPDB Coordinate Archive | RCSB PDB Data API | Public Domain (wwPDB / CC0) |
| **Computed Models** | AlphaFold DB (EBI / DeepMind) | AlphaFold DB v4 | AlphaFold EBI REST API | Creative Commons CC-BY 4.0 |

---

## 4. Audit Trail & Ingestion Logs
All synchronization operations are permanently recorded in the `knowledge_sync_audits` table:
- `id`: Audit execution key (e.g. `sync_20260819_120000`)
- `sync_type`: Scope of synchronization (`"ALL"`, `"FAO_CROPS"`, `"UNIPROT"`, etc.)
- `status`: `"COMPLETED"`, `"PARTIAL"`, or `"FAILED"`
- `records_added`, `records_updated`, `records_rejected`
- `error_log`: JSON formatted list of any validation rejections
- `started_at` & `completed_at`: Nanosecond-accurate execution duration
