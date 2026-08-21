# ResistanceIQ — Feature Engineering Architecture

## 1. Pipeline Execution Flow

```mermaid
graph LR
    A[Canonical Database Record] --> B[ChemistryFeatureExtractor]
    A --> C[CategoricalOneHotEncoder]
    A --> D[AssayContextEncoder]
    
    B --> E[1024-bit ECFP4 + RDKit PhysChem]
    C --> F[IRAC MoA + Pest Taxonomy]
    D --> G[Assay Protocol]
    
    E --> H[IsolatedStandardScaler (Train Fold Only)]
    F --> I[Vector Concatenation]
    G --> I
    H --> I
    
    I --> J[Final Feature Matrix X (1036 dims)]
```

---

## 2. Leakage Isolation Architecture

To prevent statistical contamination:
1. **Fit Exclusively on Training Set**: `IsolatedStandardScaler` computes feature means $\mu$ and standard deviations $\sigma$ **strictly on training fold indices ($t \le \text{Year}_{\text{cut}}$)**.
2. **Transform Only on Test / Inference**: Test and validation folds are transformed using frozen training parameters without updating internal distributions.
3. **Out-of-Vocabulary Robustness**: `CategoricalOneHotEncoder` assigns unseen categories in future years to an explicit `*_UNKNOWN` column rather than failing or silently modifying dimensionality.
