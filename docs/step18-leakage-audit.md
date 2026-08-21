# Step 18 — Data Leakage & Scientific Integrity Audit

This document reports the comprehensive leakage audit conducted prior to model training on ResistanceIQ Dataset v3.0 (`aprd-resistance-v3`).

---

## 1. Audit Checkpoints & Methodology

Each category of potential data and feature leakage is audited against the dataset:

| Leakage Category | Audit Check Description | Test Method | Audit Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **1. Temporal Information Leakage** | Verify that no observations from $\ge 2013$ are present in the Training split, and no observations from $\ge 2019$ are present in Validation. | Date boundary verification on `resistance_year` and `collection_year` | Zero post-2012 records in Train; zero post-2018 records in Val. | **PASS** |
| **2. Study & Publication Leakage** | Verify that multi-year publications do not contaminate future test splits without temporal separation. | Cross-reference `publication_id` and `study_id` across Train/Val/Test | Each temporal observation corresponds to independent field sampling dates. | **PASS** |
| **3. Duplicate Observation Leakage** | Ensure no identical bioassay observations appear in multiple splits. | Multi-factor hash matching over `{compound, species, year, population, RR}` | Zero duplicates across splits. | **PASS** |
| **4. Feature Post-Outcome Leakage** | Verify that chemical descriptors, taxonomy, and baseline features are knowable *a priori* before bioassay testing. | Feature provenance inspection | ECFP4 fingerprints and taxonomy are intrinsic properties known prior to bioassay. | **PASS** |
| **5. Test Set Tuning Leakage** | Confirm that the held-out test split (2019–2024, $N=14$) remains locked and unaccessed during feature selection and model hyperparameter tuning. | Code execution path audit | All tuning, grid searches, and model selections are performed strictly on Train + Validation splits. | **PASS** |
| **6. Target Variable Leakage** | Ensure raw $\text{LC}_{50}$ or $RR$ is not included in the feature input matrix $X$. | Feature matrix column name and rank audit | Target $\log_{10}(RR)$ is strictly isolated in $y$. | **PASS** |

---

## 2. Formal Audit Verdict

> **LEAKAGE AUDIT RESULT: `PASS`**
>
> All 6 leakage checkpoints passed with zero violations. Dataset v3.0 and the Out-of-Time split partitions are certified clean for scientific model benchmarking.
