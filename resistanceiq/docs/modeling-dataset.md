# ResistanceIQ — Modeling Dataset Specification

## 1. Unit of Observation (One Row Definition)

$$\mathbf{\text{One Row}} = \text{One Verified Bioassay Resistance Measurement for a Canonical (Organism, Active Ingredient, Year, Country) tuple}$$

---

## 2. Column Specification

### 2.1 Target Column
* `target_log_rr` (Float): $\log_{10}(\text{resistance\_ratio})$. Primary regression target.
* `target_risk_tier` (String): Derived ordinal label (`SUSCEPTIBLE`, `TOLERANCE`, `MODERATE`, `CRITICAL`).

### 2.2 Input Feature Columns
* **Chemical Descriptors**:
  * `fp_ecfp4_1024` (Bit vector): 1024-bit Morgan circular fingerprints (radius 2).
  * `mol_weight` (Float): Molecular weight in $\text{g/mol}$.
  * `mol_logp` (Float): Calculated Octanol-water partition coefficient.
  * `mol_hbd` / `mol_hba` (Integer): Hydrogen bond donor/acceptor counts.
  * `mol_tpsa` (Float): Topological polar surface area.
* **Target Receptor & Mode of Action**:
  * `irac_moa_group` (Categorical One-Hot): e.g. `1A`, `1B`, `3A`, `4A`, `6`, `28`.
* **Pest Demographics**:
  * `pest_order` (Categorical One-Hot): `Hemiptera`, `Lepidoptera`, `Diptera`, `Trombidiformes`.
  * `pest_family` (Categorical One-Hot).
* **Assay Context**:
  * `bioassay_method` (Categorical One-Hot): `Topical`, `Leaf-Dip`, `Diet-Incorporation`.

### 2.3 Group & Split Identifiers
* `resistance_year` (Integer): Temporal split anchor.
* `bemis_murcko_scaffold` (String): Scaffold cluster identifier.
* `organism_canonical_name` (String): Pest group identifier.

### 2.4 Excluded / Quarantine Columns
* `publication_year`, `reference`, `resistance_type`, `location` (Excluded to prevent data leakage and memorization).
