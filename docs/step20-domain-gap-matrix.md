# Step 20 — Future-Domain Gap Matrix & Targeted Acquisition Roadmap

This document establishes the granular domain gap matrix for all 14 Out-of-Distribution (OOD) observations identified in Step 19 and defines the prioritized scientific data acquisition plan for ResistanceIQ Dataset v4.0 (`aprd-resistance-v4`).

---

## 1. Granular Future-Domain Gap Matrix

| # | Test Observation | Active Ingredient | Chemical Class | IRAC / HRAC MoA | Target Organism (Species) | Year | Country | Nearest Historical Pre-2012 Compound | Max Tanimoto | Domain Gap Category | Specific Deficit in Pre-2012 Training Domain |
| :-: | :--- | :--- | :--- | :---: | :--- | :-: | :--- | :--- | :-: | :--- | :--- |
| **01** | `REC-0031` | Lambda-cyhalothrin | Pyrethroid | 3A | *Spodoptera frugiperda* | 2019 | Brazil | Cypermethrin | 0.857 | **TEMPORAL NOVELTY** | High-level accumulated resistance ($RR=110\times$) in Neotropical Fall Armyworm field strains. |
| **02** | `REC-0032` | Spirotetramat | Tetramic acid | 23 | *Myzus persicae* | 2019 | Spain | Spinosad | 0.192 | **CHEMICAL & MoA NOVELTY** | Tetramic acid lipid biosynthesis inhibitors (ACCase) absent in pre-2012 training corpus. |
| **03** | `REC-0033` | Chlorantraniliprole | Anthranilic diamide | 28 | *Leptinotarsa decemlineata*| 2019 | USA | Chlorantraniliprole | 1.000 | **TEMPORAL NOVELTY** | Emerging baseline shift in Coleopteran potato pest populations. |
| **04** | `REC-0034` | Chlorantraniliprole | Anthranilic diamide | 28 | *Spodoptera frugiperda* | 2019 | Brazil | Chlorantraniliprole | 1.000 | **TEMPORAL NOVELTY** | Initial field control failures ($RR=36\times$) post-commercialization in South America. |
| **05** | `REC-0035` | Chlorantraniliprole | Anthranilic diamide | 28 | *Spodoptera frugiperda* | 2020 | Brazil | Chlorantraniliprole | 1.000 | **TEMPORAL NOVELTY** | Escalating field resistance ($RR=48\times$) driven by RyR target-site selection. |
| **06** | `REC-0036` | Emamectin benzoate | Avermectin | 6 | *Helicoverpa armigera* | 2020 | India | Abamectin | 0.900 | **METABOLIC & TEMPORAL** | Multi-gene metabolic upregulation (*GSTe2* + *CYP337B1*) in Old World bollworm. |
| **07** | `REC-0037` | Spinetoram | Spinosyn | 5 | *Spodoptera frugiperda* | 2021 | USA | Spinosad | 1.000 | **TEMPORAL NOVELTY** | Second-generation semi-synthetic spinosyn baseline response. |
| **08** | `REC-0038` | Cyantraniliprole | Anthranilic diamide | 28 | *Bemisia tabaci* | 2021 | Greece | Chlorantraniliprole | 0.806 | **GEOGRAPHIC & TAXONOMIC** | Whitefly Mediterranean MED biotype response to cross-spectrum diamides. |
| **09** | `REC-V3-0126`| Flonicamid | Pyridinecarboxamide | 29 | *Myzus persicae* | 2021 | UK | Boscalid | 0.217 | **CHEMICAL & MoA NOVELTY** | Chordotonal organ potassium channel modulators (IRAC 29) completely absent in training. |
| **10** | `REC-0039` | Triflumezopyrim | Mesoionic | 4E | *Nilaparvata lugens* | 2022 | China | Pyriproxyfen | 0.145 | **CHEMICAL & MoA NOVELTY** | Mesoionic zwitterionic chemistry (IRAC 4E) unrepresented in pre-2012 training. |
| **11** | `REC-V3-0127`| Broflanilide | meta-Diamide | 30 | *Plutella xylostella* | 2022 | China | Chlorantraniliprole | 0.373 | **CHEMICAL & MoA NOVELTY** | Allosteric GABA-gated chloride channel antagonists (IRAC 30) absent in historical training. |
| **12** | `REC-V3-0128`| Afidopyropen | Pyropene | 9D | *Bemisia tabaci* | 2023 | USA | None | 0.000 | **CHEMICAL & MoA NOVELTY** | Semi-synthetic pyropene sesquiterpene chemistry (IRAC 9D) absent in training. |
| **13** | `REC-V3-0130`| Glufosinate | Phosphinic acid | HRAC 10 | *Amaranthus palmeri* | 2023 | USA | Cry1Ac | 0.192 | **SPECIES, CHEMICAL & MoA** | Novel weed species (*A. palmeri*) and glutamine synthetase inhibitor chemistry. |
| **14** | `REC-V3-0129`| Triflumezopyrim | Mesoionic | 4E | *Nilaparvata lugens* | 2024 | China | Boscalid | 0.222 | **CHEMICAL & MoA NOVELTY** | Longitudinal multi-year field bioassay tracking mesoionic resistance evolution. |

---

## 2. Prioritized Targeted Data Acquisition Strategy

To eliminate artificial domain boundaries and enable genuine future generalization, data acquisition is structured into 5 ranked priority tiers:

1. **Priority 1: Baseline Bioassays for Post-2015 Chemical Inventions**
   - Acquire certified baseline $\text{LC}_{50}$ and early laboratory selection bioassays for:
     - `Broflanilide` (meta-Diamide, IRAC 30)
     - `Fluxametamide` (Isoxazoline, IRAC 30)
     - `Afidopyropen` (Pyropene, IRAC 9D)
     - `Triflumezopyrim` (Mesoionic, IRAC 4E)
     - `Flonicamid` (Pyridinecarboxamide, IRAC 29)
     - `Spirotetramat` & `Spiromesifen` (Tetramic/Tetronic acids, IRAC 23)

2. **Priority 2: Unrepresented MoA Groups Across Multiple Species**
   - Ingest peer-reviewed dose-response curves for IRAC 30, IRAC 9D, IRAC 4E, IRAC 29, IRAC 23, and HRAC 10 across aphids, caterpillars, planthoppers, mites, and weeds.

3. **Priority 3: Weed & Plant Resistance Expansion**
   - Ingest validated *Amaranthus palmeri* and *Eleusine indica* dose-response bioassays with documented susceptible baselines across ALS, EPSPS, and GS inhibitors.

4. **Priority 4: Longitudinal Field Strains Tracking Emerging Diamide & Neonicotinoid Resistance**
   - Ingest longitudinal multi-year monitoring series for *Spodoptera frugiperda*, *Helicoverpa armigera*, and *Plutella xylostella*.

5. **Priority 5: Quantitative Metabolic Gene Amplification Panels**
   - Ingest bioassays with matched transcriptomic and copy-number measurements (*CYP6CY3*, *CYP6ER1*, *GSTe2*).
