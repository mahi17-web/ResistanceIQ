# ResistanceIQ — Step 26 Known Limitations & Scientific Scope

## 1. Scientific Governance & Status
- **Status**: `REQUIRES VALIDATION`.
- **Scope**: ResistanceIQ is designed for research, computational screening, and exploratory decision intelligence. Durability scores and resistance forecasts are predictive estimations and must be validated through laboratory bioassays and field trial protocols prior to commercial pesticide formulation commitments.

---

## 2. Chemical Space & Out-of-Domain Boundaries
- **Fingerprint Scope**: The model relies on ECFP4 Morgan fingerprints (1024-bit) and 7 physicochemical descriptors.
- **Novel Scaffolds**: Exotic organometallics, biological peptides, or macrocyclic scaffolds with Tanimoto similarity $< 0.25$ against the APRD training space are flagged as `OUT_OF_DOMAIN`. Widened conformal bounds are applied.
- **Unclassified MoA**: Pesticides without an assigned IRAC Mode of Action group (e.g. `99_UNCLASSIFIED`) receive default conservative baseline penalties.

---

## 3. Agronomic & Demographic Assumptions
- **Field Horizon Simulation**: Wright-Fisher evolutionary simulations assume standard Mendelian inheritance with additive allele effects and constant selection pressure. Real-world microclimate fluctuations and spray drift dynamics require regional customization.
