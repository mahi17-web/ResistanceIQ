# Step 21 — Uncertainty Sharpness & OOD Decision Policy

This document evaluates the predictive utility and sharpness of conformal prediction intervals and establishes the explicit Out-of-Distribution (OOD) decision policy for ResistanceIQ.

---

## 1. Uncertainty Sharpness vs. Empirical Coverage

| Conformal Metric | Nominal 90% Bound | Nominal 95% Bound | Scientific Assessment |
| :--- | :---: | :---: | :--- |
| **Calibration Quantile ($\hat{q}$)** | **1.470 $\log_{10}$ units** | **1.649 $\log_{10}$ units** | Computed on 2013–2018 validation residuals. |
| **Total Interval Width ($2\hat{q}$)** | **2.941 $\log_{10}$ units** | **3.297 $\log_{10}$ units** | Span of the prediction interval $[y - \hat{q}, y + \hat{q}]$. |
| **Linear Scale Multiplier ($10^{2\hat{q}}$)** | **$872.6\times$** | **$1982.6\times$** | Range of possible resistance ratios enclosed. |
| **Empirical Coverage on Future Test Set** | **100.0%** | **100.0%** | **Valid but conservative**: 100% coverage is achieved via wide bounds. |

### Sharpness Diagnosis:
- The global split conformal method produces a uniform interval width ($\pm 1.47 \log_{10}$ units) across all chemical classes.
- For well-supported chemical classes (e.g. pyrethroids, organophosphates), this interval is overly conservative; for sparse or novel classes, uniform intervals may hide localized epistemic uncertainty.
- **Methodology Recommendation**: Implement **Localized Conformal Calibration (CQR)** or **Heteroscedastic Residual Scaling** to contract intervals for high-confidence predictions and expand them for lower-confidence inputs.

---

## 2. Formal OOD Decision Policy

ResistanceIQ defines strict operational responses based on input domain support:

```
                  ┌─────────────────────────────────────────────────┐
                  │          Input Chemical & Target Query          │
                  └────────────────────────┬────────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        │   Domain Applicability Detector     │
                        └──────────────────┬──────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │ (Tanimoto >= 0.40 & MoA seen)   │ (0.25 <= Tanimoto < 0.40)       │ (Tanimoto < 0.25 or Unseen MoA)
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌────────────────────┐            ┌──────────────────┐
│    IN_DOMAIN     │             │  LIMITED_SUPPORT   │            │  OUT_OF_DOMAIN   │
├──────────────────┤             ├────────────────────┤            ├──────────────────┤
│ Standard Point   │             │ Advisory Point     │            │ No Ordinary      │
│ Forecast + Sharp │             │ Forecast + WIDENED │            │ Point Forecast;  │
│ Calibrated       │             │ Uncertainty Bounds │            │ Flagged as OOD;  │
│ Uncertainty      │             │ + Clear Caveat     │            │ Scientific Audit │
│ Interval.        │             │ Banner.            │            │ Only.            │
└──────────────────┘             └────────────────────┘            └──────────────────┘
```

1. **`IN_DOMAIN`**:
   - Condition: $Tanimoto \ge 0.40$, target species seen, MoA seen.
   - Action: Standard forecast with calibrated sharp uncertainty intervals.
2. **`LIMITED_SUPPORT`**:
   - Condition: $0.25 \le Tanimoto < 0.40$ or novel geographic region.
   - Action: Output forecast with prominent "Limited Empirical Support" warning and expanded conformal interval.
3. **`OUT_OF_DOMAIN`**:
   - Condition: $Tanimoto < 0.25$ or unrepresented MoA/Taxonomic Order.
   - Action: **Suppress point forecast.** Return diagnostic audit indicating data acquisition required.
