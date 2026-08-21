# Step 19 — Final Distribution Shift & Applicability Domain Audit Report

This report documents the deep-dive analysis of distribution shift, applicability domain boundaries, feature ablations, and future data acquisition priorities for ResistanceIQ.

---

## 1. Executive Summary & Core Scientific Finding

> [!IMPORTANT]
> **Core Finding**: **All 14 held-out future test observations (2019–2024) fall outside the historical training domain ($\le 2012$).**
>
> 50.0% of the future test set consists of newly invented chemical scaffolds (Tanimoto $< 0.40$), and 35.7% represents Modes of Action (`IRAC 4E, 9D, 29, 30` and `HRAC 10`) completely absent from historical training. Negative $R^2$ and elevated test MAE ($\sim 0.81$) are direct manifestations of **chemical covariate shift**, not algorithmic defect.

---

## 2. Quantitative Shift & Novelty Profile

| Shift Dimension | Historical Train ($\le 2012$) | Future Test ($2019–2024$) | Shift Metric | Scientific Diagnosis |
| :--- | :---: | :---: | :---: | :--- |
| **Chemical Scaffolds** | 23 compounds | 11 compounds | Mean Tanimoto = 0.565 | **50.0% novel chemical scaffolds** ($Tanimoto < 0.40$) |
| **MoA Classes** | 12 classes | 8 classes | 5 Unseen MoA groups | `IRAC 30, 9D, 4E, 29` and `HRAC 10` are absent in historical data |
| **Species Diversity** | 12 species | 8 species | 1 Unseen weed species | *Amaranthus palmeri* (Palmer amaranth) |
| **Median $RR$** | $90.0\times$ | $8.5\times$ | Magnitude shift | Recent active ingredients capture early-stage resistance |
| **Flagged OOD** | 0 / 37 (0.0%) | 14 / 14 (100.0%) | 100% OOD Rate | Complete applicability domain divergence |

---

## 3. Target Reassessment & Durability Feasibility

- **Continuous Target ($\log_{10} RR$)**: **`SUPPORTED`**
  - Continuous $\log_{10}(RR)$ remains mathematically consistent across standardized dose-response bioassays. The observed variance reflects multi-copy metabolic mutations (*CYP6CY3*, *CYP6ER1*) and target-site mutations (*RyR-I4790M*, *GABA-Rdl*) in newly exposed field populations.
- **Durability Formulation ($25 / \sqrt{RR}$)**: **`RESEARCH HEURISTIC`**
  - Longitudinal series ($N=14$) demonstrate progressive accumulation, but continuous multi-year cohort panels remain insufficient for formal survival / hazard regression.

---

## 4. Statistical Interpretation of Feature Ablations

- **Pipeline A (Baseline Chemical+Bio)**: Test MAE = 0.8097
- **Pipeline B (+ Target Protein)**: Test MAE = 0.8120 (introduces missingness noise for non-target mechanisms)
- **Pipeline C (+ Metabolic Descriptors)**: Test MAE = 0.7950 ($\Delta = 0.0147$)
- **Bootstrap 95% CI of Difference**: **$[-0.0146, +0.0301]$** (includes zero; difference is **not statistically significant**).

---

## 5. Conformal Prediction Recalibration Analysis

- **Observed Empirical Coverage**: **50.0%** (Nominal 90% and 95%).
- **Diagnosis**: Standard split conformal prediction assumes exchangeability between validation and test residuals. Under extreme chemical covariate shift (50% novel scaffolds), prediction uncertainty intervals are undersized unless adjusted by **Covariate-Shift-Aware Conformal Weights**.

---

## 6. Future Data Acquisition Strategy

To reduce Out-of-Domain behavior and expand the model's verified forecasting horizon, data acquisition must prioritize:

1. **Priority 1 (Same Species + New Chemicals)**: Ingest baseline bioassays for novel post-2015 active ingredients (Broflanilide, Afidopyropen, Triflumezopyrim, Tetraniliprole) across major agricultural insect pests (*M. persicae*, *P. xylostella*, *S. frugiperda*).
2. **Priority 2 (Longitudinal Target Series)**: Expand continuous time-series bioassays for high-risk MoAs (IRAC Group 28 diamides, Group 4A neonicotinoids, Group 6 avermectins).
3. **Priority 3 (Metabolic Gene Copy-Number Panels)**: Link transcriptomic and copy-number variation panels (*CYP6CY3*, *GSTe2*) to quantitative $\text{LC}_{50}$ bioassay measurements.

---

## 7. Model Re-Training Decision & Final Status

- **Model Re-Training Decision**: **`A. DATA DOMAIN EXPANSION REQUIRED`** & **`C. FEATURE REPRESENTATION REQUIRES REVISION`**
- **Model Status**:
  - **`v2.0-gbrt-ecfp4` is strictly retained as the production benchmark.**
  - **All v3 candidate models remain classified as `REQUIRES VALIDATION`.**
  - **Zero unearned promotion to `PRODUCTION` is granted.**
- **FINAL STATUS**: **`REQUIRES MORE DATA`**
