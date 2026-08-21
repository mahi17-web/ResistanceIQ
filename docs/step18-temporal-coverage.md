# Step 18 — Temporal Coverage & Longitudinal Resistance Series Audit

This document details the chronological distribution, temporal balance, source concentration periods, and longitudinal series of ResistanceIQ Dataset v3.0 (`aprd-resistance-v3`).

---

## 1. Out-of-Time Temporal Split Specification

To ensure rigorous chronological evaluation without future information leakage, Dataset v3.0 is partitioned into three discrete time periods:

| Temporal Partition | Chronological Boundary | Record Count | % of Dataset | Independent Studies | Unique Species | Unique Compounds | Geographic Countries | Median $RR$ |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Train Set** | $\le 2012$ | **37** | 50.0% | 37 | 12 | 23 | 19 | $90.0\times$ |
| **Validation Set** | $2013–2018$ | **23** | 31.1% | 23 | 11 | 15 | 15 | $80.0\times$ |
| **Held-Out Test Set** | $2019–2024$ | **14** | 18.9% | 14 | 8 | 11 | 7 | $8.5\times$ |
| **Total Corpus** | $1982–2024$ | **74** | 100.0% | 74 | 15 | 42 | 24 | $52.5\times$ |

---

## 2. Chronological Balance & Gaps

```
1980-1989: [███       ] (4 records: early pyrethroid and organophosphate baseline shifts)
1990-1999: [████      ] (5 records: emergence of avermectin, spinosyn, and pyrethroid kdr)
2000-2009: [██████████] (18 records: neonicotinoid resistance in aphids, whiteflies, planthoppers)
2010-2018: [████████████████] (33 records: diamides, ketoenols, modern ALS/EPSPS/SDHI resistance)
2019-2024: [███████   ] (14 records: meta-diamides, afidopyropen, triflumezopyrim, glufosinate)
```

- **Source Concentration**: Highest density occurs between 2010–2022 due to intensive global IRAC monitoring programs for new active ingredients (diamides, ketoenols, mesoionics).
- **Temporal Gaps**: Historical records prior to 1980 have non-harmonized baseline definitions and are excluded from the continuous regression modeling corpus.

---

## 3. Longitudinal Repeated Series Analysis

The dataset contains **14 longitudinal series** tracking the same organism–compound pair across distinct time periods:

| Target Species | Active Ingredient | MoA Group | First Observed | Latest Observed | Total Time Points | Resistance Ratio Evolution |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| *Plutella xylostella* | Chlorantraniliprole | 28 | 2011 (Thailand) | 2018 (China) | 3 | $40.0\times \rightarrow 450.0\times$ |
| *Myzus persicae* | Imidacloprid | 4A | 2002 (UK) | 2016 (Greece) | 4 | $15.0\times \rightarrow 180.0\times$ |
| *Bemisia tabaci* | Pyriproxyfen | 7C | 2007 (Israel) | 2017 (USA) | 2 | $500.0\times \rightarrow 12.0\times$ (MED biotype variation) |
| *Spodoptera frugiperda* | Chlorantraniliprole | 28 | 2013 (Brazil) | 2019 (Brazil) | 2 | $8.0\times \rightarrow 36.0\times$ |
| *Helicoverpa armigera* | Spinosad | 5 | 2005 (India) | 2015 (Australia) | 2 | $12.0\times \rightarrow 8.5\times$ |
| *Nilaparvata lugens* | Triflumezopyrim | 4E | 2017 (China) | 2024 (China) | 2 | $3.0\times \rightarrow 9.0\times$ |
| *Tetranychus urticae* | Abamectin | 6 | 1992 (USA) | 2016 (Belgium) | 2 | $25.0\times \rightarrow 85.0\times$ |

### Feasibility of Longitudinal Durability Models:
With 14 longitudinal series (median length 2.0, max length 4.0), the dataset provides empirical evidence for progressive resistance accumulation over time. However, survival analysis and Cox proportional hazard models require continuous annual monitoring panels ($N \ge 50$ series with $\ge 5$ observations each). Therefore, mathematical time-to-resistance formulations ($25/\sqrt{RR}$) remain classified as **RESEARCH HEURISTICS**.
