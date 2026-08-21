# ResistanceIQ — ML Data Leakage Audit & Prevention

## 1. Overview of Scientific Leakage Risks

Data leakage occurs when information from outside the training dataset (such as future events, test labels, or post-resistance biological responses) inadvertently contaminates model feature computation, resulting in artificially high cross-validation performance that collapses in production.

This document identifies all known leakage vectors in pesticide resistance modeling and specifies architectural safeguards.

---

## 2. Leakage Vulnerability Taxonomy & Defenses

### 2.1 Temporal Look-Ahead Leakage (Future Feature Contamination)
* **Risk**: Using feature statistics aggregated across the entire timeline (e.g., total lifetime global sales of Imidacloprid through 2025, or total historical mutation frequencies observed in 2024) when predicting resistance in 2012.
* **Impact**: The model learns to identify successful or heavily sprayed compounds by post-hoc commercial longevity rather than innate molecular durability.
* **Architectural Defense**:
  - All time-dependent features (e.g. cumulative exposure years, regional application volume) must be computed **strictly prior to the observation timestamp ($t \le t_{\text{obs}}$)**.
  - Global dataset-wide preprocessors (scalers, encoders, imputer statistics) must be fit **exclusively on the training split** and applied transform-only to validation/test folds.

---

### 2.2 Duplicated Publication & Strain Re-Testing Leakage
* **Risk**: The same agricultural field collection or laboratory bioassay strain is published in multiple journal papers, reviews, or database entries under slightly different citations or year notations.
* **Impact**: Duplicate records split across train and test sets create severe test memorization.
* **Architectural Defense**:
  - Deduplicate bioassay records based on composite hash: `(InChIKey, NCBI_TaxID, Bioassay_Method, Collection_Country, Collection_Year, LC50_Value)`.
  - Group identical field population strains into single clusters prior to splitting.

---

### 2.3 Chemical Scaffold & Series Leakage
* **Risk**: Closely related structural analogs (e.g., Thiamethoxam and Clothianidin, or Deltamethrin and Cypermethrin) sharing >90% Tanimoto similarity are randomly assigned to train and test sets.
* **Impact**: Model simply memorizes that "all neonicotinoid analogs are effective against aphid strains until year 8" rather than learning true molecular-target interactions.
* **Architectural Defense**:
  - Enforce **Bemis-Murcko Scaffold Splitting** or Murcko Generic Framework clustering during model evaluation.

---

### 2.4 Post-Resistance Target Mutation Inversion Leakage
* **Risk**: Feeding target mutations (e.g. AChE1 G119S, para L1014F) as input features to predict whether a compound has resistance, when that specific mutation only evolved as a direct response to that compound's field failure.
* **Impact**: The model uses the *consequence* of resistance as the *predictor* of resistance.
* **Architectural Defense**:
  - For discovery prediction of new active ingredients, input target structures are **always the wildtype (WT) or baseline pre-exposure receptor conformation**.
  - In-silico deep mutagenesis scanning ($\Delta\Delta G$) is generated computationally across all possible 20 amino acid substitutions, rather than conditioning on post-hoc observed field mutations.

---

### 2.5 Bioassay Protocol Confounding
* **Risk**: Testing laboratories with higher resistance frequencies utilize specific specialized assay methods (e.g., syringe micro-injection), causing the model to learn lab identity rather than compound durability.
* **Architectural Defense**:
  - Stratify or standardize assay methods; include assay protocol type as a fixed-effect covariate and verify feature attribution via SHAP values.
