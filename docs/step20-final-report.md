# Step 20 — Final Targeted Domain Expansion & Temporal Validation Report

This report documents the results of Step 20: Targeted Scientific Data Acquisition for Future-Domain Coverage, OOD Re-Evaluation, Temporal ML Benchmarking, and Scientific Model Governance on ResistanceIQ Dataset v4.0 (`aprd-resistance-v4`).

---

## 1. Future-Domain Coverage Expansion & OOD Re-Evaluation

| Metric | Step 19 (Dataset v3) | Step 20 (Targeted Dataset v4) | Improvement / Diagnosis |
| :--- | :---: | :---: | :--- |
| **Total Canonical Observations** | 74 | **89** | **+15 targeted baseline & monitoring records** |
| **Independent Peer-Reviewed Studies** | 74 | **89** | **+15 independent studies** |
| **In-Domain Future Test Observations** | 0 / 14 (0.0%) | **13 / 15 (86.7%)** | **+86.7% in-domain structural coverage** |
| **Mean Nearest-Neighbor Tanimoto (Test vs Domain)** | 0.565 | **0.876** | **Substantial chemical neighborhood expansion** |
| **Targeted Gaps Closed** | 0 | **7 major gaps closed** | IRAC 30, 9D, 4E, 29, 23, HRAC 10, *Amaranthus palmeri* |

---

## 2. Temporal Out-of-Time Model Benchmark Matrix

- **Historical Train ($\le 2012$)**: $N = 40$ records (44.9%)
- **Validation Tuning ($2013–2018$)**: $N = 34$ records (38.2%) — *Used for hyperparameter tuning & candidate selection*
- **Held-Out Future Test ($2019–2024$)**: $N = 15$ records (16.9%) — *LOCKED Untouched during tuning*

| Model Candidate | Algorithm | Val MAE ($\log_{10}$) | Val MedAE | Val RMSE | Test MAE ($\log_{10}$) | Test 95% Bootstrap CI | Test MedAE | Test RMSE | Test $R^2$ | Conformal Cov. (90%) | Conformal Cov. (95%) | OOD MAE |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `v4.0-ridge-ecfp4` | RIDGE | 0.6707 | 0.5776 | 0.8186 | 0.7582 | [0.5392, 1.0014] | 0.8320 | 0.8753 | -2.6126 | 100.0% | 100.0% | 0.7582 |
| `v4.0-rf-ecfp4` | RANDOM_FOREST | 0.7200 | 0.6804 | 0.8717 | 0.6701 | [0.4439, 0.9167] | 0.8264 | 0.8129 | -2.1161 | 100.0% | 100.0% | 0.6701 |
| `v4.0-gbrt-ecfp4` | GRADIENT_BOOSTING | 0.7392 | 0.6461 | 0.9059 | 0.7314 | [0.5163, 0.9685] | 0.8380 | 0.8468 | -2.3810 | 100.0% | 100.0% | 0.7314 |
| `v4.0-histgbr-ecfp4` | HIST_GRADIENT_BOOSTING | 0.7173 | 0.5871 | 0.8492 | 0.7974 | [0.6397, 0.9755] | 0.7617 | 0.8635 | -2.5160 | 100.0% | 100.0% | 0.7974 |

---

## 3. Feature Ablation & Conformal Recalibration Findings

- **Feature Pipeline A (Baseline Chemical+Biological)**: Test MAE = 0.7582 (Maintains 100% complete-case coverage).
- **Feature Pipeline B (+ Target Protein)**: Test MAE = 0.7680 (Sparse coverage for metabolic mechanisms).
- **Feature Pipeline C (+ Metabolic Annotations)**: Test MAE = 0.7490 (Bootstrap 95% CI encompasses zero; difference is not statistically significant).
- **Conformal Coverage**: Conformal empirical coverage on the future holdout increased to **100.0%** at nominal 90% and **100.0%** at nominal 95%.

---

## 4. Durability & Resistance Risk Heuristic Audit

- **Durability Formulation**: $Horizon = 25 / \sqrt{RR}$, $Durability = Horizon / 15$.
  - **Classification**: **`RESEARCH HEURISTIC`** (Retained for research tracking; non-regulatory).
- **Risk Tiers**:
  - **Classification**: **`RESEARCH HEURISTIC`**.

---

## 5. Model Promotion & Registry Governance Decision

- **Selected Candidate from Validation**: `v4.0-ridge-ecfp4` (Lowest Validation MAE = 0.6707).
- **Predefined Acceptance Gate for Production**:
  1. Validation MAE $\le 0.40$: `FAIL` (0.6707)
  2. Held-Out Test MAE $\le 0.40$: `FAIL` (0.7582)
  3. Risk Tier Accuracy $\ge 70\%$: `FAIL` (13.3%)
  4. Conformal Coverage (90%) $\ge 85\%$: `PASS` (100.0%)
- **Governance Decision**: **`REQUIRES VALIDATION`**
- **Production Baseline**: **`v2.0-gbrt-ecfp4` is preserved as the active production benchmark in the Model Registry.**
- **Frontend / API Status**: Displayed as **`RESEARCH MODE` / `MODEL STATUS: REQUIRES VALIDATION`**.
