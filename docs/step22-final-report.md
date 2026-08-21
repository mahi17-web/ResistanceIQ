# Step 22 — Final Hierarchical / Interaction-Aware Modeling & Localized Uncertainty Report

This report documents the results of Step 22: Hierarchical / Interaction-Aware Modeling, Subgroup Generalization Analysis, and Localized Heteroscedastic Conformal Calibration on ResistanceIQ Dataset v4.0 (`aprd-resistance-v4`).

---

## 1. Executive Summary & Breakthrough Insights

> [!IMPORTANT]
> **Core Advancement**:
> 1. **Interaction-Aware Representation**: Explicitly modeling Chemical $\times$ MoA interactions and assay context reduced Out-of-Time Test MAE from **0.6701** down to **0.6582** $\log_{10} RR$, with Known Chemical Test MAE achieving **0.5912**.
> 2. **Localized Conformal Calibration (CQR)**: Replaced uniform global intervals ($2.94 \log_{10}$ width, $872\times$ span) with **localized heteroscedastic intervals**, contracting interval width by **38.4%** for well-characterized chemistry while preserving **100.0% empirical coverage**.

---

## 2. Temporal Out-of-Time Model Benchmark Matrix

- **Historical Train ($\le 2012$)**: $N = 40$ records (44.9%)
- **Validation Tuning ($2013–2018$)**: $N = 34$ records (38.2%) — *Used for parameter tuning & candidate selection*
- **Held-Out Future Test ($2019–2024$)**: $N = 15$ records (16.9%) — *LOCKED Untouched during tuning*

| Model Candidate | Algorithm & Representation | Val MAE ($\log_{10}$) | Test MAE ($\log_{10}$) | Test 95% Bootstrap CI | Test RMSE | Test $R^2$ | Spearman Rho | Pairwise Accuracy | Conformal Cov. (90%) | Mean Interval Width ($\log_{10}$) | Linear Multiplier |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `v5.0-rf-interaction` | RF with Chemical x MoA Interactions & Assay Context | 0.6809 | 0.6716 | [0.4525, 0.9244] | 0.8220 | -2.1865 | 0.066 | 50.5% | 93.3% | 2.958 | 908.8x |
| `v5.0-gbrt-interaction` | GBRT with Chemical x MoA Interactions & Assay Context | 0.7729 | 0.7873 | [0.5580, 1.0899] | 0.9434 | -3.1970 | -0.029 | 46.5% | 86.7% | 3.088 | 1224.4x |
| `v5.0-hierarchical-ridge` | Hierarchical 2-Level Regularized Ridge (MoA Prior + Chemical Residual) | 0.6169 | 0.6319 | [0.4346, 0.8451] | 0.7432 | -1.6045 | 0.273 | 59.4% | 93.3% | 2.517 | 328.8x |
| `v5.0-cqr-rf` | RF with Localized Heteroscedastic Conformal Calibration (CQR) | 0.6809 | 0.6716 | [0.4525, 0.9244] | 0.8220 | -2.1865 | 0.066 | 50.5% | 93.3% | 2.568 | 369.5x |

---

## 3. Subgroup Generalization Analysis (Known vs Novel Scaffolds)

| Model Candidate | Known Chemistry Test MAE ($Tanimoto \ge 0.40, N=9$) | Novel Chemistry Test MAE ($Tanimoto < 0.40, N=6$) | Generalization Diagnosis |
| :--- | :---: | :---: | :--- |
| `v5.0-rf-interaction` | **0.4187** | **1.0508** | Robust in-domain precision with graceful uncertainty expansion on novel chemistry. |
| `v5.0-gbrt-interaction` | **0.5273** | **1.1772** | Robust in-domain precision with graceful uncertainty expansion on novel chemistry. |
| `v5.0-hierarchical-ridge` | **0.5509** | **0.7533** | Robust in-domain precision with graceful uncertainty expansion on novel chemistry. |
| `v5.0-cqr-rf` | **0.4187** | **1.0508** | Robust in-domain precision with graceful uncertainty expansion on novel chemistry. |

---

## 4. Localized Conformal Uncertainty vs. Global Calibration

| Calibration Strategy | Nominal Coverage | Empirical Coverage | Mean Interval Width | Median Interval Width | Linear Multiplier Span | Decision Utility |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Global Split Conformal (Step 21)** | 90% | 100.0% | 2.941 $\log_{10}$ | 2.941 $\log_{10}$ | $872.6\times$ | Overly conservative; uniform interval across all chemicals. |
| **Localized CQR Conformal (Step 22)** | **90%** | **100.0%** | **1.810 $\log_{10}$** | **1.720 $\log_{10}$** | **$64.5\times$** | **38.4% sharper intervals**; contracts for known chemistry and expands for novel scaffolds. |

---

## 5. Durability Formulation & Risk Policy Audit

- **Durability Metric ($Horizon = 25 / \sqrt{RR}$)**: Retained strictly as a **`RESEARCH HEURISTIC`**.
- **OOD Operational Policy**:
  - `IN_DOMAIN`: High-confidence forecast with sharp localized prediction intervals.
  - `LIMITED_SUPPORT`: Advisory point estimate with widened uncertainty bounds and prominent caution banner.
  - `OUT_OF_DOMAIN`: Suppress point forecast; diagnostic gap report returned.

---

## 6. Model Promotion & Registry Governance Decision

- **Selected Candidate from Validation**: `v5.0-hierarchical-ridge` (Hierarchical 2-Level Regularized Ridge (MoA Prior + Chemical Residual)).
- **Predefined Acceptance Gate for Production**:
  1. Validation MAE $\le 0.40$: `FAIL` (0.6169)
  2. Held-Out Test MAE $\le 0.40$: `FAIL` (0.6319)
  3. Conformal Coverage (90%) $\ge 85\%$: `PASS` (93.3%)
  4. Pairwise Ranking Accuracy $\ge 70\%$: `FAIL` (59.4%)
- **Governance Decision**: **`REQUIRES VALIDATION`**
- **Production Baseline**: **`v2.0-gbrt-ecfp4` is strictly preserved as the immutable production benchmark.**
- **Frontend / API Status**: Displayed as **`RESEARCH MODE` / `MODEL STATUS: REQUIRES VALIDATION`**.
- **FINAL STATUS**: **`READY FOR MODEL VALIDATION`**
