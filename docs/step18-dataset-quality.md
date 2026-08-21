# Step 18 — Dataset Quality, Deduplication & Missingness Report

This document reports the empirical data quality, missingness profile, multi-factor deduplication results, and entity resolution integrity for ResistanceIQ Dataset v3.0 (`aprd-resistance-v3`).

---

## 1. Quantitative Quality Profile

| Metric | Value | Status |
| :--- | :--- | :---: |
| **Total Canonical Observations** | **74** | Approved |
| **Independent Peer-Reviewed Studies** | **74** | Approved |
| **Independent Geographical Populations** | **68** | Approved |
| **Unique Chemical Active Ingredients** | **42** | Verified |
| **Unique Target Organisms (Species)** | **15** | Verified |
| **Unique MoA Classes / Groups** | **22** | Verified |
| **Taxonomic Orders Represented** | **8** (Hemiptera, Lepidoptera, Coleoptera, Trombidiformes, Caryophyllales, Poales, Helotiales, Capnodiales) | Verified |
| **Global Countries Represented** | **24** | Verified |
| **Temporal Range** | **1982–2024 (42 years)** | Verified |
| **Target Variable Range ($\log_{10} RR$)** | **0.477 – 2.724 ($3.0\times$ – $530.0\times$)** | Continuous Log-Normal |

---

## 2. Multi-Factor Deduplication Audit

Observations were processed through multi-attribute matching over:
`{source_record_id, publication_doi, study_id, population, species, compound, collection_year, resistance_year, country, assay_method, resistance_ratio}`

- **Exact Duplicates Removed**: **0**
- **Likely Duplicates Removed**: **0**
- **Unresolved Records Quarantined**: **0**
- **Independent Observations Accepted**: **74**

---

## 3. Missingness & Completeness Profile

| Field | Availability (%) | Missingness (%) | Quality Control Mechanism |
| :--- | :---: | :---: | :--- |
| `case_id` | 100.0% | 0.0% | System UUID generation |
| `resistance_year` | 100.0% | 0.0% | Verified publication / collection metadata |
| `active_ingredient` | 100.0% | 0.0% | Standardized ISO common name |
| `canonical_smiles` | 100.0% | 0.0% | PubChem CID / RDKit canonical representation |
| `molecular_weight` | 100.0% | 0.0% | Exact RDKit descriptor calculation |
| `logp` | 100.0% | 0.0% | Exact Wildman-Crippen SlogP calculation |
| `tpsa` | 100.0% | 0.0% | Exact topological polar surface area |
| `scientific_name` | 100.0% | 0.0% | NCBI Taxonomy Latin binomial |
| `ncbi_taxid` | 100.0% | 0.0% | Verified NCBI Taxonomy integer identifier |
| `taxonomic_order` | 100.0% | 0.0% | Hierarchical phylogenetic lineage |
| `irac_moa_group` | 100.0% | 0.0% | IRAC / HRAC / FRAC classification |
| `resistance_ratio` | 100.0% | 0.0% | Standardized $\text{LC}_{50} / \text{baseline}$ |
| `resistance_mechanism` | 100.0% | 0.0% | `DIRECT_TARGET` vs `METABOLIC_RESISTANCE` |
| `target_mutation` | 74.3% (55/74) | 25.7% (19/74) | Explicit genetic sequencing / probit assay notes |
| `field_lc50` | 89.2% (66/74) | 10.8% (8/74) | Absolute dose-response field mortality |
| `susceptible_baseline`| 89.2% (66/74) | 10.8% (8/74) | Documented susceptible reference strain |
