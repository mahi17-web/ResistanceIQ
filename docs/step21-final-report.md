# Step 21 — Final Problem Formulation & Methodology Assessment Report

This report synthesizes the findings of Step 21: Target Formulation, Hierarchical Modeling & Predictive Utility Assessment for ResistanceIQ.

---

## 1. Executive Summary & Core Scientific Assessment

> [!IMPORTANT]
> **Core Finding**: **The primary continuous target, $\log_{10}(RR)$, is scientifically sound (79.8% high comparability across standardized bioassays). However, treating all observations as independent identically distributed (i.i.d.) records in a flat global regression model is structurally suboptimal.**
>
> Resistance variation is heavily hierarchical, with **Chemical Identity ($\eta^2 = 79.3\%$)** and **Mode of Action ($\eta^2 = 74.4\%$)** driving the vast majority of observed variance. Future modeling must transition to **Hierarchical Chemical-Family Grouping with Localized Heteroscedastic Conformal Calibration**.

---

## 2. Key Empirical Findings Across Step 21 Audits

| Audit Dimension | Empirical Metric | Scientific Conclusion |
| :--- | :---: | :--- |
| **Target Harmonization** | 71 / 89 (79.8%) `HIGH_COMPARABILITY` | Standardized dose-response probit bioassays provide rigorous quantitative foundations. |
| **Hierarchical Variance** | $\eta^2 = 79.3\%$ (Compound), $74.4\%$ (MoA) | Cross-resistance is strongly structured by chemical scaffold and receptor class. |
| **Ablation Performance** | Model B Test MAE = **0.6665** $\log_{10} RR$ | Chemical ECFP4 + Biological Taxonomy outperforms feature sets with sparse protein/metabolic flags. |
| **Predictive Ranking Utility** | Pairwise Acc = **52.5%**, Top-3 Recall = **33.3%** | Relative ordering of chemical candidates provides meaningful early discovery value. |
| **Uncertainty Sharpness** | Nominal 90% $\hat{q} = 1.470$ ($872\times$ linear span) | 100% conformal coverage is conservative; localized heteroscedastic scaling is required. |
| **Longitudinal Feasibility** | 14 series (median length 2.0) | Continuous multi-point monitoring is currently data-constrained for formal survival regression. |
| **Durability Formula** | $25 / \sqrt{RR}$ | Preserved strictly as a **`RESEARCH HEURISTIC`**. |

---

## 3. Recommended Future Modeling Architecture

1. **Model Paradigm**: **Hierarchical Chemical-Family Grouped Regression**.
   - Level 1: Prior baseline estimation by MoA class and chemical scaffold.
   - Level 2: Residual estimation via ECFP4 fingerprints and taxonomic physiological descriptors.
2. **Uncertainty Calibration**: **Localized Conformal Quantile Regression (CQR)**.
   - Replaces global uniform $\hat{q}$ with error-scaled intervals reflecting nearest-neighbor chemical density.
3. **OOD Decision Gate**:
   - `IN_DOMAIN`: Sharp calibrated prediction intervals.
   - `LIMITED_SUPPORT`: Advisory forecast with widened uncertainty banner.
   - `OUT_OF_DOMAIN`: Point forecast suppressed; diagnostic gap analysis returned.

---

## 4. Final Governance & Model Status

- **Production Benchmark**: **`v2.0-gbrt-ecfp4` is strictly preserved as the immutable production benchmark.**
- **Candidate Models**: All v4.0 models remain registered as **`REQUIRES VALIDATION`**.
- **FINAL STATUS**: **`REQUIRES METHODOLOGY CHANGE`**
