# ResistanceIQ — Real-Time Inference Architecture

## 1. Inference Pipeline Overview

The ResistanceIQ inference engine executes high-throughput, calibrated resistance forecasts from raw SMILES strings and biological context parameters:

```mermaid
graph TD
    A[Client POST /api/v1/forecasts/evaluate] --> B[FastAPI Layer & Authentication]
    B --> C[InputValidator: SMILES & MoA Syntax]
    C --> D[ModelLoader: Singleton Cache & SHA-256 Check]
    D --> E[DomainApplicabilityDetector: Tanimoto & MoA Match]
    E --> F[FeaturePipeline: 1041-dim Feature Vector]
    F --> G[Ridge Scoring Engine: log10 RR Prediction]
    G --> H[ConformalIntervalCalibrator: 90% Bounds]
    H --> I[PredictionResult Formatter]
    I --> J[PostgreSQL Persistence & Audit Log]
    J --> K[JSON API Response to Frontend]
```

---

## 2. Component Responsibilities

1. **`ml.inference.validator.InputValidator`**:
   - Validates SMILES character legality, bracket/parenthesis balancing, and canonicalizes strings.
   - Rejects unparseable chemical structures with standard HTTP 400 status.
2. **`ml.inference.loader.ModelLoader`**:
   - Maintains thread-safe in-memory singleton cache of joblib model binaries.
   - Validates cryptographic SHA-256 checksum upon initial load.
3. **`ml.inference.predictor.ResistancePredictor`**:
   - Evaluates chemical Tanimoto similarity against the training series.
   - Executes feature transformations using frozen training parameters.
   - Computes continuous $\log_{10}(RR)$, derived ordinal risk tier, and durability horizon in years.
4. **`ml.inference.output.PredictionResult`**:
   - Enforces strict Pydantic typed contracts for all returned fields.
