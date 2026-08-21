# ResistanceIQ — Model Acceptance Criteria

Before any model artifact is marked as `PRODUCTION_READY`, it must satisfy all 6 mandatory acceptance criteria:

---

## Acceptance Criteria Checklist

| Criterion | Requirement | Threshold | Verification Method |
|---|---|---|---|
| **1. Baseline Superiority** | Model must outperform both Global Mean and Group Mean baselines | $\text{MAE}_{\text{model}} \le 0.80 \times \text{MAE}_{\text{base}}$ | Out-of-time test holdout |
| **2. Leakage Isolation** | Zero post-hoc features (publication dates, citations, outcomes) | 100% passed | Automated feature quarantine audit |
| **3. Rank Concordance** | Model must correctly order candidates by durability | Spearman $\rho \ge 0.70$ ($p < 0.01$) | Holdout test evaluation |
| **4. Uncertainty Calibration** | Conformal prediction intervals must cover true labels | Empirical coverage $\ge 88\%$ for $\alpha=0.10$ | Conformal validation split |
| **5. OOD Safety Guard** | Novel chemistry must trigger out-of-domain notifications | 100% trigger for Tanimoto $<0.25$ | Unit tests with novel synthetic scaffolds |
| **6. Reproducibility** | Exact weights reproducible from fixed configuration seed | Identical checksum | Re-execution test suite |
