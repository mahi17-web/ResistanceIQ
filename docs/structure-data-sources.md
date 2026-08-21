# Protein Structure Data Sources & Prioritization Hierarchy

## 1. Overview
3D coordinate structures provide the structural basis for mutation hotspot modeling, binding affinity estimation, and steric clash simulations. ResistanceIQ queries both experimental archives (RCSB PDB) and computed structural repositories (AlphaFold Protein Structure Database), enforcing a strict quality hierarchy.

---

## 2. Structure Prioritization Hierarchy
When resolving structural models for a target protein, ResistanceIQ enforces the following deterministic hierarchy:

```
Priority 1: Experimentally Determined Structure (X-ray, Cryo-EM, NMR)
                               ↓ (if unavailable)
Priority 2: Validated Computed Structure Model (AlphaFold DB / ESMFold)
                               ↓ (if unavailable)
Priority 3: "Protein structure unavailable" (Zero Fabrication)
```

1. **Priority 1 — EXPERIMENTAL**:
   - High-resolution X-ray crystallography, Cryo-Electron Microscopy (Cryo-EM), or Solution NMR.
   - Sourced directly from **RCSB Protein Data Bank (PDB)**.
   - Sorted by experimental resolution (lower Å value prioritized).
2. **Priority 2 — COMPUTED**:
   - High-confidence computed structural predictions from **AlphaFold DB (EMBL-EBI / DeepMind)** or **ESMFold (Meta AI)**.
   - Explicitly flagged as `COMPUTED` to avoid implying empirical resolution.
3. **Priority 3 — UNAVAILABLE**:
   - If neither an experimental PDB entry nor a verified computed model exists, the system displays `"Protein structure unavailable"`.
   - **Zero Fabrication Rule**: Under no circumstances does the system invent a PDB ID, chain coordinate, or structure URL.

---

## 3. Authoritative Structure Data Ingested

| UniProt ID | Target Receptor | Primary PDB | Type | Method | Resolution | Structure Source | Model / Coordinate URL |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Q9BMJ1` | AChE1 (*M. persicae*) | `1QON` | `EXPERIMENTAL` | X-RAY DIFFRACTION | 2.20 Å | RCSB_PDB | `https://www.rcsb.org/structure/1QON` |
| `Q9BMJ1` | AChE1 (*M. persicae*) | `AF-Q9BMJ1-F1` | `COMPUTED` | COMPUTED_ALPHAFOLD2 | — | ALPHAFOLD_DB | `https://alphafold.ebi.ac.uk/entry/Q9BMJ1` |
| `Q17342` | GluCl-α (*T. urticae*) | `3RHW` | `EXPERIMENTAL` | X-RAY DIFFRACTION | 3.26 Å | RCSB_PDB | `https://www.rcsb.org/structure/3RHW` |
| `Q94759` | VGSC (*P. xylostella*) | `6A90` | `EXPERIMENTAL` | CRYO-EM | 3.80 Å | RCSB_PDB | `https://www.rcsb.org/structure/6A90` |
| `A0A1I9KND8` | RyR (*H. armigera*) | `5J8V` | `EXPERIMENTAL` | CRYO-EM | 3.80 Å | RCSB_PDB | `https://www.rcsb.org/structure/5J8V` |
| `P25123` | RDL (*P. xylostella*) | `AF-P25123-F1` | `COMPUTED` | COMPUTED_ALPHAFOLD2 | — | ALPHAFOLD_DB | `https://alphafold.ebi.ac.uk/entry/P25123` |

---

## 4. Programmatic Structure APIs
- **RCSB PDB Data API**: `https://data.rcsb.org/rest/v1/core/entry/{pdb_id}`
- **AlphaFold Database API**: `https://alphafold.ebi.ac.uk/api/prediction/{uniprot_accession}`
- **Service Class**: `app.ingestion.rcsb_structure_service.ProteinStructureService`
