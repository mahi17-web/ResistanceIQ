# ResistanceIQ — ML Model Options & Algorithm Evaluation

This document analyzes candidate modeling approaches for pesticide resistance forecasting, comparing their mathematical formulations, feature compatibility, interpretability, and suitability across development phases.

---

## 1. Candidate Modeling Paradigms

```
                               ┌────────────────────────────────────────┐
                               │  ResistanceIQ Predictive Paradigms     │
                               └──────────────────┬─────────────────────┘
                                                  │
         ┌────────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                        ▼                                      ▼
┌──────────────────┐                    ┌──────────────────┐                   ┌──────────────────┐
│ 1. Continuous RR │                    │ 2. Ordinal Risk  │                   │ 3. Survival Time │
│    Regression    │                    │  Classification  │                   │  to Field Event  │
│  (Log10 Ratio)   │                    │ (Susceptible->   │                   │ (Cox / Survival  │
│  Ridge, XGBoost  │                    │     Critical)    │                   │     Forests)     │
└──────────────────┘                    └──────────────────┘                   └──────────────────┘
```

---

## 2. Model Family Analysis

### Approach 1: Continuous Resistance Ratio Regression

* **Target Variable**: $y = \log_{10}(RR) \in \mathbb{R}$
* **Suitable Algorithms**:
  1. **Regularized Linear / Ridge Regression** ($\ell_2$-regularized baseline)
  2. **Gradient Boosted Decision Trees** (LightGBM / XGBoost / CatBoost)
  3. **Random Forest Regressor** (for non-linear descriptor interactions)
* **Feature Representation**:
  - Chemical: Morgan circular fingerprints (ECFP4, 1024-bit), RDKit physicochemical descriptors (MW, LogP, TPSA, HBD, HBA).
  - Target: One-hot IRAC MoA group + Target-site binding pocket amino acid substitution vector.
  - Biological / Demographics: Pest voltinism ($\log_{10}(\text{generations/yr})$), typical population size.
  - Historical context: Cumulative years since initial commercial introduction.
* **Evaluation Metrics**: Mean Absolute Error ($\text{MAE}_{\log_{10}}$), Root Mean Squared Error ($\text{RMSE}$), Coefficient of Determination ($R^2$), Spearman Rank Correlation ($\rho$).
* **Pros**: Preserves exact quantitative bioassay signal; straightforward loss functions ($\text{MSE}$, $\text{Huber Loss}$).
* **Cons**: Bioassay experimental noise across different laboratories limits maximum achievable $R^2$.

---

### Approach 2: Ordinal Risk Classification (4 Tiers)

* **Target Variable**: $y \in \{\text{Susceptible}, \text{Tolerance}, \text{Moderate}, \text{Critical}\}$
* **Suitable Algorithms**:
  1. **Ordinal Logistic Regression / Proportional Odds Model**
  2. **Multi-class LightGBM** with custom ordinal penalty matrix
  3. **Cost-Sensitive Random Forest**
* **Evaluation Metrics**: Multi-class Macro F1-score, Ordinal Weighted Cohen's Kappa ($\kappa$), One-vs-Rest ROC-AUC, Expected Calibration Error (ECE).
* **Pros**: Highly resilient to laboratory bioassay noise; matches agricultural risk-tier decision frameworks.
* **Cons**: Discards fine-grained differences between molecules within the same risk band.

---

### Approach 3: Survival Analysis / Time-to-Resistance Modeling

* **Target Variable**: $(T_i, \delta_i)$ where $T_i$ is elapsed years to resistance and $\delta_i \in \{0, 1\}$ is the event censoring indicator (1 = resistance documented, 0 = still effective at time of study).
* **Suitable Algorithms**:
  1. **Cox Proportional Hazards Model** (Semi-parametric baseline)
  2. **Random Survival Forests (RSF)** (Non-parametric tree ensemble)
  3. **DeepSurv** (Neural network survival analysis)
* **Evaluation Metrics**: Harrell's Concordance Index (C-Index), Integrated Brier Score (IBS), Time-dependent Cumulative Dynamic AUC.
* **Pros**: Directly models the duration of field effectiveness while properly handling right-censored data (active ingredients that have not yet developed resistance).
* **Cons**: Requires accurate historical commercial release dates and continuous regional monitoring datasets.

---

## 3. Mandatory Baseline Models

To prevent deceptive model claims, every advanced model must be benchmarked against these 4 non-trivial baselines:

| Baseline Model | Formulation | Purpose |
|---|---|---|
| **1. Global Mean / Majority Baseline** | $\hat{y} = \frac{1}{N}\sum y_i$ | Verifies the model learns beyond dataset central tendency |
| **2. Target-Species Historic Group Mean** | $\hat{y} = \text{mean}(RR \mid \text{MoA}, \text{Pest})$ | Verifies molecular descriptors add value over simple IRAC group lookups |
| **3. Simple Ridge Linear Model** | $\hat{y} = \mathbf{w}^T \mathbf{x} + b$ with $\alpha=1.0$ | Benchmarks linear additive feature contributions |
| **4. Historic Time Trend Extrapolation** | $\hat{y} = \beta_0 + \beta_1 \cdot (\text{Years Since Introduction})$ | Benchmarks simple time-passage effect |

---

## 4. Recommended Multi-Phase Modeling Roadmap

1. **Phase 1 (MVP Foundation)**:
   - **Primary Model**: **LightGBM Regressor** predicting $\log_{10}(RR)$ with Morgan fingerprints (ECFP4) and IRAC target features.
   - **Baseline Comparison**: Benchmark against Ridge Regression and Species-MoA Group Mean.
2. **Phase 2 (Probabilistic & Trajectory Layer)**:
   - Apply Isotonic / Platt Calibration to output calibrated probabilities of resistance exceeding critical threshold ($RR > 10$) across 1, 3, 5, and 10 year projection windows.
3. **Phase 3 (Full Biophysical Integration)**:
   - Incorporate explicit AutoDock Vina / GNINA docking binding energy shifts ($\Delta\Delta G$) for specific target mutations (e.g., AChE1 G119S, VGSC kdr).
