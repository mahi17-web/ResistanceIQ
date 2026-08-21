# ResistanceIQ — Scientific Data Gap Analysis & Prioritization Report

## 1. Executive Summary

Prior to expanding the machine learning training foundation, a comprehensive audit of the historical data corpus (`v1.0`) was conducted against international resistance monitoring standards (IRAC, APRD, WHO, FAO). This report formally defines, ranks, and prioritizes the scientific data gaps addressed in **Dataset v2.0**.

---

## 2. Ranked Scientific Data Gaps

| Gap ID | Category | Description | Severity / Priority | Justification & Impact |
|---|---|---|:---:|---|
| **GAP-01** | **Taxonomic Diversity** | Insect order & pest species representation was concentrated in 4 species. | **CRITICAL** | Failure to represent Coleoptera (*L. decemlineata*), Thysanoptera (*F. occidentalis*), Acari (*T. urticae*), and key Diptera (*M. domestica*) leads to high out-of-domain failure rates across diverse cropping systems. |
| **GAP-02** | **Mode of Action (MoA) Balance** | Over-representation of legacy chemical classes (3A Pyrethroids, 1B Organophosphates) relative to modern chemistries. | **HIGH** | Modern crop protection relies on Group 28 (Diamides), Group 23 (Ketoenols), Group 6 (Avermectins), and Group 5 (Spinosyns). Training without these chemistries introduces systematic bias. |
| **GAP-03** | **Bioassay Standardization** | Inconsistent baseline methodology across studies (topical droplet vs. leaf dip vs. artificial diet vs. glass vial residue). | **HIGH** | Different bioassay methods yield distinct baseline $LC_{50}$ values. Explicit harmonization of bioassay methodology prevents assay-specific measurement artifacts. |
| **GAP-04** | **Target-Site Mutations** | Absence of structured genotype insensitivity mutation tracking in feature vector. | **MEDIUM** | Major resistance trajectories are driven by well-characterized single-nucleotide polymorphisms ($kdr$ L1014F, AChE G119S, GABA A302S, RyR G4946E). |
| **GAP-05** | **Physicochemical Featurization** | Molecular modeling relied exclusively on circular fingerprints without continuous physicochemical descriptors. | **MEDIUM** | Incorporating molecular weight, $\log P$, TPSA, and hydrogen-bonding characteristics enables models to learn physical permeation and target pocket complementarity. |
| **GAP-06** | **Longitudinal Tracking** | Temporal observations were unevenly distributed across decades. | **LOW** | Longitudinal tracking requires time-stamped multi-year surveillance across consistent geographical zones. |

---

## 3. Data Acquisition & Harmonization Strategy for Dataset v2.0

1. **Source Expansion**:
   - Ingest verified multi-year surveillance bioassays from peer-reviewed APRD records, IRAC susceptibility surveys, and academic entomological literature.
2. **Canonical Deduplication**:
   - Apply source-aware publication deduplication to prevent counting the same baseline study multiple times.
3. **Chemical Structure Validation**:
   - Canonicalize all active ingredient structures using RDKit (SMILES $\to$ InChIKey $\to$ MolWt / LogP / TPSA).
4. **Target Mutation Encoding**:
   - Augment feature vector with known target-site mutation indicators.
