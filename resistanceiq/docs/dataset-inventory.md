# ResistanceIQ — Empirical Dataset Inventory

## 1. Inventory Summary

This inventory documents all verified scientific datasets ingested, parsed, validated, and persisted in the ResistanceIQ storage layer as of August 2026.

---

## 2. Ingested Dataset Registry

| Attribute | Dataset Profile: APRD Historical Benchmark |
|---|---|
| **Dataset Name** | APRD Arthropod Pesticide Resistance Registry |
| **Source Registry** | Michigan State University / USDA NIFA / IRAC (`APRD`) |
| **Version Tag** | `APRD-2026.1` |
| **Checksum (SHA-256)** | `a49bf32b5e084ef75796dfa26db12ecddfcf4ffc73bf9110b64d0dc372f7d983` |
| **Total Ingested Records** | 15 verified empirical bioassay cases |
| **Date Range** | 1946 – 2016 (70-year historical span) |
| **Organism Count** | 6 distinct agricultural and public health arthropod species |
| **Pesticide / Active Count**| 13 distinct active ingredients across 8 IRAC MoA groups |
| **Country Count** | 11 countries across 5 continents |
| **Resistance Type Count** | 2 categories (`Field Documented Resistance`, `Field Control Failure`) |
| **Missing-Value Rate** | 0.0% on mandatory identifiers; 0.0% on verified bioassay metrics |
| **Duplicate Rate** | 0.0% exact duplicates in benchmark; 0 duplicate candidates |
| **Provenance Completeness**| 100.0% (every row maintains `source_id`, `source_record_id`, `dataset_version_id`, `ingestion_run_id`, and literature citation) |

---

## 3. Registered External Reference Corpora

In addition to empirical resistance cases, the following reference knowledgebases are registered in `data_sources` and actively mapped:

1. **IRAC Mode of Action Classification Scheme (v11.1)**:
   - Groups 1A through 35 mapped to primary biochemical receptor target sites.
2. **PubChem Compound Registry**:
   - Canonical SMILES and InChIKey hashes for active ingredients.
3. **UniProtKB / Swiss-Prot**:
   - Reference receptor protein sequences for AChE1 (`Q9BMJ1`), GluCl-α (`Q17342`), VGSC (`Q94759`), and RyR (`A0A1I9KND8`).
