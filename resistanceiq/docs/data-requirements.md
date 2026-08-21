# ResistanceIQ — Scientific Data Requirements Specification

This document defines the canonical schema, required data fields, validation constraints, and biological rationale for all entities ingested into the ResistanceIQ platform.

---

## 1. Molecule (Chemical Structure & Properties)

| Field | Type | Required | Units / Format | Description & Scientific Rationale |
|---|---|---|---|---|
| `molecule_id` | String (UUID) | Yes | Canonical ID | Unique identifier across the platform |
| `molecule_name` | String | Yes | ISO / IUPAC / Code | Primary name or developmental code (e.g. "Clothianidin", "BW-4477A") |
| `smiles` | String | Yes | Valid SMILES | Simplified Molecular-Input Line-Entry System for structure parsing |
| `inchi` | String | Optional | Standard InChI | IUPAC International Chemical Identifier for unambiguous hashing |
| `inchikey` | String | Optional | 27-char InChIKey | Exact hash key for duplicate detection and ChEMBL/PubChem joins |
| `molecular_weight`| Float | Yes | $\text{g/mol}$ (Da) | Calculated molecular mass |
| `logp` | Float | Yes | Dimensionless | Octanol-water partition coefficient (lipophilicity) |
| `tpsa` | Float | Optional | $\text{\AA}^2$ | Topological polar surface area |
| `hbd_count` | Integer | Yes | Count | Number of Hydrogen Bond Donors |
| `hba_count` | Integer | Yes | Count | Number of Hydrogen Bond Acceptors |
| `rotatable_bonds`| Integer | Optional | Count | Molecular conformational flexibility metric |
| `chemical_class` | String | Yes | Categorical | Chemical family (e.g., Neonicotinoid, Pyrethroid, Diamide, Organophosphate) |
| `irac_moa_group` | String | Yes | E.g. "4A", "1B", "28" | Insecticide Resistance Action Committee Mode of Action code |

---

## 2. Target (Biological Receptor & Protein Structure)

| Field | Type | Required | Units / Format | Description & Scientific Rationale |
|---|---|---|---|---|
| `target_id` | String (UUID) | Yes | Canonical ID | Unique target entity identifier |
| `target_name` | String | Yes | Standard Name | Common receptor name (e.g., "Acetylcholinesterase 1", "Ryanodine Receptor") |
| `gene_symbol` | String | Yes | E.g. `ace-1`, `rdl` | Standardized gene symbol in model arthropod genomes |
| `uniprot_accession`| String | Yes | E.g. `Q9BMJ1` | Canonical UniProtKB protein sequence accession |
| `organism_ncbi_taxid`| Integer | Yes | NCBI Taxonomy ID | Specific organism ortholog (e.g., 7070 for *Myzus persicae*) |
| `pdb_structure_id` | String | Optional | RCSB PDB ID | Experimental 3D crystal/Cryo-EM structure ID (e.g. `1QON`, `5J8V`) |
| `structure_origin` | String | Yes | `X-RAY` / `CRYO-EM` / `ALPHAFOLD2` / `ESMFOLD` | Experimental method or computational prediction origin |
| `binding_pocket_residues` | List[String] | Yes | JSON Array (e.g. `["W86", "G119", "F290"]`) | Key amino acid residues forming the orthosteric/allosteric binding site |

---

## 3. Pest / Organism (Species Demographics & Genetics)

| Field | Type | Required | Units / Format | Description & Scientific Rationale |
|---|---|---|---|---|
| `organism_id` | String (UUID) | Yes | Canonical ID | Unique organism identifier |
| `scientific_name`| String | Yes | Binomial Latin | Valid taxonomic name (e.g., *Plutella xylostella*, *Tetranychus urticae*) |
| `common_name` | String | Yes | English Common | Common agricultural name (e.g., "Diamondback Moth", "Two-Spotted Spider Mite") |
| `ncbi_taxid` | Integer | Yes | Positive Integer | NCBI Taxonomy Browser identifier |
| `order` | String | Yes | E.g. `Hemiptera`, `Lepidoptera`, `Acari` | Taxonomic order |
| `family` | String | Yes | E.g. `Aphididae`, `Plutellidae`, `Tetranychidae` | Taxonomic family |
| `generation_time_days` | Float | Yes | Days ($25^\circ\text{C}$) | Average generation duration under standard temperature |
| `generations_per_year` | Float | Yes | Annual Count | Typical field voltinism in temperate/subtropical agriculture |
| `baseline_mutation_rate` | Float | Optional | Mutations/bp/gen | Estimated spontaneous mutation rate ($\sim 10^{-8}$) |

---

## 4. Resistance Observation (Empirical Field / Lab Bioassay)

| Field | Type | Required | Units / Format | Description & Scientific Rationale |
|---|---|---|---|---|
| `observation_id` | String (UUID) | Yes | Canonical ID | Unique bioassay observation record |
| `source_database` | String | Yes | `APRD` / `IRAC` / `LITERATURE` / `INTERNAL` | Provenance source origin |
| `source_record_id` | String | Yes | External ID | Original database accession (e.g. APRD record #) |
| `collection_year` | Integer | Yes | YYYY ($\ge 1940$) | Year field population samples were collected |
| `collection_country`| String | Yes | ISO 3166-1 alpha-2 | Country of origin |
| `collection_region` | String | Optional | State / Province | Specific agricultural valley or county |
| `pest_id` | String (UUID) | Yes | FK -> Organism | Tested species population |
| `pesticide_active_ingredient` | String | Yes | Active Name | Tested chemical compound |
| `bioassay_method` | String | Yes | Standard Protocol | E.g. `Leaf-Dip`, `Topical`, `Diet-Incorporation`, `Vial-Residual` |
| `life_stage_tested` | String | Yes | `Larva (L2/L3)` / `Adult` / `Nymph` | Developmental stage subjected to bioassay |
| `lc50_value` | Float | Optional | $\text{mg/L}$ or $\text{ppm}$ or $\mu\text{g/cm}^2$ | Lethal concentration for 50% mortality |
| `lc50_unit` | String | Optional | Unit string | Standardized metric unit |
| `susceptible_baseline_lc50` | Float | Optional | Same as `lc50_value` | Standard lab susceptible reference strain $LC_{50}$ |
| `resistance_ratio` | Float | Yes | Ratio ($LC_{50}^{\text{test}} / LC_{50}^{\text{susceptible}}$) | Target ratio (or explicitly extracted from publication) |
| `log10_resistance_ratio` | Float | Yes | Continuous ($\log_{10}(RR)$) | Standard transformed target variable |
| `resistance_phenotype` | String | Yes | `SUSCEPTIBLE` / `TOLERANT` / `MODERATE` / `HIGH` | Ordinal classification tier |

---

## 5. Target-Site Genotype / Mutation (When Sequenced)

| Field | Type | Required | Units / Format | Description & Scientific Rationale |
|---|---|---|---|---|
| `mutation_id` | String (UUID) | Yes | Canonical ID | Mutation record |
| `observation_id` | String (UUID) | Optional | FK -> Observation | Associated bioassay observation (if sequenced) |
| `gene_name` | String | Yes | Gene name | E.g. `ace-1`, `para`, `GABA-R`, `RyR` |
| `wildtype_amino_acid` | String (1-char)| Yes | E.g. `G`, `L`, `T` | Wildtype residue at reference position |
| `mutant_amino_acid` | String (1-char)| Yes | E.g. `S`, `F`, `I` | Substituted amino acid |
| `protein_position` | Integer | Yes | Positive Integer | Standard alignment position (e.g., 119 in AChE1, 1014 in VGSC) |
| `mutation_name` | String | Yes | E.g. `G119S`, `L1014F (kdr)`, `I4790M` | Widely recognized mutation designation |
| `allele_frequency` | Float | Optional | 0.00 – 1.00 | Measured population frequency if pooled NGS or qPCR |
| `evidence_type` | String | Yes | `IN_VITRO_MUTAGENESIS` / `FIELD_ASSOCIATION` / `CRISPR_KNOCKIN` | Validation level confirming resistance causation |

---

## 6. Environmental & Agronomic Context (Strict Inclusion Criteria)

*Only included when documented in peer-reviewed literature or official agricultural extension reports:*

| Field | Type | Inclusion Criteria | Scientific Justification |
|---|---|---|---|
| `crop_host` | String | Documented in bioassay record | Certain crops (e.g. greenhouse ornamentals vs. field cotton) apply vastly different selection frequencies. |
| `spray_regime_frequency` | Integer/Float | Documented spray logs available | Direct multiplier on Wright-Fisher selection coefficient ($s$). |
| `tank_mix_partners` | List[String] | Documented in record | Mixture partners affect cross-resistance and synergistic inhibition. |

*Fields excluded due to lack of historical documentation: micro-climate weather on spray day, undocumented adjuvant brands, proprietary formulation carriers.*
