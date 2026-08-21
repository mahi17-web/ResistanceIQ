# Step 18 — Measurement Harmonization & Chemical / Taxonomy Normalization

This document establishes the scientific protocols for unit conversion, susceptible baseline standardization, bioassay protocol harmonization, and chemical/taxonomic entity resolution for ResistanceIQ Dataset v3.0 (`aprd-resistance-v3`).

---

## 1. Resistance Ratio Formulation & Target Normalization

All quantitative bioassay measurements are harmonized to the dimensionless **Resistance Ratio ($RR$)**:

$$RR = \frac{\text{LC}_{50,\text{field population}}}{\text{LC}_{50,\text{susceptible reference baseline}}}$$

Where:
- $\text{LC}_{50}$ is the lethal concentration yielding 50% mortality in probit / log-logistic dose-response regression.
- For weed foliar tests, $\text{GR}_{50}$ (growth reduction 50%) is used.
- For fungal microtiter assays, $\text{EC}_{50}$ (effective concentration inhibiting 50% mycelial growth) is used.

### Continuous Modeling Target:
$$y = \log_{10}(RR)$$
- $RR = 1.0 \implies y = 0.0$ (Full baseline susceptibility)
- $RR = 10.0 \implies y = 1.0$ ($10\times$ resistance)
- $RR = 100.0 \implies y = 2.0$ ($100\times$ resistance)

---

## 2. Susceptible Baseline Harmonization Protocol

1. **Certified Laboratory Colonies**: Baseline $\text{LC}_{50}$ measurements must be derived from documented susceptible strains reared without insecticide exposure for $\ge 10$ generations (e.g. Rothamsted US1L strain for *M. persicae*, G88 strain for *P. xylostella*).
2. **Pre-Commercial Historic Baselines**: When tested prior to regional commercial launch, the earliest published regional $\text{LC}_{50}$ baseline is used.
3. **Incompatible Baselines**: Studies using arbitrary local controls without probit slope documentation are marked `UNRESOLVED` and excluded from continuous modeling.

---

## 3. Bioassay Protocol Harmonization

| Standard Bioassay Method | Exposure Mode | Target Organisms | Standardized Units | Conversion Rule |
| :--- | :--- | :--- | :--- | :--- |
| **Leaf-Dip (IRAC Method 001/007)** | Ingestion + Contact | Aphids, Mites, Caterpillars | $\text{mg/L}$ ($\text{ppm}$) | Direct concentration in aqueous wetting agent |
| **Topical Micro-application** | Cuticular Penetration | Beetles, Bollworms, Roaches | $\mu\text{g a.i. / insect}$ | Dose per insect normalized to mean body weight |
| **Diet Incorporation (IRAC 020)** | Ingestion | Fall Armyworm, Corn Borer | $\text{mg a.i. / kg diet}$ ($\text{ppm}$) | Concentration mixed into artificial agar diet |
| **Rice Stem Immersion** | Systemic Ingestion | Planthoppers, Leafhoppers | $\text{mg/L}$ ($\text{ppm}$) | Rice seedling root/stem immersion |
| **Foliar Spray Pot Assay** | Foliar Coverage | Weeds (*Amaranthus*, *Eleusine*) | $\text{g a.i. / ha}$ | Track sprayer application rate |
| **Microtiter Agar / Liquid $\text{EC}_{50}$** | Substrate Contact | Fungi (*Botrytis*, *Zymoseptoria*) | $\text{mg/L}$ ($\text{ppm}$) | Multi-well spectrophotometric optical density |

---

## 4. Chemical Entity Resolution Standards

Every pesticide active ingredient is resolved against PubChem and standard cheminformatics toolkits:
- **Canonical SMILES**: RDKit standardized dearomatized/canonical representation.
- **InChIKey**: Standard 27-character hashed InChI string for unambiguous isomer/identity verification.
- **Physicochemical Properties**: Molecular Weight, SlogP, Topological Polar Surface Area (TPSA), Hydrogen Bond Donors (HBD), Hydrogen Bond Acceptors (HBA), and Rotatable Bond Count.
- **MoA Classification**: Validated against IRAC MoA Classification Scheme (v10.4, 2024), HRAC Mode of Action Classification (2024), or FRAC Code List (2024).

---

## 5. Taxonomic Entity Resolution Standards

Every target organism is mapped against NCBI Taxonomy:
- **NCBI TaxID**: Verified integer taxonomic identifier.
- **Phylogenetic Lineage**: Complete taxonomic hierarchy (Kingdom, Division, Class, Order, Family, Genus, Species).
- **Taxonomic Rank**: Verified species or subspecies level.
