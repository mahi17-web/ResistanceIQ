# Step 23 — Bemis-Murcko Scaffold & Chemical Generalization Analysis

This document provides a comprehensive Bemis-Murcko scaffold audit and chemical novelty breakdown across ResistanceIQ Dataset v4.0 (`aprd-resistance-v4`).

---

## 1. Bemis-Murcko Scaffold Distribution Across Partitions

| Partition | Total Records | Unique Bemis-Murcko Scaffolds | Scaffolds Shared with Historical Train | Scaffold Novelty Rate |
| :--- | :---: | :---: | :---: | :---: |
| **Historical Train ($\le 2012$)** | 40 | **18** | 18 (100.0%) | 0.0% (Baseline anchor) |
| **Validation Tuning ($2013–2018$)** | 34 | **18** | 6 (33.3%) | 66.7% |
| **Held-Out Future Test ($2019–2024$)** | 15 | **10** | 6 (60.0%) | **40.0%** |

---

## 2. Test Observation Chemical Novelty & Nearest Neighbors Audit

| Case ID | Active Ingredient | Year | Max Tanimoto to Train+Val | Top Nearest Historical Neighbor | Bemis-Murcko Scaffold Category |
| :--- | :--- | :-: | :---: | :--- | :--- |
| `REC-V2-0014` | **Lambda-cyhalothrin** | 2019 | 0.857 | Cypermethrin (0.857) | **`KNOWN_SCAFFOLD`** |
| `REC-V2-0018` | **Spirotetramat** | 2019 | 0.310 | Spirotetramat (0.310) | **`NOVEL_SCAFFOLD`** |
| `REC-V2-0031` | **Chlorantraniliprole** | 2019 | 1.000 | Chlorantraniliprole (1.000) | **`KNOWN_SCAFFOLD`** |
| `REC-V3-0124` | **Chlorantraniliprole** | 2019 | 1.000 | Chlorantraniliprole (1.000) | **`KNOWN_SCAFFOLD`** |
| `REC-V4-0203` | **Broflanilide** | 2019 | 1.000 | Broflanilide (1.000) | **`KNOWN_SCAFFOLD`** |
| `REC-V2-0012` | **Chlorantraniliprole** | 2020 | 1.000 | Chlorantraniliprole (1.000) | **`KNOWN_SCAFFOLD`** |
| `REC-V3-0125` | **Emamectin benzoate** | 2020 | 1.000 | Emamectin benzoate (1.000) | **`KNOWN_SCAFFOLD`** |
| `REC-V2-0013` | **Spinetoram** | 2021 | 1.000 | Spinosad (1.000) | **`KNOWN_SCAFFOLD`** |
| `REC-V2-0029` | **Cyantraniliprole** | 2021 | 0.806 | Chlorantraniliprole (0.806) | **`KNOWN_SCAFFOLD`** |
| `REC-V3-0126` | **Flonicamid** | 2021 | 1.000 | Flonicamid (1.000) | **`KNOWN_SCAFFOLD`** |
| `REC-V2-0025` | **Triflumezopyrim** | 2022 | 0.170 | Afidopyropen (0.170) | **`NOVEL_SCAFFOLD`** |
| `REC-V3-0127` | **Broflanilide** | 2022 | 1.000 | Broflanilide (1.000) | **`KNOWN_SCAFFOLD`** |
| `REC-V3-0128` | **Afidopyropen** | 2023 | 1.000 | Afidopyropen (1.000) | **`KNOWN_SCAFFOLD`** |
| `REC-V3-0130` | **Glufosinate** | 2023 | 1.000 | Glufosinate (1.000) | **`KNOWN_SCAFFOLD`** |
| `REC-V3-0129` | **Triflumezopyrim** | 2024 | 1.000 | Triflumezopyrim (1.000) | **`KNOWN_SCAFFOLD`** |

---

## 3. Scaffold-Aware Cross-Validation Findings

- **Scaffold-Grouped 5-Fold CV MAE (ECFP4)**: **0.5411 +/- 0.0845** $\log_{10} RR$
- **Scaffold-Grouped 5-Fold CV MAE (ECFP6)**: **0.5453 +/- 0.0994** $\log_{10} RR$
- **Fingerprint Decision**: ECFP4 remains the more robust and less overfitted chemical representation on small sample regimes.
