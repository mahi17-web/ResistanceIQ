# ResistanceIQ — Prediction Target Feasibility Analysis

## 1. Candidate Prediction Targets Under Evaluation

This document rigorously evaluates each candidate prediction target against the actual properties of the currently ingested scientific data.

---

## 2. Target Evaluation Matrix

### Target 1: Continuous Resistance Ratio ($\log_{10}(RR)$)
* **Directly Observed Label?**: **YES**. Calculated as $RR = LC_{50}^{\text{test}} / LC_{50}^{\text{susceptible\_baseline}}$.
* **Observation Count in Ingested Benchmark**: 15 records (100% of benchmark observations).
* **Target Type**: Continuous ($y \in [0.99, 2.08]$ on $\log_{10}$ scale).
* **Comparability Across Studies**: **HIGH** when normalized using concurrent susceptible reference strains ($RR$ cancels baseline environmental variance).
* **Temporal Information**: Adequate historical span ($1946–2016$).
* **Validation Sufficiency**: **FEASIBLE** for baseline regressors and GBDT prototypes.
* **Contributing Sources**: APRD documented bioassay literature.
* **Biases**: Literature over-reports high resistance ratios ($RR > 10$) over modest tolerance.

---

### Target 2: Ordinal Resistance Risk Tier (Low / Moderate / High / Critical)
* **Directly Observed Label?**: **DERIVED** via established IRAC threshold bins ($RR < 5$, $5 \le RR < 10$, $10 \le RR < 50$, $RR \ge 50$).
* **Observation Count in Ingested Benchmark**: 15 records.
* **Target Type**: Ordinal Categorical (4 ordered tiers).
* **Comparability Across Studies**: **HIGH**. Tiers absorb minor inter-laboratory bioassay protocol variance.
* **Validation Sufficiency**: **FEASIBLE** for ordinal classification and weighted Cohen's $\kappa$ evaluation.
* **Contributing Sources**: APRD + IRAC definitions.

---

### Target 3: Time-to-Field Resistance ($T_{\text{res}}$ in Years)
* **Directly Observed Label?**: **COMPUTED** as $T_{\text{res}} = \text{Year}_{\text{first\_reported}} - \text{Year}_{\text{commercial\_registration}}$.
* **Observation Count in Current Ingested Set**: Requires commercial registration year metadata lookup.
* **Comparability Across Studies**: **MODERATE**. Depends on regional marketing approval dates.
* **Temporal Sequence Sufficiency**: **WARNING — Insufficient Longitudinal Tracking in Current Set**. The current dataset contains cross-sectional snapshot cases rather than dense annual tracking sequences for the exact same regional insect population.
* **Verdict**: **CANNOT be trained as a pure time-series survival model without importing complete commercial registration registries and multi-year regional monitoring sequences.**

---

### Target 4: Target Mutation $\Delta\Delta G$ Binding Affinity Shift
* **Directly Observed Label?**: Computational biophysical calculation (in-silico docking / free energy perturbation).
* **Observation Count**: Requires molecular structure coordinate files.
* **Verdict**: Suitable as an **input feature**, not as the primary empirical supervised label.

---

## 3. Recommended Prediction Target

**Primary Supervised Modeling Target**: $\mathbf{\log_{10}(RR)}$ (Continuous Log Resistance Ratio) paired with derived **Ordinal Risk Tiers** ($RR < 5$, $5 \le RR < 10$, $10 \le RR < 50$, $RR \ge 50$).
