# ResistanceIQ — Data & Model Drift Monitoring Strategy

## 1. Scope & Purpose

Biological and agrochemical discovery environments evolve as pests develop target-site insensitivity and new chemical MoA classes are commercialized. This specification establishes quantitative drift detection protocols for candidate queries and field monitoring records.

---

## 2. Input Data Drift Detection

Input data drift is evaluated on every inference query using two complementary methods:

### 2.1 Chemical Applicability Domain (Tanimoto Fingerprint Distance)
- **Feature Space**: 1,024-bit Morgan ECFP4 Circular Fingerprints.
- **Metric**: Maximum Tanimoto Similarity $T_{\max}(\mathbf{x}) = \max_{j \in \text{Train}} \frac{|\mathbf{x} \cap \mathbf{x}_j|}{|\mathbf{x} \cup \mathbf{x}_j|}$.
- **Thresholds**:
  - $T_{\max} \ge 0.40$: `IN_DOMAIN` (High Confidence)
  - $0.25 \le T_{\max} < 0.40$: `LIMITED_SUPPORT` (Moderate Confidence, Widened Conformal Bounds)
  - $T_{\max} < 0.25$: `OUT_OF_DOMAIN` (Low Confidence / Novel Chemotype Alert)

### 2.2 Biological Taxonomic & IRAC MoA Coverage
- Checks whether the candidate's IRAC MoA class and Target Pest Order exist in the baseline training index.
- If unrepresented, the query is assigned `OUT_OF_DOMAIN` status, and the UI provides actionable guidance to the research team.

---

## 3. Ground-Truth & Model Drift Monitoring (Post-Release)

As new post-2026 bioassay records and field control failure reports are ingested into APRD:
1. **Residual Drift Tracking**: Compute quarterly rolling $\text{MAE}_{\log_{10}}$ and $\text{RMSE}$ on newly published field cases.
2. **Conformal Coverage Audit**: Verify empirical coverage remains $\ge 88\%$ at $\alpha=0.10$. If coverage drops below $85\%$, flag for retraining.
3. **Trigger for Model Retraining**: If $\text{MAE}_{\log_{10}}$ increases by $> 25\%$ over baseline ($0.332 \to > 0.415$), trigger automated candidate evaluation pipeline across candidate architectures (Ridge, Random Forest, GBDT).
