# ResistanceIQ — IRAC Source Feasibility & Taxonomy Assessment

## 1. Organization Overview

* **Full Name**: Insecticide Resistance Action Committee (IRAC)
* **Parent Organization**: CropLife International
* **Official URL**: [https://irac-online.org/](https://irac-online.org/)
* **Mission**: Provide a coordinated crop protection industry effort to prevent or delay the development of insecticide and acaricide resistance through proactive resistance management.

---

## 2. Core Scientific Assets Provided by IRAC

### 2.1 IRAC Mode of Action (MoA) Classification Scheme
* **Current Standard**: Version 11 (with periodic subgroup addenda).
* **Taxonomic Hierarchy**:
  - **Main Group (1–35)**: Defines the primary target protein receptor or physiological biochemical site (e.g. *Group 1: Acetylcholinesterase (AChE) inhibitors*, *Group 4: Nicotinic acetylcholine receptor (nAChR) competitive modulators*, *Group 28: Ryanodine receptor modulators*).
  - **Chemical Sub-group**: Defines distinct chemical classes within a target site sharing cross-resistance risks (e.g. *1A: Carbamates*, *1B: Organophosphates*; *4A: Neonicotinoids*, *4C: Sulfoximines*, *4D: Butenolides*).
  - **Active Ingredients**: Canonical listing of all registered active compounds assigned to each subgroup.

### 2.2 Standardized IRAC Susceptibility Test Methods
* **Protocols**: Over 30 approved, validated testing methodologies (#001 through #032) detailing life stages, exposure durations, formulation standards, and diagnostic concentration calculations for standard bioassays.

---

## 3. Data Ingestion & Technical Integration

- **Format**: IRAC publishes official classification tables via structured PDF publications and interactive web search catalogs.
- **Ingestion Strategy**:
  1. Digest IRAC MoA catalog into canonical database table `canonical_pesticides` with assigned `irac_moa_group`.
  2. Map unclassified discovery molecules to closest IRAC target group using chemical substructure similarity and binding pocket docking scores.
- **Licensing & Attribution**: Open access for educational, academic, and industrial resistance management purposes with explicit citation of IRAC.
