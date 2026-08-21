# Step 18 — Modeling Dataset Specification & Feature Availability Audit

This document defines the modeling observation unit, feature representation pipelines, target variable formulation, and feature availability audits for ResistanceIQ Dataset v3.0 (`aprd-resistance-v3`).

---

## 1. Unit of Observation & Modeling Scope

- **Observation Unit**: One row = One independent field bioassay observation testing a specific chemical active ingredient against a documented field population of a target pest/weed/pathogen in a specific year and geographic region.
- **Continuous Modeling Target**: $y = \log_{10}(RR) \in [0.0, \infty)$
- **Temporal Group Variable**: `resistance_year`
- **Subgroup Identifiers**: `canonical_organism.order`, `canonical_pesticide.irac_moa_group`, `country`, `resistance_mechanism`.

---

## 2. Feature Engineering Pipelines & Ablation Families

### Pipeline A: Chemical + Biological Baseline (`features-v3-baseline`)
- **Chemical Structure**: 1024-bit Morgan Extended Connectivity Fingerprint (ECFP4, radius 2).
- **Physicochemical Descriptors**: Exact Molecular Weight ($MW$), Wildman-Crippen SlogP, Topological Polar Surface Area ($TPSA$), Hydrogen Bond Donors ($HBD$), Hydrogen Bond Acceptors ($HBA$), Rotatable Bond Count ($RotB$).
- **Taxonomic & Biological Descriptors**: One-hot encoded taxonomic order (Hemiptera, Lepidoptera, Coleoptera, Trombidiformes, Caryophyllales, Poales, Helotiales, Capnodiales).
- **Assay & Temporal Features**: Standardized bioassay method (Leaf dip, Topical, Diet, Spray, Microtiter) + normalized exposure time.
- **Feature Count**: 1045 numeric features.
- **Availability across Dataset v3**: **100.0% (74/74 observations)**.

### Pipeline B: Baseline + Protein Target Structural Descriptors (`features-v3-protein`)
- **Pipeline A Descriptors** +
- **Target Protein Descriptors**: Direct target indicator, Swiss-Prot review status, active site mutation presence, PDB structure availability, resolution ($Å$).
- **Feature Count**: 1052 numeric features.
- **Availability across Dataset v3**: **64.9% (48/74 observations)** (Missing for metabolic-only cases).

### Pipeline C: Baseline + Metabolic Detoxification Descriptors (`features-v3-metabolic`)
- **Pipeline A Descriptors** +
- **Metabolic Descriptors**: Metabolic mechanism flag, P450/GST overexpression indicator, gene amplification flag.
- **Feature Count**: 1049 numeric features.
- **Availability across Dataset v3**: **35.1% (26/74 observations)** (Missing for direct target-only cases).

---

## 3. Feature Coverage & Completeness Matrix

| Feature Family | Descriptor Names | Availability | Missingness | Leakage Risk | Evaluation Gate Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Chemical ECFP4** | 1024 Morgan bit vector | 100.0% | 0.0% | None | **APPROVED** |
| **Physicochemical** | MW, logP, TPSA, HBD, HBA, RotB | 100.0% | 0.0% | None | **APPROVED** |
| **Taxonomy** | Order, Family, Genus | 100.0% | 0.0% | None | **APPROVED** |
| **Bioassay Protocol**| Method, Exposure Mode | 100.0% | 0.0% | None | **APPROVED** |
| **Target Protein** | Target Class, PDB Resolution | 64.9% | 35.1% | Low | **CONDITIONAL (Ablation B)** |
| **Metabolic Gene** | P450/GST Amplification Flag | 35.1% | 64.9% | Moderate | **CONDITIONAL (Ablation C)** |
