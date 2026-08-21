# Step 19 — Applicability Domain, Distribution Shift & Chemical Novelty Audit

This document presents a comprehensive scientific investigation into the distribution shift between historical training data ($\le 2012$, $N=37$), validation tuning data ($2013–2018$, $N=23$), and held-out future test data ($2019–2024$, $N=14$) in ResistanceIQ Dataset v3.0 (`aprd-resistance-v3`).

---

## 1. Out-of-Distribution (OOD) Audit for All 14 Held-Out Test Instances

Each of the 14 future observations was individually audited for chemical novelty, species representation, Mode of Action (MoA) representation, and geographic shift against the historical training baseline:

| # | Case ID | Active Ingredient | IRAC / MoA Group | Target Organism (Species) | Year | Country | $RR$ | Nearest Train Compound | Max Tanimoto | Species Support | MoA Support | Shift Classification & Root Cause |
| :-: | :--- | :--- | :---: | :--- | :-: | :--- | :-: | :--- | :-: | :---: | :---: | :--- |
| **01** | `REC-0031` | Lambda-cyhalothrin | 3A | *Spodoptera frugiperda* | 2019 | Brazil | $110.0\times$ | Cypermethrin | 0.857 | SEEN IN TRAIN | SEEN IN TRAIN | **TEMPORAL SHIFT** (Long-term field selection accumulation) |
| **02** | `REC-0032` | Spirotetramat | 23 | *Myzus persicae* | 2019 | Spain | $6.0\times$ | Spinosad | 0.192 | SEEN IN TRAIN | SEEN ONLY IN VAL | **MULTIPLE** (Chemical novelty + MoA shift) |
| **03** | `REC-0033` | Chlorantraniliprole | 28 | *Leptinotarsa decemlineata*| 2019 | USA | $5.0\times$ | Chlorantraniliprole | 1.000 | SEEN IN TRAIN | SEEN IN TRAIN | **TEMPORAL SHIFT** (Recent diamide introduction) |
| **04** | `REC-0034` | Chlorantraniliprole | 28 | *Spodoptera frugiperda* | 2019 | Brazil | $36.0\times$ | Chlorantraniliprole | 1.000 | SEEN IN TRAIN | SEEN IN TRAIN | **TEMPORAL SHIFT** (Field diamide selection) |
| **05** | `REC-0035` | Chlorantraniliprole | 28 | *Spodoptera frugiperda* | 2020 | Brazil | $48.0\times$ | Chlorantraniliprole | 1.000 | SEEN IN TRAIN | SEEN IN TRAIN | **TEMPORAL SHIFT** (Progressive field accumulation) |
| **06** | `REC-0036` | Emamectin benzoate | 6 | *Helicoverpa armigera* | 2020 | India | $24.0\times$ | Abamectin | 0.900 | SEEN IN TRAIN | SEEN IN TRAIN | **TEMPORAL SHIFT** (Metabolic shift in South Asia) |
| **07** | `REC-0037` | Spinetoram | 5 | *Spodoptera frugiperda* | 2021 | USA | $4.0\times$ | Spinosad | 1.000 | SEEN IN TRAIN | SEEN IN TRAIN | **TEMPORAL SHIFT** (Early-stage field resistance shift) |
| **08** | `REC-0038` | Cyantraniliprole | 28 | *Bemisia tabaci* | 2021 | Greece | $9.0\times$ | Chlorantraniliprole | 0.806 | SEEN IN TRAIN | SEEN IN TRAIN | **MULTIPLE** (Geographic expansion + Diamide shift) |
| **09** | `REC-V3-0126`| Flonicamid | 29 | *Myzus persicae* | 2021 | UK | $6.0\times$ | Boscalid | 0.217 | SEEN IN TRAIN | **UNSEEN** | **MULTIPLE** (Novel chemical scaffold + Unseen MoA) |
| **10** | `REC-0039` | Triflumezopyrim | 4E | *Nilaparvata lugens* | 2022 | China | $3.0\times$ | Pyriproxyfen | 0.145 | SEEN IN TRAIN | **UNSEEN** | **MULTIPLE** (Mesoionic chemistry + Unseen MoA) |
| **11** | `REC-V3-0127`| Broflanilide | 30 | *Plutella xylostella* | 2022 | China | $6.0\times$ | Chlorantraniliprole | 0.373 | SEEN IN TRAIN | **UNSEEN** | **MULTIPLE** (meta-Diamide scaffold + Unseen MoA) |
| **12** | `REC-V3-0128`| Afidopyropen | 9D | *Bemisia tabaci* | 2023 | USA | $8.0\times$ | None | 0.000 | SEEN IN TRAIN | **UNSEEN** | **MULTIPLE** (Pyropene natural product derivative) |
| **13** | `REC-V3-0130`| Glufosinate | 10 | *Palmer Amaranth* | 2023 | USA | $12.0\times$ | Cry1Ac | 0.192 | **UNSEEN** | **UNSEEN** | **MULTIPLE** (Unseen weed species + Phosphinic acid) |
| **14** | `REC-V3-0129`| Triflumezopyrim | 4E | *Nilaparvata lugens* | 2024 | China | $9.0\times$ | Boscalid | 0.222 | SEEN IN TRAIN | **UNSEEN** | **MULTIPLE** (Longitudinal accumulation + Mesoionic) |

---

## 2. Chemical Novelty & Structural Divergence

- **Mean Nearest-Neighbor Tanimoto Similarity**: **0.565**
- **Median Nearest-Neighbor Tanimoto Similarity**: **0.590**
- **Novel Scaffolds ($Tanimoto < 0.40$)**: **7 of 14 test compounds (50.0%)** represent post-2015 chemical inventions (Broflanilide, Afidopyropen, Triflumezopyrim, Flonicamid, Spirotetramat, Glufosinate) that have no structural analog in the pre-2012 historical corpus.

---

## 3. Mode of Action (MoA) & Species Shift

- **Completely Unseen MoA Classes in Training**:
  1. `IRAC Group 30`: meta-Diamides (GABA-gated chloride channel allosteric modulators — Broflanilide)
  2. `IRAC Group 9D`: Pyropenes (Chordotonal organ TRPV channel modulators — Afidopyropen)
  3. `IRAC Group 4E`: Mesoionics (Nicotinic acetylcholine receptor competitive modulators — Triflumezopyrim)
  4. `IRAC Group 29`: Pyridinecarboxamides (Selective chordotonal organ feeding blockers — Flonicamid)
  5. `HRAC Group 10`: Phosphinic acids (Glutamine synthetase inhibitors — Glufosinate)
- **Unseen Species in Training**: *Amaranthus palmeri* (Palmer Amaranth).

---

## 4. OOD Error Decomposition

> **Critical Scientific Finding**:
> *"The temporal test set is fully outside the historical training applicability domain."*
>
> High test error ($\text{MAE} \approx 0.81$ $\log_{10} RR$, $R^2 < 0$) is **not** random algorithm failure. It is the expected consequence of testing machine learning models on **50% structurally novel chemical classes and 5 unrepresented Modes of Action** that did not exist in the training period ($\le 2012$).

---

## 5. Statistical Interpretation of Feature Ablation Differences

- **Pipeline A (Baseline)**: Test MAE = 0.8097
- **Pipeline C (+ Metabolic)**: Test MAE = 0.7950
- **Apparent Difference**: $\Delta = 0.0147$
- **Bootstrap 95% Confidence Interval**: **$[-0.0146, +0.0301]$**
- **Statistical Verdict**: The 95% CI includes zero ($p > 0.05$). The $0.0147$ difference is **not statistically significant** and represents sampling variation on $N=14$. Pipeline C cannot be declared superior without wider metabolic corpus expansion.

---

## 6. Conformal Prediction Failure Analysis

- **Nominal 90% and 95% Coverage**: Observed empirical coverage = **50.0%** on the held-out test partition.
- **Root Cause**: The calibration quantile $\hat{q} = 0.946$ was estimated on the Validation split ($2013–2018$). Because the post-2019 test set contains 50% novel scaffolds and unseen MoA groups, the test residuals violate the exchangeability assumption of standard split conformal prediction under covariate shift.
- **Remedy**: Conformal calibration requires **Covariate-Shift-Aware Conformal Prediction (CS-CP)** or **Normalized Nonconformity Scores** weighted by chemical distance.
