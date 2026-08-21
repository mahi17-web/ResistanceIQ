# ResistanceIQ — Step 26 Machine Learning Model Integrity & Calibration

## 1. Locked Production Artifact Identity
The production ML baseline model is cryptographically verified and immutable:

- **Model Version**: `v2.0.0-gbrt-ecfp4`
- **File Location**: `resistanceiq/storage/models/v2.0.0-gbrt-ecfp4.joblib`
- **Locked SHA-256 Checksum**:
  `6fc915fa26716dc4a06bad71f586af95ee071acf11e9a5b8acdc5171fed55622`
- **Schema Hash**:
  `0c8ab6929f675c36e4583ca035c8311304a060cc18e1541a7ba95bbc27dc2be3`
- **Model Architecture**: `RandomForestRegressor` (60 trees, maximum features: `sqrt`, random state: 42).
- **Feature Dimensionality**: Exactly 1,059 features (ECFP4 fingerprints, physicochemical descriptors, IRAC MoA one-hot encoding, pest taxonomic hierarchy, bioassay method encoding).
- **Scientific Status**: `REQUIRES VALIDATION` (UI in `RESEARCH / VALIDATION MODE`).

---

## 2. Model Loading & Singleton Verification
- `ModelLoader.load_model()` calculates the file's SHA-256 checksum upon initial load.
- If the computed hash does not match `6fc915fa26716dc4a06bad71f586af95ee071acf11e9a5b8acdc5171fed55622`, a `ModelIntegrityError` is raised immediately, halting startup.
- Feature count is checked against `n_features_in_ == 1059`.
- Loaded artifacts are cached as an in-memory singleton to eliminate redundant disk I/O.

---

## 3. Conformal Prediction Uncertainty Bounds
- **Methodology**: Split Conformal Prediction with non-conformity score quantile $\hat{q} = 1.1783$ at significance level $\alpha = 0.10$ (90% theoretical coverage).
- **Bounded Properties**:
  - Point estimate: $\text{Resistance Ratio (RR)} = 10^{\max(0, \hat{y}_{\log_{10}})}$.
  - Lower bound: $\text{RR}_{\text{lower}} \ge 1.0$.
  - Upper bound: $\text{RR}_{\text{upper}} \ge \text{RR}_{\text{lower}}$.
  - Both bounds are guaranteed finite and non-NaN.

---

## 4. Out-of-Domain (OOD) Detection
- Computes Morgan fingerprint Tanimoto similarity against the training distribution compound set.
- Verifies representation of IRAC MoA group and target pest taxonomic order.
- Classification tiers:
  - `IN_DOMAIN`: Similarity $\ge 0.40$ with known MoA and Pest Order.
  - `LIMITED_SUPPORT`: Marginal similarity ($0.25 \le s < 0.40$) or rare bioassay method.
  - `OUT_OF_DOMAIN`: Scaffold similarity $< 0.25$ or unclassified MoA.
- When `OUT_OF_DOMAIN` is detected, conformal uncertainty bounds are widened and the UI clearly warns the researcher.
