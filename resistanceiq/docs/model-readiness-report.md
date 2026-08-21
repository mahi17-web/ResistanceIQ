# ResistanceIQ — Model Readiness & Dataset Audit Report

## 1. Executive Summary

This report documents the empirical audit of the scientific datasets currently persisted in the ResistanceIQ storage layer. It evaluates whether the data meets strict scientific and statistical criteria for training the initial machine learning models.

---

## 2. Model Readiness Scorecard

| Assessment Dimension | Status | Evidence & Detailed Findings |
|---|:---:|---|
| **1. Target Quality** | **PASS** | Continuous Resistance Ratio $\log_{10}(RR)$ and derived ordinal risk tiers are rigorously defined and standard across APRD and IRAC bioassays. |
| **2. Sample Size (Benchmark vs. Full)** | **WARNING** | The initial verified ingestion benchmark contains $N=15$ high-quality records. This is sufficient to execute unit-tested baseline pipeline prototypes, but requires expanding to the multi-thousand record APRD full historical corpus before production model training. |
| **3. Temporal Coverage** | **PASS** | Observations span 70 continuous years (1946–2016), enabling realistic out-of-time temporal holdout partitions ($\le 2000$ train, $2001–2010$ val, $2011–2026$ test). |
| **4. Geographic Coverage** | **PASS** | 11 countries across 5 continents represented (North America, Europe, Asia, South America, Oceania). |
| **5. Label Consistency** | **PASS** | All benchmark measurements utilize standard $LC_{50}$ ratios against concurrent internal susceptible reference strains. |
| **6. Feature Availability** | **PASS** | IRAC MoA codes, NCBI taxonomy, and assay protocols are 100% resolved and non-null. |
| **7. Chemical Structure Coverage** | **PASS** | 100% of active ingredients in `molecules` and `canonical_pesticides` have canonical SMILES and verified CAS numbers ready for RDKit ECFP4 fingerprinting. |
| **8. Genetic Coverage** | **WARNING** | Direct sequenced field mutation records are currently 0 in this benchmark; $\Delta\Delta G$ must be computed computationally via in-silico target docking rather than empirical field genotype features. |
| **9. Data Leakage Risk** | **PASS** | All post-event attributes (`publication_year`, `resistance_type`, citation text) have been audited and quarantined from the input feature matrix. |
| **10. Validation Feasibility** | **PASS** | Time-forward splitting and Bemis-Murcko scaffold disjoint clustering are formally specified and executable. |

---

## 3. Analytical Visualizations Generated

The following analytical plots were computed from the live database and saved into `data/audit/`:
1. `data/audit/records_by_year.png` — Temporal distribution over 70 years.
2. `data/audit/records_by_organism.png` — Distribution across 6 major agricultural pest species.
3. `data/audit/records_by_pesticide.png` — Representation across 13 active ingredients.
4. `data/audit/records_by_country.png` — Geographic coverage across 11 nations.
5. `data/audit/resistance_type_distribution.png` — Field documented vs failure classifications.
6. `data/audit/missing_value_chart.png` — Zero null rate across canonical fields in verified benchmark.
7. `data/audit/source_distribution.png` — APRD database provenance breakdown.

---

## 4. Final Scientific Decision

### **NEEDS DATA EXPANSION & BASELINE PROTOTYPING**
*(Classified formally as: **NEEDS MORE DATA** for final production training, but **READY FOR BASELINE & FEATURIZATION PIPELINE PROTOTYPES**)*

### Rationale:
- The data architecture, validation quarantine, and chemical/biological normalization frameworks are **100% sound and verified**.
- The prediction target $\log_{10}(RR)$ is **statistically and toxicologically defensible**.
- In the next phase (**Step 5: Feature Engineering + Baseline Models**), we can implement feature extractors (ECFP4 fingerprints + IRAC encodings) and build the transparent baseline models (Mean, Species-MoA Group Mean, Ridge), while queuing the full-corpus APRD multi-thousand case batch expansion before fitting any final production models.
