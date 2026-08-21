# ResistanceIQ — Machine Learning & Simulation Pipeline

## Pipeline Topology

The future production predictive engine will operate as a 4-stage pipeline:

```
[Molecule SMILES] + [Target Conformation] + [Pest Population]
                            │
                            ▼
           1. Feature Extraction & Conformation
      • RDKit Morgan Fingerprints & Descriptors
      • AutoDock Vina / GNINA Binding Affinity
      • AlphaFold2 / ESMFold Receptor PDB Binding Pocket
                            │
                            ▼
           2. In-Silico Deep Mutagenesis Scan
      • Computational Alanine & Single-Point Scanning (ΔΔG)
      • Binding Pocket Fragility Index
                            │
                            ▼
           3. Wright-Fisher Population Simulation
      • Selection coefficient derived from binding affinity shift
      • Stochastic allele fixation probability over N generations
      • Pest-specific generation interval to calendar years conversion
                            │
                            ▼
           4. Calibrated Durability Scoring
      • Composite Durability Index (0–100)
      • Risk Classification (Low, Moderate, High, Critical)
      • Backtested against APRD/IRAC historical field benchmarks
```

---

## Machine Learning Architecture Rules

1. **No Fake Accuracy**: Do not report empirical accuracy metrics until real models are trained against validated benchmarks (APRD, IRAC, PubChem BioAssays).
2. **Model Registry & Versioning**: Every model artifact must record:
   - Model Version (e.g. `v0.1-baseline-ridge`, `v0.2-lgbm`)
   - Training Dataset Hash
   - Evaluation Metrics on Cross-Validation & Out-of-Distribution holdouts
   - Feature Schema Hash
   - Timestamp and Author
3. **Graceful Fallbacks**: When ML weights are not deployed, the API returns a structured `MODEL_NOT_TRAINED` state rather than fabricating numbers.
