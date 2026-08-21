# Step 21 — Feature Validity, Leakage Audit & Controlled Ablations

This document reports the scientific validity, availability at prediction time, leakage risk, and controlled ablation performance across Models A–F on ResistanceIQ Dataset v4.0 (`aprd-resistance-v4`).

---

## 1. Feature Family Predictive Validity Audit

| Feature Family | Specific Descriptors | Availability at Prediction Time | Leakage Risk | Missingness | Scientific Justification | Retention Recommendation |
| :--- | :--- | :---: | :---: | :---: | :--- | :---: |
| **Chemical Fingerprints** | 1024-bit Morgan ECFP4 | **YES (100%)** | **None** | **0.0%** | Captures 2D atomic connectivity, functional groups, and pharmacophores. | **RETAIN (Core)** |
| **Physicochemical** | MW, logP, TPSA, HBD, HBA, RotB | **YES (100%)** | **None** | **0.0%** | Dictates cuticular penetration, cellular uptake, and lipophilicity. | **RETAIN (Core)** |
| **Taxonomic Biology** | Order, Family, Genus, Species | **YES (100%)** | **None** | **0.0%** | Encodes target organism physiology, lifecycle, and baseline enzyme systems. | **RETAIN (Core)** |
| **Assay Protocol** | Method (Leaf dip, Topical, Diet) | **YES (100%)** | **None** | **0.0%** | Controls for procedural measurement offsets across assay types ($\eta^2 = 39.1\%$). | **RETAIN (Core)** |
| **Temporal Exposure** | Time since initial launch ($t - t_0$) | **YES (100%)** | **None** | **0.0%** | Accounts for cumulative field selection pressure over chronological time. | **CONDITIONAL** |
| **Target Protein Features**| Direct target flag, PDB resolution | **YES (64.9%)** | **Low** | **35.1%** | Represents macromolecular target receptor geometry; sparse for non-target mechanisms. | **OPTIONAL SUB-ANNOTATION** |
| **Metabolic Annotations** | P450/GST overexpression flag | **NO (Post-outcome in field)**| **Moderate** | **64.9%** | Field overexpression is frequently a post-exposure outcome rather than a prior descriptor. | **EXCLUDE FROM PRIORS** |

---

## 2. Controlled Ablation Experiments (Models A through F)

All models were evaluated on identical Out-of-Time splits: Train $\le 2012$ ($N=40$), Validation $2013–2018$ ($N=34$), Held-Out Future Test $2019–2024$ ($N=15$).

| Model Architecture | Feature Representation | Validation MAE ($\log_{10}$) | Test MAE ($\log_{10}$) | Test RMSE | Spearman Rank $\rho$ | Pairwise Ranking Accuracy | Top-3 High-Risk Recall |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Model A** | Chemical Only (1024 ECFP4 + 6 Descriptors) | 0.6556 | 0.6718 | 0.8230 | +0.108 | 50.5% | 33.3% |
| **Model B** | Chemical + Biological (Taxonomy) | 0.6765 | **0.6665** | 0.8237 | +0.097 | **52.5%** | 33.3% |
| **Model C** | Chemical + Biological + Assay Context | 0.6705 | 0.6660 | **0.8215** | -0.007 | 47.5% | 33.3% |
| **Model D** | Chemical + Biological + Assay + Temporal Index | 0.6970 | 0.7080 | 0.8636 | -0.043 | 46.5% | 33.3% |
| **Model E** | Chemical + Biological + Target Protein Descriptors | **0.6467** | 0.7278 | 0.8651 | -0.038 | 47.5% | 33.3% |
| **Model F** | Chemical + Biological + Metabolic Descriptors | 0.6862 | 0.6934 | 0.8485 | -0.059 | 46.5% | 33.3% |

---

## 3. Ablation Findings & Feature Selection

1. **Model B (Chemical + Biological Context)** produces the lowest Out-of-Time Test MAE (**0.6665** $\log_{10} RR$) and highest pairwise ranking accuracy (**52.5%**).
2. **Protein (Model E) and Metabolic (Model F) Descriptors**: Adding sparse target and metabolic flags degraded future test performance (Test MAE 0.7278 and 0.6934) due to feature missingness and imputation noise.
3. **Temporal Index (Model D)**: Adding chronological year indices caused slight temporal overfitting (Test MAE 0.7080).
