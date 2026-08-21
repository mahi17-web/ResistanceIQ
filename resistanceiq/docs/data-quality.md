# ResistanceIQ — Scientific Data Quality & Validation Rules

## 1. Quality Philosophy

Scientific data quality requires balancing **strict schema integrity** with **tolerance for historical measurement reality**. Older published literature (e.g. 1950s organophosphate studies) may lack modern quantitative $LC_{50}$ confidence intervals while retaining high value for long-term historical resistance timelines.

---

## 2. Validation Taxonomy & Rejection Rules

Every record processed during ingestion is evaluated against mandatory semantic rules. Records failing any mandatory rule are quarantined with an error code:

| Error Code | Severity | Trigger Condition | Quarantine Action |
|---|---|---|---|
| `ERR_MISSING_SOURCE_ID` | Critical | Record has no identifier or primary key in source database | Rejected to `data/rejected/` |
| `ERR_MISSING_ORGANISM` | Critical | Scientific name, common name, and genus are all blank | Rejected to `data/rejected/` |
| `ERR_INVALID_TAXONOMY` | High | Scientific name is $<3$ characters or malformed non-alphabetic string | Rejected to `data/rejected/` |
| `ERR_MISSING_ACTIVE_INGREDIENT` | Critical | Active ingredient / pesticide name is blank | Rejected to `data/rejected/` |
| `ERR_INVALID_RESISTANCE_YEAR` | High | Resistance year is $<1900$ or in the future ($>\text{Current Year}+1$) | Rejected to `data/rejected/` |
| `ERR_INVALID_PUB_YEAR` | High | Publication year is $<1900$ or in the future | Rejected to `data/rejected/` |
| `ERR_IMPOSSIBLE_RATIO` | High | Resistance ratio $RR \le 0.0$ | Rejected to `data/rejected/` |
| `ERR_UNREALISTIC_OUTLIER_RATIO` | High | Resistance ratio $RR > 1,000,000.0$ without documentation | Rejected to `data/rejected/` |
| `ERR_MALFORMED_COUNTRY` | Medium | Country identifier is $<2$ characters | Rejected to `data/rejected/` |

---

## 3. Duplicate Handling Policy

- **Exact Duplicate**: Same `source_id` + `source_record_id`.
  - *Action*: Skipped from re-insertion to maintain database idempotency.
- **Candidate Biological Duplicate**: Same `(canonical_organism, active_ingredient, resistance_year, country)` across different literature sources.
  - *Action*: Ingested with `is_duplicate_candidate = True`.
  - *Rationale*: Different research teams often independently sample and confirm the same regional field resistance event; preserving both citations is vital for scientific validation while enabling downstream ML filters to deduplicate.

---

## 4. Null-Handling & Missing Value Tolerances

- **Mandatory Fields** (Cannot be NULL): `source_id`, `source_record_id`, `organism_id`, `pesticide_id`.
- **Optional Bioassay Fields** (NULL permitted without rejection):
  - `resistance_ratio` (Some APRD historical records report documented qualitative field failure prior to exact $LC_{50}$ determination).
  - `bioassay_method` (Protocol details may be omitted in brief reports).
  - `susceptible_baseline` (Reference strain baseline may be cited elsewhere in the primary publication).
