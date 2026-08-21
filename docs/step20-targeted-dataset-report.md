# Step 20 — Targeted Dataset v4 Quality & Expansion Report

This document reports the quality metrics, domain expansion achievements, and entity resolution profile of ResistanceIQ Dataset v4.0 (`aprd-resistance-v4`).

---

## 1. Quantitative Dataset Expansion Profile

| Metric | Dataset v2 (Baseline) | Dataset v3 (Step 18) | Dataset v4 (Step 20 Targeted) | Net Expansion (v2 $\rightarrow$ v4) |
| :--- | :---: | :---: | :---: | :---: |
| **Total Canonical Observations** | 44 | 74 | **89** | **+102.3% (+45 observations)** |
| **Independent Peer-Reviewed Studies** | 44 | 74 | **89** | **+102.3% (+45 studies)** |
| **Independent Field Populations** | 40 | 68 | **82** | **+105.0% (+42 populations)** |
| **Unique Active Ingredients** | 28 | 42 | **43** | **+53.6% (+15 compounds)** |
| **Unique Target Organisms (Species)** | 10 | 15 | **15** | **+50.0% (+5 species)** |
| **Unique MoA Groups** | 16 | 22 | **23** | **+43.8% (+7 MoA classes)** |
| **Geographic Countries** | 18 | 24 | **25** | **+38.9% (+7 countries)** |
| **Temporal Span** | 1995–2022 | 1982–2024 | **1982–2024** | **+15 years coverage** |
| **Dataset Checksum** | `b092dfb...` | `924f20e...` | `c060de7...` | **Cryptographically isolated** |

---

## 2. Targeted Future-Domain Gaps Closed in Dataset v4

| Target Domain Gap | Specific Active Ingredients Added | Earliest Observation Added | Species Covered | Pre-2012 / Pre-2018 Training Anchor Established |
| :--- | :--- | :---: | :--- | :---: |
| **IRAC Group 30** | Broflanilide, Fluxametamide | 2017 (Japan/China) | *Plutella xylostella*, *Frankliniella occidentalis* | **YES (Validation anchor)** |
| **IRAC Group 9D** | Afidopyropen | 2016 (Germany/USA) | *Myzus persicae*, *Bemisia tabaci* | **YES (Validation anchor)** |
| **IRAC Group 4E** | Triflumezopyrim | 2015 (Philippines/China) | *Nilaparvata lugens* | **YES (Validation anchor)** |
| **IRAC Group 29** | Flonicamid | 2010 (Japan/UK) | *Myzus persicae* | **YES (Historical Train anchor)** |
| **IRAC Group 23** | Spirotetramat, Spiromesifen | 2009 (Germany/Spain) | *Myzus persicae*, *Bemisia tabaci* | **YES (Historical Train anchor)** |
| **HRAC Group 10** | Glufosinate | 2012 (Malaysia/USA) | *Eleusine indica*, *Amaranthus palmeri* | **YES (Historical Train anchor)** |
| **Longitudinal Diamides**| Chlorantraniliprole | 2014, 2016 (Brazil) | *Spodoptera frugiperda* | **YES (Validation time series)** |

---

## 3. Deduplication & Missingness Audit

- **Exact Duplicates Removed**: 0
- **Likely Duplicates Removed**: 0
- **Unresolved Records Quarantined**: 0
- **Feature Missingness**:
  - Chemical ECFP4 Fingerprints: **0.0%**
  - Physicochemical Descriptors ($MW$, $\log P$, $TPSA$, $HBD$, $HBA$, $RotB$): **0.0%**
  - Taxonomy (Order, Family, Genus, Species, NCBI TaxID): **0.0%**
  - Continuous Target ($\log_{10} RR$): **0.0%**
