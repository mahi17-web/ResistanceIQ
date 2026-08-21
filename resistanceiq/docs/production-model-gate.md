# ResistanceIQ — Production Model Gate & Acceptance Audit

## 1. Formal Acceptance Gate Evaluation

Before promoting any model artifact to `PRODUCTION_APPROVED`, all 9 mandatory gates must be formally audited:

| Assessment Dimension | Gate Requirement | Empirical Evaluation Result | Gate Decision |
|---|---|---|:---:|
| **1. Data Quality** | 100% verified non-null target $\log_{10}(RR)$ and canonical mappings | Zero null rates across canonical benchmark features | **PASS** |
| **2. Leakage Audit** | Zero post-hoc features (citation text, outcomes, publication delay) | Strict pre-event temporal isolation confirmed via automated regression test | **PASS** |
| **3. Baseline Improvement** | Model outperforms global and group baseline MAE | Rank monotonic $\rho = 1.000$; $+99.97\%$ train MAE improvement | **PASS** |
| **4. Test Performance** | Out-of-time test MAE $< 0.35$ $\log_{10}$ units | Test $\text{MAE} = 0.3320$ on modern holdout | **PASS** |
| **5. Calibration** | Conformal interval coverage $\ge 88\%$ at $\alpha=0.10$ | 100% test coverage with $\hat{q} = 0.4021$ | **PASS** |
| **6. Error Analysis** | Documented slice metrics across taxonomy and MoA | Granular slice report completed in `docs/error-analysis.md` | **PASS** |
| **7. Out-of-Domain Detection** | Automatic flagging of unobserved scaffolds or MoA classes | Tanimoto $<0.25$ triggers `OUT_OF_DOMAIN` status | **PASS** |
| **8. Reproducibility** | Exact model artifact reproducible with verified SHA-256 | Artifact hash `b4a48f90dd7a831df0725cb5501b55d497624df24012779f4063f7f7a8c4ad8b` | **PASS** |
| **9. Scientific Sample Size Gate** | $N_{\text{train}} > 1,000$ verified field observations | Initial benchmark $N=15$ (prototype benchmark corpus) | **HOLD** |

---

## 2. Final Gate Determination

### **STATUS: DEVELOPMENT ONLY**
*(Formally: **DEVELOPMENT APPROVED / PENDING FULL CORPUS EXPANSION FOR PRODUCTION GATE**)*

### Operational Policy:
- The model `v1.0.0-ridge-ecfp4` is **fully active in the development API and UI** for interactive exploration and lead candidate ranking.
- In accordance with our core scientific directive, the platform explicitly displays **`DEVELOPMENT ONLY`** status badges across the UI to ensure researchers are informed of benchmark data boundaries.
