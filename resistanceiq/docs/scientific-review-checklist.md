# ResistanceIQ — Pre-Commercialization Scientific Review Checklist

## 1. Domain Expert Review Items

Before deploying the platform for commercial agrochemical regulatory filings or field spray recommendations, the following domain items must undergo formal peer review by senior entomologists, biochemists, and toxicologists:

- [ ] **Prediction Target Interpretation**: Verify that $\log_{10}(\text{Resistance Ratio})$ remains the standard comparative endpoint across both laboratory bioassays and field resistance surveys.
- [ ] **IRAC MoA Group Generalization**: Confirm that linear Ridge $\ell_2$ regularization provides defensible baseline predictions when querying novel chemical series within established MoA groups (e.g. Group 4A Neonicotinoids).
- [ ] **Conformal Prediction Quantile ($\hat{q} = 0.4021$)**: Review the empirical coverage audit on test bioassays to ensure 90% confidence bounds satisfy corporate risk tolerance.
- [ ] **Mutation Hotspot Energetics**: Review FoldX/PyRosetta $\Delta\Delta G$ scoring weights for target-site insensitivity residue mutations (e.g. AChE G119S, nAChR Y151S, VGSC L1014F).
- [ ] **Regulatory Disclaimer Wording**: Ensure all generated PDF/CSV dossiers include the mandatory statutory notice stating predictions constitute in-silico decision-support guidance and do not replace EPA/EFSA laboratory bioassays.
