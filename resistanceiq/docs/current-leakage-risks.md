# ResistanceIQ — Current Data Leakage Audit

## 1. Audit of Current Dataset Leakage Vectors

Before feature engineering or training begins, we audit all columns in `resistance_cases` and related entities to identify and eliminate post-hoc leakage:

| Feature Candidate | Status in DB | Risk Level | Leakage Mechanism | Action |
|---|---|---|---|---|
| `publication_year` | Present | **CRITICAL LEAKAGE** | Paper is written years AFTER resistance occurred; causes look-ahead bias | **EXCLUDE from model input features** |
| `reference` citation | Present | **HIGH LEAKAGE** | Author names and journal titles correlate with specific resistant regions | **EXCLUDE from model input features** (Retain only for provenance) |
| `resistance_type` | Present | **LEAKAGE / TARGET ALIAS** | Label stating "Field Control Failure" directly reveals the outcome | **EXCLUDE from model input features** |
| `resistance_ratio` | Present | **TARGET VARIABLE** | Ground truth label | **MODEL TARGET ONLY** |
| `original_name` | Present | Low | Source terminology string | Exclude |
| `chemical_smiles` | Present | Safe | Pre-exposure 2D molecular structure | **INCLUDE in Morgan Fingerprints** |
| `irac_moa_group` | Present | Safe | Biochemical mechanism known at compound discovery | **INCLUDE in One-Hot Features** |
| `ncbi_taxid` / Order | Present | Safe | Biological species taxonomy known a priori | **INCLUDE in Categorical Features** |
| `resistance_year` | Present | Safe | Used strictly for temporal splitting ($t \le t_{\text{cut}}$) | **SPLIT ANCHOR ONLY** |

---

## 2. Leakage Defense Summary

1. Features must represent **only information known at the moment of novel compound discovery** (chemical structure, pest biology, target receptor wildtype sequence, and IRAC MoA).
2. All post-event descriptors (publication dates, failure descriptions, literature titles) are quarantined strictly to metadata logs.
