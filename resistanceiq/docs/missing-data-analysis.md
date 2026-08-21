# ResistanceIQ — Missing Data & Completeness Analysis

## 1. Missingness Audit Across Ingested Variables

An audit was performed across all fields of the ingested scientific dataset to evaluate missingness rates and identify potential non-random patterns:

| Variable | Data Type | Total Records | Non-Null Count | Missing Count | Completeness (%) | Missingness Mechanism |
|---|---|---|---|---|---|---|
| `scientific_name` | String | 15 | 15 | 0 | 100.0% | Mandatory Schema Constraint |
| `common_name` | String | 15 | 15 | 0 | 100.0% | Resolved via NCBI Taxonomy |
| `ncbi_taxid` | Integer | 15 | 15 | 0 | 100.0% | Resolved via NCBI Taxonomy |
| `active_ingredient` | String | 15 | 15 | 0 | 100.0% | Mandatory Schema Constraint |
| `cas_number` | String | 15 | 15 | 0 | 100.0% | Resolved via PubChem |
| `irac_moa_group` | String | 15 | 15 | 0 | 100.0% | Resolved via IRAC Catalog |
| `resistance_year` | Integer | 15 | 15 | 0 | 100.0% | Historical observation timestamp |
| `publication_year`| Integer | 15 | 15 | 0 | 100.0% | Literature reference timestamp |
| `country` | String | 15 | 15 | 0 | 100.0% | Geographic origin |
| `location` | String | 15 | 15 | 0 | 100.0% | State / Province detail |
| `resistance_ratio`| Float | 15 | 15 | 0 | 100.0% | Verified quantitative ratio |
| `susceptible_baseline`| Float | 15 | 15 | 0 | 100.0% | Baseline $LC_{50}$ parameter |
| `bioassay_method`| String | 15 | 15 | 0 | 100.0% | Topical, Leaf-Dip, Diet |
| `reference` | Text | 15 | 15 | 0 | 100.0% | Literature citation |

---

## 2. Analysis of Missingness Patterns

1. **Mandatory Canonical Fields**: Ingestion filters enforce zero missingness on identity attributes (`scientific_name`, `active_ingredient`, `source_record_id`).
2. **Missingness in Broader Historical Literature (MNAR - Missing Not at Random)**:
   - In 1950s–1970s literature, exact numerical susceptible baseline $LC_{50}$ values and diagnostic concentration slope coefficients are frequently omitted in favor of qualitative mortality percentages at field dosage.
   - **Handling Strategy**: The modeling dataset will restrict quantitative regression training **strictly to records with verified continuous $RR$ and known bioassay protocol**, preventing imputed target noise.
