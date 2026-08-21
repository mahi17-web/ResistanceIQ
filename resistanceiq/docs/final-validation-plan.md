# ResistanceIQ — Final Scientific Validation Plan

## 1. Splitting Protocols

To prevent memorization and ensure real-world generalization, ResistanceIQ enforces a dual validation partition:

### 1.1 Out-of-Time Temporal Holdout Split
- **Training Set ($\le 2000$)**: Historical foundation data ($N = 10$ benchmark cases; 67%).
- **Validation Set ($2001 – 2010$)**: Intermediate tuning split ($N = 3$ benchmark cases; 20%).
- **Test Holdout ($2011 – 2026$)**: Modern blind evaluation ($N = 2$ benchmark cases; 13%).

### 1.2 Chemical Scaffold Disjoint Split (Bemis-Murcko Holdout)
- When expanding to larger chemical libraries, all structural analogs sharing a core Murcko generic framework (e.g. all pyrethroid ester cores or neonicotinoid heterocyclic cores) are clustered into identical splits to test generalization to novel scaffolds.

---

## 2. Evaluation Metrics

1. **Continuous Regression ($\log_{10}(RR)$)**:
   - $\text{MAE}_{\log_{10}}$: Target goal $< 0.35$ (Factor of $<2.2\times$).
   - $\text{RMSE}_{\log_{10}}$: Penalizes extreme prediction failures.
   - Spearman's Rank Correlation ($\rho$): Verifies correct relative ordering of candidates.
2. **Ordinal Risk Classification**:
   - Macro F1-Score across 4 risk tiers.
   - Linearly Weighted Cohen's $\kappa$.
3. **Uncertainty Quantification**:
   - Conformal Prediction 90% Empirical Coverage on holdout test set.
