# ResistanceIQ — Model Training & Baseline Architecture

## 1. Training Setup & Reproducibility

Every training run executes from a declarative configuration:
- **Target Variable**: Continuous Log Resistance Ratio $\mathbf{\log_{10}(RR)}$.
- **Feature Pipeline Version**: `v1.0-ecfp4-irac` (1,036 dimensions).
- **Split Protocol**: Out-of-Time Temporal Holdout ($\text{Train} \le 2000$, $\text{Val} = 2001–2010$, $\text{Test} = 2011–2026$).
- **Random Seed**: Fixed `42` across NumPy and Scikit-Learn.

---

## 2. Model Family Hierarchy

1. **Global Mean Baseline**:
   $$\hat{y} = \text{mean}(y_{\text{train}})$$
2. **Species-MoA Group Mean Baseline**:
   $$\hat{y} = \text{mean}(y_{\text{train}} \mid \text{Pest Order}, \text{IRAC MoA Group})$$
3. **$\ell_2$-Regularized Ridge Regressor**:
   $$\min_{\mathbf{w}} \|\mathbf{y} - \mathbf{X}\mathbf{w}\|_2^2 + \alpha \|\mathbf{w}\|_2^2$$
   - **$\alpha = 1.0$**: Prevents overfitting across the 1,024-dimensional ECFP4 fingerprint space.
   - **Linear Additivity**: Guarantees interpretable feature weights.
