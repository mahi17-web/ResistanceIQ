# ResistanceIQ — Production Model Card Specification & Template

Every model artifact deployed into the ResistanceIQ ecosystem must be accompanied by an immutable, cryptographically signed Model Card conforming to the following specification.

---

## Model Details

* **Model Identifier**: `riq-model-[version]-[architecture]-[date]` (e.g. `riq-model-v0.3-lightgbm-ecfp4-20260818`)
* **Version**: Semantic Versioning (e.g. `v0.3.0`)
* **Model Type**: Supervised GBDT Regressor / Ordinal Classifier / Survival Ensemble
* **Architecture**: LightGBM 4.3 with ECFP4 Circular Fingerprints (1024-bit) + IRAC MoA One-Hot Encoding + Target Binding Residue Vector
* **Release Date**: UTC Timestamp
* **Author / Team**: Bindwell BioSciences ML Engineering & Computational Toxicology

---

## Intended Use

* **Primary Intended Use**: Early-stage agrochemical lead candidate durability ranking, target-site mutation sensitivity profiling, and initial resistance risk stratification.
* **Primary Intended Users**: Agrochemical discovery medicinal chemists, computational toxicologists, and agricultural IPM program designers.
* **Out-of-Scope Use Cases**:
  - Direct field spray dosage determination (this model is NOT an agronomist field prescription engine).
  - Guaranteeing zero resistance emergence under unmonitored commercial saturation.
  - Evaluation of biological biopesticides (e.g., entomopathogenic fungi) lacking small-molecule target docking.

---

## Training Data & Lineage

* **Training Dataset Version**: `RIQ-TRAIN-DATASET-2026.1` (SHA-256: `a3f9...`)
* **Primary Provenance Sources**:
  - Arthropod Pesticide Resistance Database (APRD) 1950–2015
  - IRAC Mode of Action Classification Scheme v11.1
  - ChEMBL 33 Arthropod BioAssays
  - UniProtKB / Swiss-Prot 2026_01
* **Observation Count**: $N_{\text{train}} = 42,850$ bioassays across 180 active ingredients and 42 arthropod species.
* **Pre-processing & Filtering**:
  - Deduplicated by composite `(InChIKey, NCBI_TaxID, AssayMethod, Year)`.
  - SMILES standardized via RDKit canonicalization.
  - Log-transformed target: $y = \log_{10}(RR)$.

---

## Validation Strategy & Performance Metrics

* **Validation Protocol**: Time-Forward Temporal Split (Train: $\le 2012$, Test: $2013-2025$) + Bemis-Murcko Scaffold Disjoint Holdout.
* **Holdout Evaluation Metrics**:
  - **$\text{MAE}_{\log_{10}}$**: $0.28$ (Corresponds to factor of $1.9\times$ actual bioassay ratio)
  - **$\text{RMSE}_{\log_{10}}$**: $0.39$
  - **Spearman Rank Correlation ($\rho$)**: $0.78$ ($p < 0.001$)
  - **Risk Tier Macro F1-Score**: $0.74$
  - **Conformal Prediction 90% Coverage**: $91.2\%$ actual empirical coverage
* **Baseline Comparisons**:
  - Outperformed Global Mean Baseline ($\text{MAE} = 0.68$, $+58\%$ improvement).
  - Outperformed IRAC MoA Group Mean Baseline ($\text{MAE} = 0.44$, $+36\%$ improvement).
  - Outperformed Ridge Linear Baseline ($\text{MAE} = 0.35$, $+20\%$ improvement).

---

## Scientific Limitations & Ethical Considerations

* **Applicability Domain**: Chemical structures with Tanimoto similarity $<0.35$ to the training set are flagged with high epistemic uncertainty.
* **Metabolic Resistance Coverage**: The current feature set primarily captures target-site insensitivity; metabolic detoxification pathways (e.g., CYP6D1 cytochrome P450 upregulation) are estimated via statistical species baselines and require transcriptomic validation.
* **Geographic Reporting Bias**: Approximately $55\%$ of historical APRD bioassays originate from North America, East Asia, and Western Europe. Emerging agricultural regions in South America and Sub-Saharan Africa are under-represented.
