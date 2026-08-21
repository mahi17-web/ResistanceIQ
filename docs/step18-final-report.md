# Step 18 — Final Comprehensive Scientific Report & Governance Decision

This document summarizes the results of Step 18: Large-Scale Real Scientific Resistance Data Expansion, Measurement Harmonization, Multi-Factor Deduplication, Feature Ablations, Out-of-Time Temporal Benchmarking, and Formal Scientific Governance.

---

## 1. Quantitative Scientific Summary

| Audit Item | Exact Metric / Checksum | Scientific Source / Verification |
| :--- | :--- | :--- |
| **Baseline Model Checksum** | `6fc915fa26716dc4...` | `resistanceiq/storage/models/v2.0.0-gbrt-ecfp4.joblib` (LOCKED IMMUTABLE) |
| **Baseline Dataset Checksum**| `b092dfb208d5078e...` | `resistanceiq/data/processed/processed_v2_canonical_dataset.jsonl` (LOCKED IMMUTABLE) |
| **New Dataset Version** | `aprd-resistance-v3` | `resistanceiq/data/processed/processed_v3_canonical_dataset.jsonl` |
| **New Dataset Checksum** | `924f20e7d45f1130...` | Computed SHA256 over canonical v3 JSONL |
| **Total Canonical Observations**| **74 observations** | APRD, Rothamsted RRes-IRD, IRAC-GRBS, IWRC, FRAC |
| **Independent Peer-Reviewed Studies**| **74 independent studies** | Verified publication DOIs and study identifiers |
| **Independent Populations** | **68 distinct field strains** | Geographic field sampling locations |
| **Unique Active Ingredients** | **42 chemical compounds** | PubChem verified canonical SMILES & InChIKeys |
| **Unique Target Organisms** | **15 species** | NCBI Taxonomy IDs across 8 phylogenetic orders |
| **Unique MoA Groups** | **22 MoA classes** | IRAC, HRAC, FRAC classifications |
| **Geographic Countries** | **24 countries** | North America, South America, Europe, Asia, Oceania |
| **Temporal Range** | **1982–2024 (42 years)** | Verified collection & bioassay years |

---

## 2. Out-of-Time Temporal Partitioning

| Temporal Split | Year Range | Count | % Total | Independent Studies | Unique Species | Unique Compounds | Median $RR$ |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Historical Train** | $\le 2012$ | **37** | 50.0% | 37 | 12 | 23 | $90.0\times$ |
| **Validation Tuning** | $2013–2018$ | **23** | 31.1% | 23 | 11 | 15 | $80.0\times$ |
| **Held-Out Future Test**| $2019–2024$ | **14** | 18.9% | 14 | 8 | 11 | $8.5\times$ |

---

## 3. Feature Ablation & Availability Matrix

| Feature Family | Descriptor Count | Corpus Coverage | Validation MAE | Test MAE | Recommendation |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Feature A (Baseline)** | 1045 | **100.0%** | **0.4431** | **0.8097** | **Adopted as primary feature pipeline** |
| **Feature B (+ Protein)** | 1052 | **64.9%** | 0.5412 | 0.8120 | Retained as optional target annotation |
| **Feature C (+ Metabolic)**| 1049 | **35.1%** | 0.5280 | 0.7950 | Retained as optional metabolic annotation |

---

## 4. Leakage & Scientific Integrity Audit

- **Temporal Boundary Leakage**: `PASS` (0 future observations in Train/Val).
- **Study / Publication Leakage**: `PASS` (Independent temporal sampling).
- **Duplicate Observation Leakage**: `PASS` (0 duplicate rows).
- **Post-Outcome Feature Leakage**: `PASS` (All descriptors are intrinsic *a priori* properties).
- **Test Set Tuning Lock**: `PASS` (2019–2024 test partition untouched during tuning).
- **Overall Leakage Verdict**: **`PASS`**

---

## 5. Model Candidate Out-of-Time Performance Matrix

| Model Candidate | Algorithm | Val MAE ($\log_{10}$) | Val MedAE | Val RMSE | Test MAE ($\log_{10}$) | Test 95% Bootstrap CI | Test MedAE | Test RMSE | Test $R^2$ | Conformal Cov. (90%) | Conformal Cov. (95%) | OOD MAE |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `v3.0-ridge-ecfp4` | Ridge Regression | 0.5577 | 0.5539 | 0.6991 | 1.2174 | [0.8721, 1.5003] | 1.4589 | 1.3551 | -8.6609 | 35.7% | 35.7% | 1.2174 |
| `v3.0-rf-ecfp4` | Random Forest | **0.4431** | **0.3671** | **0.5259** | **0.8097** | [0.5950, 0.9908] | **0.9255** | **0.8973** | **-3.2356** | **50.0%** | **50.0%** | **0.8097** |
| `v3.0-gbrt-ecfp4` | Gradient Boosting | 0.4637 | 0.4297 | 0.6019 | 0.9328 | [0.6848, 1.1359] | 1.0678 | 1.0284 | -4.5642 | 35.7% | 35.7% | 0.9328 |
| `v3.0-histgbr-ecfp4` | HistGradientBoosting| 0.4579 | 0.3842 | 0.5817 | 0.9552 | [0.7248, 1.1539] | 1.0673 | 1.0441 | -4.7347 | **50.0%** | **50.0%** | 0.9552 |

---

## 6. Durability & Risk Heuristic Audit

- **Durability Formulation**: $Horizon = 25 / \sqrt{RR}$, $Durability = Horizon / 15$.
  - **Audit Classification**: **`RESEARCH HEURISTIC`**.
  - **Rationale**: 14 longitudinal series confirm accumulated resistance over time, but continuous cohort panels are insufficient for formal survival/hazard modeling.
- **Resistance Risk Tiers**:
  - **Audit Classification**: **`RESEARCH HEURISTIC`** (non-regulatory research indicator).

---

## 7. Model Promotion & Registry Governance Decision

- **Predefined Acceptance Thresholds**:
  1. Validation MAE $\le 0.40$: `FAIL` (0.4431 for RF)
  2. Held-Out Test MAE $\le 0.40$: `FAIL` (0.8097 for RF)
  3. Risk Tier Concordance $\ge 70\%$: `FAIL` (7.1% on held-out post-2019 test partition)
  4. Conformal Coverage (90%) $\ge 85\%$: `FAIL` (50.0% on held-out post-2019 test partition)

- **Formal Scientific Governance Decision**: **`REQUIRES VALIDATION`**
- **Active Production Benchmark**: **`v2.0-gbrt-ecfp4` is strictly retained as the active production benchmark in the Model Registry.**
- **Frontend / API Status**: Displayed as **`RESEARCH MODE` / `MODEL STATUS: REQUIRES VALIDATION`** (Zero false regulatory claims).
