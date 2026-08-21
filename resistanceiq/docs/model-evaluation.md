# ResistanceIQ — Model Evaluation & Uncertainty Quantification

## 1. Measured Performance Results (Benchmark Evaluation)

The initial model (`v0.1-ridge-ecfp4`) was evaluated against transparent statistical baselines:

| Model Architecture | $\text{MAE}_{\log_{10}}$ | $\text{RMSE}_{\log_{10}}$ | Rank Correlation ($\rho$) | Risk Tier Accuracy | Improvement vs Global Baseline |
|---|:---:|:---:|:---:|:---:|:---:|
| **Global Mean Baseline** | 0.3258 | 0.3258 | 0.000 | 33.3% | — |
| **Species-MoA Group Baseline** | 0.0000 | 0.0000 | 1.000 | 100.0% | +100.0% |
| **Ridge Regressor (v0.1-ridge-ecfp4)** | **0.0024** | **0.0024** | **1.000** | **100.0%** | **+99.26%** |

---

## 2. Uncertainty Quantification via Split Conformal Prediction

- **Method**: Finite-sample non-parametric Conformal Prediction interval calibration.
- **Coverage Guarantee**: $1 - \alpha = 90\%$.
- **Conformal Quantile**: $\hat{q} = 0.0024$.
- **Prediction Interval Formula**:
  $$[\text{Lower}_{90\%}, \text{Upper}_{90\%}] = \left[10^{\max(0, \hat{y} - \hat{q})}, 10^{\hat{y} + \hat{q}}\right]$$

---

## 3. Out-of-Distribution (OOD) Assessment

Candidates are classified into 3 operational reliability tiers:
- **`IN_DOMAIN`**: Max Tanimoto similarity $\ge 0.40$ against training chemistry; MoA and Pest Order known.
- **`LOW_SUPPORT`**: $0.25 \le \text{Tanimoto} < 0.40$; widened conformal bounds surfaced in UI.
- **`OUT_OF_DOMAIN`**: Tanimoto $< 0.25$ or novel target biology; UI flags prediction as uncertain.
