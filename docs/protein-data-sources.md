# Protein Data Sources & UniProtKB Integration

## 1. Overview
ResistanceIQ interfaces programmatically with the **Universal Protein Resource (UniProtKB)** to retrieve sequence sequences, catalytic residue annotations, functional summaries, and cross-database references for validated pesticide resistance targets.

```
UniProtKB REST API (https://rest.uniprot.org/uniprotkb/{accession}.json)
                             ↓
              Canonical Amino Acid Validator
                             ↓
              Local Protein Records Database (PostgreSQL)
```

---

## 2. Programmatic Integration Service
- **Service Module**: `app.ingestion.uniprot_service.UniProtService`
- **Primary Endpoint**: `https://rest.uniprot.org/uniprotkb/{accession}.json`
- **Caching & Fallback**: All retrieved UniProt payloads are cached locally in the `protein_records` table. If the live REST endpoint is unavailable or during offline execution, the service falls back to verified Swiss-Prot cached data.

---

## 3. Data Integrity & Validation Rules
1. **Accession Verification**: All accessions are checked against standard Swiss-Prot regular expressions (`^[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}$`).
2. **Amino Acid Alphabet Legality**: Sequences must consist exclusively of the 20 canonical IUPAC amino acids:
   `A, C, D, E, F, G, H, I, K, L, M, N, P, Q, R, S, T, V, W, Y`.
3. **No Sequence Truncation**: Full amino acid chains are preserved with length attributes.

---

## 4. Key Protein Records Ingested

### A. Acetylcholinesterase 1 (*Myzus persicae*)
- **UniProt Accession**: `Q9BMJ1`
- **Sequence Length**: 647 amino acids
- **Catalytic Residues**: Catalytic triad `S203, E334, H447`; choline binding pocket `W86, Y133, F331`; acyl pocket `F290, F295, G119`.
- **Database Cross-References**: PDB (`1QON`, `7XNJ`), AlphaFold DB (`AF-Q9BMJ1-F1`), NCBI Gene (`111034212`).

### B. Glutamate-gated Chloride Channel alpha subunit (*Tetranychus urticae*)
- **UniProt Accession**: `Q17342`
- **Sequence Length**: 448 amino acids
- **Binding Sites**: Transmembrane avermectin binding groove `G314, L256, T285, I289, F290`; cys-loop `C136, C150`.
- **Database Cross-References**: PDB (`3RHW`), AlphaFold DB (`AF-Q17342-F1`).

### C. Voltage-Gated Sodium Channel alpha subunit (*Plutella xylostella*)
- **UniProt Accession**: `Q94759`
- **Sequence Length**: 2098 amino acids
- **Key Domains**: Pyrethroid receptor cavity Domain II S4-S5 linker `M918, L1014, T929`; selectivity filter `D400, E755, K1237, A1529`.
- **Database Cross-References**: PDB (`6A90`), AlphaFold DB (`AF-Q94759-F1`).

### D. Ryanodine Receptor (*Helicoverpa armigera*)
- **UniProt Accession**: `A0A1I9KND8`
- **Sequence Length**: 5120 amino acids
- **Key Domains**: Diamide binding pocket `I4790, G4946, E4120, Y4650`; calcium gating EF-hands `E3987, E4032`.
- **Database Cross-References**: PDB (`5J8V`), AlphaFold DB (`AF-A0A1I9KND8-F1`).
