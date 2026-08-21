# Step 18 — Model Comparison, Feature Ablation & Temporal Validation Report

This document records the comparative evaluation of baseline models and candidate architectures on ResistanceIQ Dataset v3.0 (`aprd-resistance-v3`) under strict Out-of-Time temporal holdout conditions.

---

## 1. Out-of-Time Temporal Evaluation Matrix

- **Historical Training Split (<= 2012)**: $N = 37$ observations
- **Validation Tuning Split (2013-2018)**: $N = 23$ observations
- **Held-Out Future Test Split (2019-2024)**: $N = 14$ observations (Untouched during tuning)

| Model Candidate | Algorithm | Val MAE (log10) | Val MedAE | Val RMSE | Test MAE (log10) | Test 95% Bootstrap CI | Test MedAE | Test RMSE | Test R2 | Conformal Cov. (90%) | Conformal Cov. (95%) | OOD MAE |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `v3.0-ridge-ecfp4` | RIDGE | 0.5577 | 0.5539 | 0.6991 | 1.2174 | [0.8721, 1.5003] | 1.4589 | 1.3551 | -8.6609 | 35.7% | 35.7% | 1.2174 |
| `v3.0-rf-ecfp4` | RANDOM_FOREST | 0.4431 | 0.3671 | 0.5259 | 0.8097 | [0.5950, 0.9908] | 0.9255 | 0.8973 | -3.2356 | 50.0% | 50.0% | 0.8097 |
| `v3.0-gbrt-ecfp4` | GRADIENT_BOOSTING | 0.4637 | 0.4297 | 0.6019 | 0.9328 | [0.6848, 1.1359] | 1.0678 | 1.0284 | -4.5642 | 35.7% | 35.7% | 0.9328 |
| `v3.0-histgbr-ecfp4` | HIST_GRADIENT_BOOSTING | 0.4579 | 0.3842 | 0.5817 | 0.9552 | [0.7248, 1.1539] | 1.0673 | 1.0441 | -4.7347 | 50.0% | 50.0% | 0.9552 |

---

## 2. Feature Ablation Analysis

| Feature Pipeline | Included Descriptor Families | Feature Count | Coverage | Val MAE | Test MAE | Ablation Finding |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Pipeline A (Baseline)** | 1024 ECFP4 + MW, logP, TPSA, HBD, HBA + Taxonomy + Bioassay | 1045 | 100.0% | 0.4431 | 0.8097 | **Best generalizability** without missingness distortion. |
| **Pipeline B (+ Protein)** | Pipeline A + Active site / UniProt / PDB structure | 1052 | 64.9% | 0.5412 | 0.8120 | Missing for metabolic mechanisms; introduces imputation noise. |
| **Pipeline C (+ Metabolic)**| Pipeline A + P450/GST overexpression & copy number | 1049 | 35.1% | 0.5280 | 0.7950 | Inadequate general coverage; retained as modular sub-annotation. |

---

## 3. Subgroup Stability Across Taxonomic Orders (Best Model: `v3.0-rf-ecfp4`)

| Taxonomic Order | Observations (N) | Mean Absolute Error (log10) | Median Absolute Error |
| :--- | :---: | :---: | :---: |
| Unknown | 74 | 0.3605 | 0.2121 |

---

## 4. Scientific Governance & Promotion Decision

- **Selection Gate**: `v3.0-rf-ecfp4` achieved the lowest Validation MAE (0.4431).
- **Temporal Generalization Gate**: Test MAE (0.8097) and Conformal Coverage (50.0%) were evaluated against strict thresholds.
- **Formal Status**: **`REQUIRES VALIDATION`**.
- **Baseline Retention**: Production baseline `v2.0-gbrt-ecfp4` remains the active production benchmark in the Model Registry.
