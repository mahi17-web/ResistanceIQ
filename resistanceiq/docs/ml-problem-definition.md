# ResistanceIQ — Core ML Problem Definition & Target Analysis

## 1. Executive Summary

A predictive machine learning system for pesticide resistance must define a **mathematically and biologically sound target variable**. In agrochemical toxicology and population genetics, "resistance" is not a monolithic scalar; it is measured either as an **in-vitro toxicological ratio**, a **field failure timeline**, a **population allele frequency**, or a **categorical resistance phenotype**.

This document systematically evaluates candidate prediction targets to determine the most scientifically defensible approach for ResistanceIQ.

---

## 2. Candidate Prediction Targets

### Candidate A: Resistance Ratio ($RR$) Regression

* **Target Name**: Continuous Resistance Ratio ($RR$) or $\log_{10}(RR)$
* **Scientific Definition**: 
  $$RR = \frac{LC_{50}^{\text{test population}}}{LC_{50}^{\text{susceptible reference strain}}}$$
  where $LC_{50}$ (or $EC_{50}$) is the lethal concentration required to kill 50% of the tested population under standardized bioassay conditions.
* **Required Input Data**:
  - Chemical descriptors / SMILES of the active ingredient
  - Target protein sequence / homology model
  - Pest species identifier
  - Baseline susceptible $LC_{50}$ (mg/L or ppm)
  - Historical cumulative selection pressure / exposure years
* **Output Type**: Continuous float ($\mathbb{R}^+$) or $\log_{10}(RR) \in \mathbb{R}$
* **Advantages**:
  - Direct quantitative standard used across toxicology literature and the Arthropod Pesticide Resistance Database (APRD).
  - Continuous regression allows granular ranking between candidate molecules.
  - Standardized bioassay protocols (IRAC susceptibility methods #001 to #032) provide uniform experimental endpoints.
* **Limitations**:
  - $LC_{50}$ values vary significantly between assay methods (topical vs. leaf-dip vs. glass-vial residual).
  - Susceptible baseline strains can drift genetically over laboratory generations.
  - Log-normal skew requires robust transformation ($\log_{10}(RR)$).
* **Data Availability**: **High** (>100,000 published bioassays across APRD, USDA, and toxicological literature).

---

### Candidate B: Time-to-Resistance Emergence ($T_{\text{res}}$)

* **Target Name**: Time to First Documented Field Resistance ($T_{\text{res}}$ in Years)
* **Scientific Definition**: The elapsed time (in calendar years or generations) between initial commercial registration/deployment of an active ingredient and the first documented case of confirmed field control failure ($RR > 10$ with field efficacy decline).
* **Required Input Data**:
  - Active ingredient first commercial deployment year
  - Mode of Action (MoA) classification (IRAC)
  - Pest species voltinism (generations per year)
  - Cross-resistance history in the target pest
  - Target site binding pocket conservation / mutation hotspot index ($\Delta\Delta G$)
* **Output Type**: Continuous duration ($T \in \mathbb{R}^+$) or Right-Censored Time-to-Event
* **Advantages**:
  - Directly addresses the product question: *"How many years of field utility does this molecule have?"*
  - Intuitive for R&D decision-makers and regulatory agronomists.
* **Limitations**:
  - High survival-analysis censoring: newly registered compounds have not yet failed ($T > T_{\text{current}}$).
  - Confounded by market adoption, application frequency, and regional tank-mixing practices.
  - Sparse sample size compared to raw bioassay counts (only hundreds of unique pesticide-pest introduction pairs).
* **Data Availability**: **Moderate** (~1,500 historical compound-pest emergence records in APRD/IRAC).

---

### Candidate C: Ordinal Resistance Risk Classification

* **Target Name**: Resistance Risk Tier (Discrete Ordinal)
* **Scientific Definition**:
  - **Class 0 (Susceptible / Baseline)**: $RR < 5$
  - **Class 1 (Low / Tolerance)**: $5 \le RR < 10$
  - **Class 2 (Moderate Resistance)**: $10 \le RR < 50$
  - **Class 3 (High / Severe Resistance)**: $RR \ge 50$
* **Required Input Data**: Chemical SMILES, IRAC MoA group, pest taxonomy, exposure duration.
* **Output Type**: Discrete Ordinal Class ($\{0, 1, 2, 3\}$) with calibrated class probabilities.
* **Advantages**:
  - Robust against bioassay experimental noise; smooths out minor assay discrepancies.
  - Matches standard IRAC and regulatory risk-tier reporting standards.
  - Can be trained on both exact $LC_{50}$ numbers and semi-quantitative published field reports.
* **Limitations**:
  - Loss of continuous granularity.
  - Threshold boundaries ($RR=10$) are somewhat arbitrary conventions.
* **Data Availability**: **High** (readily constructible from bioassay databases).

---

### Candidate D: Target-Site Mutation Binding Shift ($\Delta\Delta G_{\text{bind}}$)

* **Target Name**: In-Silico Binding Affinity Delta upon Target Mutation ($\Delta\Delta G$)
* **Scientific Definition**:
  $$\Delta\Delta G = \Delta G_{\text{bind}}^{\text{mutant}} - \Delta G_{\text{bind}}^{\text{wildtype}}$$
  where $\Delta G_{\text{bind}}$ is the computational or experimental binding free energy of the pesticide in the receptor active site.
* **Required Input Data**:
  - 3D Conformation of receptor (PDB / AlphaFold2)
  - 3D Ligand conformer
  - Target residue single-point mutation (e.g., AChE1 G119S, VGSC L1014F, RyR G4946E)
* **Output Type**: Continuous float ($\text{kcal/mol}$)
* **Advantages**:
  - Pure biophysical measurement; zero agricultural noise or field reporting bias.
  - Evaluates early discovery molecules without requiring field trials.
* **Limitations**:
  - Only models target-site insensitivity; completely misses metabolic detoxification (CYP450, GST, ABC transporters) and behavioral resistance.
* **Data Availability**: **High for computation**, **Moderate for experimental $K_i/IC_{50}$ mutants** (ChEMBL, BindingDB, PDBbind).

---

## 3. Comparative Evaluation Matrix

| Prediction Target | Biological Grounding | Data Availability | Noise Level | Production Defensibility |
|---|---|---|---|---|
| **$\log_{10}(RR)$ (Continuous Bioassay)** | Very High | High (>100k) | Moderate | **Recommended for Core Engine** |
| **Ordinal Risk Tier (4-Class)** | High | High | Low | **Recommended for UI Reporting** |
| **Time-to-Event ($T_{\text{res}}$)** | High | Moderate (~1.5k) | High (Censored) | **Recommended as Phase 2 Survival Model** |
| **Biophysical $\Delta\Delta G$** | High (Target-site only)| High (in-silico) | Low (Computational) | **Recommended as Feature Input** |

---

## 4. Recommended Architectural Decision

ResistanceIQ should implement a **Two-Tier Hierarchical Prediction Architecture**:

1. **Primary Model (Bioassay Resistance Ratio)**:
   - Target: $\log_{10}(RR)$ as a continuous variable.
   - Ground truth: Curated bioassay records from APRD and peer-reviewed studies.
   - Maps chemical structure + target + pest + exposure context to predicted resistance magnitude.

2. **Derived Secondary Layer (Phenotypic Risk Tier & Trajectory)**:
   - Converts continuous $\log_{10}(RR)$ into calibrated class probabilities ($P(\text{Susceptible}), P(\text{Moderate}), P(\text{Critical})$).
   - Combines predicted resistance ratio with pest generation time to project resistance growth curves over 1–10 years.
