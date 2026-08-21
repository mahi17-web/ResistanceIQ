# ResistanceIQ — Scientific Limitations & Epistemic Boundaries

## 1. Philosophical & Methodological Disclaimer

Machine learning models within **ResistanceIQ** provide **probabilistic simulations and computational risk rankings** derived from available toxicological, chemical, and historical agricultural datasets. They are **not guarantees of absolute field performance**.

The ResistanceIQ interface must explicitly surface these boundaries to prevent misuse and ensure scientific integrity.

---

## 2. Key Scientific Limitations

### 2.1 Historical Reporting & Publication Bias
* **The "Problem Child" Bias**: Scientific literature and resistance databases heavily over-report instances of **field failure** while under-reporting successful, persistent chemical efficacy. An active ingredient that works flawlessly for 25 years without failure rarely generates published bioassays.
* **Impact**: Uncorrected models will overestimate baseline resistance risk across all chemistries.
* **Mitigation**: Calibration against registration lifespans and pesticide commercial usage volumes (USGS NASS data) to account for uneventful persistence.

---

### 2.2 Target-Site vs. Metabolic Detoxification Discrepancy
* **Biological Reality**: Arthropod resistance arises through three distinct evolutionary mechanisms:
  1. **Target-Site Mutation**: Amino acid substitutions in the receptor binding pocket (e.g. AChE1 G119S, VGSC L1014F).
  2. **Metabolic Resistance**: Overexpression or gene amplification of detoxifying enzyme superfamilies (Cytochrome P450s / monooxygenases, Glutathione S-transferases, Carboxylesterases).
  3. **Penetration & Behavioral Resistance**: Cuticular thickening or avoidance behavior.
* **Model Limitation**: Cheminformatics and docking features primarily capture **Target-Site** interactions. Metabolic resistance depends heavily on host plant genetics, regional temperature, and multi-gene expression patterns that cannot be fully determined from 2D molecular structures alone.
* **Mitigation**: Clearly label in the UI that predictions represent **Target-Site & Baseline Historical Cross-Resistance Risk**, rather than all-inclusive metabolic adaptations.

---

### 2.3 Experimental Bioassay Protocol Heterogeneity
* **Measurement Noise**: Bioassay $LC_{50}$ values determined by topical micro-droplet application can differ by $10\times$ from leaf-dip or diet-incorporation assays for the same species and compound.
* **Mitigation**: ResistanceIQ normalizes bioassays to standardized IRAC method equivalents and uses relative Resistance Ratios ($RR$) against concurrent internal susceptible control strains rather than raw $LC_{50}$ numbers.

---

### 2.4 Unobserved Agronomic & Environmental Covariates
* **Real-World Factors**: In commercial field agriculture, resistance evolution is heavily modulated by:
  - Untreated refuge area sizing (enabling susceptible allele survival).
  - Tank-mixing of complementary MoA chemistries.
  - Annual crop rotation practices.
  - Micro-climatic temperature extremes altering insect generation turnover speed.
* **Model Limitation**: In early molecular discovery, these future field management conditions are completely unobserved.
* **Mitigation**: Provide user-adjustable agronomic scenario sliders (e.g., High-Intensity Monoculture vs. Integrated Pest Management IPM with 20% Refuge) to show sensitivity analysis rather than a single fixed outcome.

---

## 3. Mandatory UI & Presentation Principles

1. **Never Present Predictions as Absolute Truth**: The UI must display calibrated prediction intervals ($[\text{Lower 90\%}, \text{Upper 90\%}]$) alongside median point estimates.
2. **Surface Out-of-Domain Warnings**: When a user inputs a candidate chemical scaffold with $<0.35$ Tanimoto similarity to the training corpus, the platform must display an `OUT_OF_APPLICABILITY_DOMAIN` notification.
3. **Traceability to Empirical Ground Truth**: Every forecast view must offer a *"Why this prediction?"* panel linking to closest historical APRD analog cases and crystal structure binding pocket residue analyses.
