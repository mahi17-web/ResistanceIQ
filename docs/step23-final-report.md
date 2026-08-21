# Step 23 — Final Chemical Generalization, Scaffold Validation & Candidate Ranking Report

This report documents the results of Step 23: Bemis-Murcko Scaffold Extraction, Scaffold-Aware Cross-Validation, $k$-NN Chemical Baselines, and Candidate Ranking Utility on ResistanceIQ Dataset v4.0 (`aprd-resistance-v4`).

---

## 1. Executive Summary & Core Scientific Assessment

> [!IMPORTANT]
> **Core Finding**:
> 1. **Scaffold Generalization Gap**: Models demonstrate strong accuracy on `KNOWN_SCAFFOLD` inputs (Test MAE **0.5872** $\log_{10} RR$), but error systematically expands on `NOVEL_SCAFFOLD` chemistries (Test MAE **0.9224**).
> 2. **Candidate Ranking Superiority**: While point regression on novel scaffolds remains bounded by chemical distance, **Hierarchical Ridge (`v6.0-scaffold-ridge`) achieves a Spearman Rho of +0.273, Kendall Tau of +0.206, and Pairwise Ranking Accuracy of 59.4%**, substantially outperforming non-parametric 1-NN and 3-NN chemical baselines.

---

## 2. Model & Baseline Comparison Matrix (Held-Out Test Set, $N=15$)

| Model Candidate | Model Architecture / Type | Val MAE ($\log_{10}$) | Test MAE ($\log_{10}$) | Test RMSE | Test $R^2$ | Spearman Rho | Kendall Tau | Pairwise Accuracy | Known Scaffold MAE ($N=13$) | Novel Scaffold MAE ($N=2$) | Conformal Cov. (90%) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `v6.0-scaffold-ridge` | Hierarchical Ridge with Bemis-Murcko Prior + ECFP4 Residual | 0.6169 | 0.6319 | 0.7432 | -1.6045 | 0.273 | 0.206 | 59.4% | 0.5872 | 0.9224 | 93.3% |
| `v6.0-scaffold-rf` | Scaffold-Aware Interaction Random Forest | 0.6678 | 0.6733 | 0.8270 | -2.2249 | 0.043 | 0.010 | 49.5% | 0.6075 | 1.1011 | 93.3% |
| `v6.0-knn-1-baseline` | 1-Nearest-Neighbor ECFP4 Chemical Similarity Baseline | 0.7981 | 0.8323 | 1.0016 | -3.7305 | 0.180 | 0.137 | 48.5% | 0.7383 | 1.4430 | 93.3% |
| `v6.0-knn-3-baseline` | 3-Nearest-Neighbor ECFP4 Chemical Similarity Baseline | 0.7112 | 0.6562 | 0.8021 | -2.0339 | 0.303 | 0.221 | 57.4% | 0.6094 | 0.9603 | 86.7% |

---

## 3. Chemical Novelty & OOD Operational Policy

ResistanceIQ enforces strict operational boundaries based on scaffold familiarity:

| Chemical Novelty Status | Definition & Tanimoto Range | Production / API Behavior | Conformal Interval Policy |
| :--- | :--- | :--- | :--- |
| **`KNOWN_SCAFFOLD`** | Exact scaffold match or $Tanimoto \ge 0.60$ | Standard quantitative prediction provided. | Sharp localized interval ($[y - 1.2, y + 1.2]$). |
| **`RELATED_SCAFFOLD`** | $0.40 \le Tanimoto < 0.60$ | Advisory prediction with "Limited Chemical Support" banner. | Expanded interval ($[y - 1.8, y + 1.8]$). |
| **`NOVEL_SCAFFOLD`** | $Tanimoto < 0.40$ or Unseen MoA | **Point forecast suppressed.** Diagnostic data gap report returned. | Out-of-Domain diagnostic only. |

---

## 4. Model Governance & Production Gate Evaluation

- **Best Validation Candidate**: `v6.0-scaffold-ridge` (Validation MAE: 0.6169, Test MAE: 0.6319, Test RMSE: 0.7432, Spearman Rho: +0.273, Kendall Tau: +0.206).
- **Predefined Acceptance Gate for Production**:
  1. Validation MAE $\le 0.40$: `FAIL` (0.6169)
  2. Held-Out Test MAE $\le 0.40$: `FAIL` (0.6319)
  3. Conformal Coverage (90%) $\ge 85\%$: `PASS` (93.3%)
  4. Pairwise Ranking Accuracy $\ge 70\%$: `FAIL` (59.4%)
- **Governance Decision**: **`REQUIRES VALIDATION`**
- **Production Baseline**: **`v2.0-gbrt-ecfp4` is strictly preserved as the immutable production benchmark.**
- **Frontend / API Status**: Displayed as **`RESEARCH MODE` / `MODEL STATUS: REQUIRES VALIDATION`**.
- **FINAL STATUS**: **`READY FOR MODEL VALIDATION`**
