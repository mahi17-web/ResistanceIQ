# Biological Target Data Sources & IRAC MoA Taxonomy

## 1. Overview
ResistanceIQ maps agricultural pesticide targets to verified biochemical receptors and ion channels classified under the **Insecticide Resistance Action Committee (IRAC) Mode of Action (MoA)** framework and **Arthropod Pesticide Resistance Database (APRD)**.

---

## 2. Authoritative Primary Sources
1. **IRAC Mode of Action Classification Scheme**:
   - **Authority**: Insecticide Resistance Action Committee (CropLife International)
   - **Standard Version**: IRAC MoA Classification Version 11.1
   - **URL**: `https://irac-online.org/modes-of-action/`
2. **Arthropod Pesticide Resistance Database (APRD)**:
   - **Authority**: Michigan State University Extension & IRAC
   - **URL**: `https://www.pesticideresistance.org/`
3. **UniProtKB / Swiss-Prot Curated Target Entries**:
   - **Authority**: European Bioinformatics Institute (EMBL-EBI), SIB, and PIR
   - **URL**: `https://www.uniprot.org/`

---

## 3. Validated Receptor Catalog & Documented Resistance Mechanisms

| Target ID | Receptor Name | Gene | Threat Organism | UniProt | IRAC MoA | Documented Hotspots & Resistance Mechanisms |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `tgt_ache1_01` | Acetylcholinesterase 1 (AChE1) | *ace-1* | *Myzus persicae* | `Q9BMJ1` | 1A / 1B | Target-site insensitivity; point mutations G119S, F331W, A201S in the choline gorge |
| `tgt_glucl_02` | Glutamate-gated Chloride Channel (GluCl-α) | *GluCl* | *Tetranychus urticae* | `Q17342` | 6 | Allosteric channel pore locking; G314D point mutation |
| `tgt_vgsc_03` | Voltage-Gated Sodium Channel (VGSC / *para*) | *para* | *Plutella xylostella* | `Q94759` | 3A | Knockdown resistance (*kdr*: L1014F, *super-kdr*: T929I, M918T) in Domain II S4-S5 |
| `tgt_ryr_04` | Ryanodine Receptor (RyR) | *ryr* | *Helicoverpa armigera* | `A0A1I9KND8` | 28 | Anthranilic diamide resistance mutations I4790M, G4946E in the transmembrane domain |
| `tgt_rdl_05` | GABA-gated Chloride Channel (RDL) | *Rdl* | *Plutella xylostella* | `P25123` | 2B | A302S / A302G dieldrin and fipronil resistance mutations in M2 pore lining |

---

## 4. Threat Organism Association Matrix
Targets are not assigned arbitrarily across organisms. Each biological target is strictly mapped to its host species:
- **`pst_aphid_01` (*Myzus persicae*)** → Acetylcholinesterase 1 (`tgt_ache1_01`)
- **`pst_mite_02` (*Tetranychus urticae*)** → Glutamate-gated Chloride Channel (`tgt_glucl_02`)
- **`pst_moth_03` (*Plutella xylostella*)** → Voltage-Gated Sodium Channel (`tgt_vgsc_03`), GABA Receptor RDL (`tgt_rdl_05`)
- **`pst_bollworm_04` (*Helicoverpa armigera*)** → Ryanodine Receptor (`tgt_ryr_04`)

---

## 5. Provenance Requirements
Every target record must carry:
- `target_name`: Canonical biological receptor nomenclature
- `gene_name`: Validated genetic symbol
- `organism_id`: Foreign key link to canonical organism
- `uniprot_accession`: Verified Swiss-Prot identifier
- `source`: Attribution reference (`UniProtKB/Swiss-Prot & IRAC MoA Compendium`)
- `evidence_level`: `"CURATED_EXPERIMENTAL"`
