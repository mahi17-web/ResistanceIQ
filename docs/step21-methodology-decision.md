# Step 21 — Methodology Decision Matrix

This document provides definitive scientific answers to the 11 methodology questions established in the Step 21 problem formulation audit.

---

## 1. The 11 Core Methodology Decisions

### 1. Is $\log_{10}(RR)$ a suitable primary target?
- **Decision**: **YES (SUPPORTED)**.
- **Rationale**: 100% of canonical records support $\log_{10}(RR)$ with 79.8% meeting `HIGH_COMPARABILITY` lab standards. Continuous logarithmic scale linearizes exponential biological selection and prevents skewed dominance by extreme resistance ratios ($> 1000\times$).

### 2. Are assay measurements sufficiently harmonized?
- **Decision**: **YES, WITH EXPLICIT ASSAY CONTROLS**.
- **Rationale**: Leaf-dip, topical, and diet incorporation protocols account for 39.1% of baseline variance ($\eta^2 = 39.1\%$). Ingesting assay method as an explicit covariate resolves procedural discrepancies.

### 3. Are hierarchical effects important?
- **Decision**: **YES (CRITICAL)**.
- **Rationale**: Chemical compound identity explains 79.3% and MoA class explains 74.4% of total resistance variance. Flat i.i.d. regression ignores this strong grouping structure.

### 4. Are temporal features valid at prediction time?
- **Decision**: **CONDITIONAL (TIME-SINCE-LAUNCH ONLY)**.
- **Rationale**: Chronological observation year risks temporal overfitting. Time-since-commercialization ($t - t_0$) is legitimately known at prediction time and captures field exposure age.

### 5. Are protein features useful?
- **Decision**: **NO FOR PRIMARY REGRESSION; USEFUL FOR STRUCTURAL AUDITING**.
- **Rationale**: 3D protein structures are available for direct targets (RyR, AChE, GluCl) but missing for metabolic and weed mechanisms, causing imputation noise (Ablation Model E Test MAE = 0.7278 vs 0.6665 for Model B).

### 6. Are metabolic features useful?
- **Decision**: **NO FOR PRE-TREATMENT PREDICTION; USEFUL FOR CONFIRMATORY DIAGNOSTICS**.
- **Rationale**: P450/GST overexpression is an emergent post-selection field state, not a prior chemical descriptor available at design time.

### 7. Is ranking useful?
- **Decision**: **YES (HIGH PRACTICAL UTILITY)**.
- **Rationale**: In agrochemical discovery and resistance management, correctly ordering compound candidates by relative resistance risk (Pairwise Accuracy = 52.5%, Top-3 High-Risk Recall = 33.3%) is more actionable than exact point calibration.

### 8. Is the current uncertainty useful?
- **Decision**: **REQUIRES RECALIBRATION FOR SHARPNESS**.
- **Rationale**: Current conformal coverage is 100%, but uniform interval width ($\pm 1.47 \log_{10}$ units) spans $872\times$ in linear $RR$. Heteroscedastic localized calibration is required.

### 9. Is longitudinal modeling feasible?
- **Decision**: **NOT CURRENTLY FEASIBLE (DATA CONSTRAINED)**.
- **Rationale**: Dataset v4 contains 14 longitudinal series with a median length of 2.0 observations. Formal survival / Cox hazard modeling requires continuous multi-point cohort monitoring panels.

### 10. Is the $25/\sqrt{RR}$ durability heuristic defensible?
- **Decision**: **RETAIN AS RESEARCH HEURISTIC ONLY**.
- **Rationale**: The formula serves as an intuitive qualitative risk index but is not an empirically validated survival estimator. It must remain clearly labeled as `RESEARCH HEURISTIC`.

### 11. What model formulation should be pursued next?
- **Decision**: **HIERARCHICAL CHEMICAL-FAMILY REGRESSION + LOCALIZED HETEROSCEDASTIC CONFORMAL CALIBRATION**.
- **Rationale**: Combines chemical ECFP4/physicochemical representations with MoA/Taxonomy hierarchical grouping and variance-adaptive prediction intervals.
