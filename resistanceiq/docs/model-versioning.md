# ResistanceIQ — Model Versioning & Artifact Lineage

## 1. Versioning Semantics

ResistanceIQ adopts strict semantic model versioning:

$$\mathbf{v[\text{Major}].[\text{Minor}].[\text{Patch}]-[\text{Algorithm}]-[\text{FeatureSet}]}$$

- **Major** (e.g. `v1`): Fundamental shifts in prediction target (e.g. discrete risk classification vs continuous $\log_{10}(RR)$).
- **Minor** (e.g. `v1.0`): Dataset expansions or structural feature pipeline revisions.
- **Patch** (e.g. `v1.0.0`): Regularization hyperparameter adjustments or bug fixes.

---

## 2. Lineage Chain

Every trained model stores its complete dependency chain:
1. `source_dataset_version`: `v1.0-aprd-canonical`
2. `feature_version`: `v1.0-ecfp4-irac`
3. `code_version`: `v1.0.0`
4. `artifact_sha256`: Cryptographic checksum ensuring the model binary cannot be silently altered or substituted.

---

## 3. Backward Compatibility Guarantee

Historical forecasts persisted in PostgreSQL retain their original `model_version` tag indefinitely. Re-running historical backtests queries the immutable archived joblib artifact using `ModelLoader.load_model(version)` to guarantee numerical reproducibility.
