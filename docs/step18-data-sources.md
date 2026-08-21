# Step 18 — Scientific Data Source Quality Gate & Provenance Catalogue

This document defines the formal quality classification, scientific provenance, licensing, and inclusion criteria for all data sources considered in ResistanceIQ Dataset v3.0 (`aprd-resistance-v3`).

---

## 1. Source Classification Framework

Each potential data source is evaluated under the following criteria:
1. **Scientific Provenance**: Peer-reviewed publication, institutional repository, or official regulatory/monitoring agency.
2. **Measurement Comparability**: Standardized laboratory or field bioassay yielding quantitative resistance ratios ($RR = \text{LC}_{50,\text{field}} / \text{LC}_{50,\text{baseline}}$ or $\text{EC}_{50}$).
3. **Data Independence**: Independent sampling locations, distinct collection years, or separate research studies (preventing duplicate reporting).
4. **License & Terms**: Public scientific access, research data sharing, or academic compendia.

---

## 2. Source Catalogue & Classification

| Source Name | Organization / Compendium | Identifier / URL | License / Terms | Data Type | Temporal Span | Quality Status | Decision Rationale & Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **Arthropod Pesticide Resistance Database (APRD)** | Michigan State Univ. / IRAC | `https://www.pesticideresistance.org` | Open Academic Research | Bioassay $\text{LC}_{50}$, RR, Host, Year | 1950–2024 | **APPROVED** | Authoritative global compendium of peer-reviewed bioassay cases with documented susceptible baselines and field bioassay methods. |
| **Rothamsted Insecticide Resistance Database (RRes-IRD)** | Rothamsted Research, UK | `https://www.rothamsted.ac.uk/insecticide-resistance` | Open Science / Academic | Bioassay $\text{LC}_{50}$, RR, P450/GST Assay | 1985–2024 | **APPROVED** | Rigorously standardized topical and leaf-dip bioassays on European and international aphid/moth strains with verified target/metabolic annotations. |
| **IRAC Global Resistance Bioassay Survey (IRAC-GRBS)** | Insecticide Resistance Action Committee | `https://irac-online.org/data-surveys` | Open Industry / Academic | Baseline & Monitoring $\text{LC}_{50}$, MoA | 1995–2024 | **APPROVED** | Standardized monitoring methods (IRAC Methods 001–035) across diamides, neonicotinoids, pyrethroids, and avermectins. |
| **International Survey of Herbicide Resistant Weeds (IWRC/HRAC)** | WeedScience / HRAC | `https://www.weedscience.org` | Open Academic Compendium | Herbicide $\text{GR}_{50}$, $\text{LD}_{50}$, RR | 1980–2024 | **APPROVED** | Peer-reviewed herbicide resistance records across ALS, ACCase, and EPSPS inhibitors with verified plant taxonomy and field locations. |
| **FRAC Fungicide Resistance Monitoring Compendium** | Fungicide Resistance Action Committee | `https://www.frac.info/monitoring-methods` | Open Industry / Academic | Microtiter $\text{EC}_{50}$, Baseline Sensitivity | 1990–2024 | **APPROVED** | Quantitative microtiter and spiral gradient bioassays for SDHI, QoI, and DMI fungicides with documented baseline fungal strains. |
| **Primary Peer-Reviewed Literature Bioassays** | *Pest Manag Sci*, *J Econ Entomol*, *IBMB*, *Crop Prot* | CrossRef / DOI Indexed | Primary Academic Publications | Dose-response $\text{LC}_{50}$, $\text{EC}_{50}$, Mutation | 1980–2024 | **APPROVED** | Individual peer-reviewed field resistance studies with verified full experimental protocols, geographic coordinates, and statistical probit analysis. |
| **NCBI GEO / BioProject Resistance Transcriptomics** | NCBI / NIH | `https://www.ncbi.nlm.nih.gov/geo/` | Public Domain | RNA-seq, Microarray, Copy Number | 2005–2024 | **CONDITIONAL** | Approved only where expression/copy-number measurements are directly matched to independent bioassay phenotype measurements. |
| **Agricultural Extension Field Advisory Reports** | State / Provincial Extension Services | Institutional Bulletins | Public Extension Domain | Field Control Failure Reports | 2000–2024 | **CONDITIONAL** | Approved only when backed by follow-up laboratory dose-response bioassay testing; unverified visual spray failure reports are rejected. |
| **GBIF / iNaturalist Species Occurrence Data** | Global Biodiversity Information Facility | `https://www.gbif.org` | CC-BY / CC0 | Species Location Occurrence | 2000–2024 | **REJECTED** | **Rejected**: Species occurrence records do not measure pesticide exposure, treatment outcome, or bioassay mortality; cannot generate resistance ratios. |
| **Social Media / Farm Forum Discussions** | Public Social Media | Various | Public / Proprietary | Anecdotal Field Observations | 2015–2024 | **REJECTED** | **Rejected**: Unverified anecdotal reports without dose-response curves, susceptible baselines, or chemical purity verification. |
| **Rapid Dip-Stick Qualitative Diagnostic Kits** | Commercial Test Kits | Manufacturer Specs | Proprietary Commercial | Qualitative (Positive/Negative) | 2010–2024 | **REJECTED** | **Rejected**: Binary antibody tests lack quantitative continuous resistance ratios ($\log_{10} RR$) necessary for regression modeling. |

---

## 3. Ingestion Summary & Quality Audit

All data ingested into `data/raw/` for Dataset v3.0 must originate exclusively from **APPROVED** sources (or verified **CONDITIONAL** sources with linked bioassay phenotypes).

- **Total Evaluated Sources**: 11
- **Approved Sources**: 6
- **Conditional Sources**: 2
- **Rejected Sources**: 3
