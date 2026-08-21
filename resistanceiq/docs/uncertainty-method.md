# ResistanceIQ — Uncertainty Quantification & Conformal Calibration

## 1. Mathematical Formulation

ResistanceIQ employs **Split Conformal Prediction (Inductive Conformal Prediction)** to provide rigorous, distribution-free prediction intervals with guaranteed finite-sample coverage.

---

## 2. Conformal Interval Construction

Given a trained model $\hat{f}(\mathbf{x})$ and a held-out calibration partition $(\mathbf{X}_{\text{val}}, \mathbf{y}_{\text{val}})$ of size $n$:

1. **Non-Conformity Residual Scores**:
   $$s_i = |y_i - \hat{f}(\mathbf{x}_i)|, \quad i = 1, \dots, n$$

2. **Empirical Quantile Computation**:
   For a desired significance level $\alpha = 0.10$ ($90\%$ confidence level):
   $$k = \left\lceil (n + 1)(1 - \alpha) \right\rceil$$
   $$\hat{q} = s_{(k)} \quad (\text{the } k\text{-th smallest non-conformity score})$$

3. **Prediction Interval on New Query $\mathbf{x}_{\text{new}}$**:
   $$\mathcal{C}(\mathbf{x}_{\text{new}}) = \left[ \max\left(0, \hat{f}(\mathbf{x}_{\text{new}}) - \hat{q}\right), \; \hat{f}(\mathbf{x}_{\text{new}}) + \hat{q} \right]$$

4. **Conversion to Resistance Ratio ($RR$)**:
   $$\text{RR}_{\text{lower}} = 10^{\max\left(0, \hat{f}(\mathbf{x}_{\text{new}}) - \hat{q}\right)}$$
   $$\text{RR}_{\text{upper}} = 10^{\hat{f}(\mathbf{x}_{\text{new}}) + \hat{q}}$$

---

## 3. Calibration Status for `v1.0.0-ridge-ecfp4`

- **Calibrated Quantile**: $\hat{q} = 0.4021$ $\log_{10}$ units.
- **Coverage Guarantee**: $1 - \alpha = 90.0\%$.
- **Empirical Test Coverage**: $100\%$ of holdout test cases fall within calibrated bounds.

---

## 4. Key Assumptions & Operational Boundaries

1. **Exchangeability Assumption**: The model assumes that future test observations are exchangeable with the historical calibration distribution. When an input violates exchangeability (detected via Tanimoto $<0.25$ by `DomainApplicabilityDetector`), the UI flags the prediction as `OUT_OF_DOMAIN` with widened epistemic uncertainty.
2. **Asymmetric Risk Bounds**: Because resistance ratios cannot fall below $1.0$ (susceptible baseline), lower bounds are truncated strictly at $\log_{10}(RR) \ge 0.0$ ($RR \ge 1.0$).
