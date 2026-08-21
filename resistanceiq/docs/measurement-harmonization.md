# ResistanceIQ — Resistance Measurement Harmonization

## 1. The Challenge of Heterogeneous Bioassay Protocols

Toxicological bioassays evaluate chemical potency through diverse exposure methods:
- **Topical Application**: Micro-droplet application directly to insect pronotum (common for *Musca domestica*, *Helicoverpa armigera*). Expressed as $\mu\text{g a.i. / insect}$.
- **Leaf-Dip / Residual Exposure**: Dipping host plant leaf discs into chemical dilutions (standard for *Myzus persicae*, *Plutella xylostella*, *Tetranychus urticae*). Expressed as $\text{mg a.i. / L}$ or $\text{ppm}$.
- **Diet-Incorporation / Systemic Uptake**: Mixing chemical into artificial diet media (common for stem borers and armyworms). Expressed as $\text{mg a.i. / kg diet}$.

---

## 2. Harmonization Rules

### Rule 1: Never Merge Raw Absolute $LC_{50}$ Numbers Across Methods
Raw $LC_{50}$ values measured in $\mu\text{g/insect}$ cannot be mathematically averaged with leaf-dip $\text{ppm}$ values.

### Rule 2: Normalize to Dimensionless Resistance Ratio ($RR$)
$$RR = \frac{LC_{50}^{\text{field\_strain}}}{LC_{50}^{\text{susceptible\_baseline\_strain}}}$$

By dividing the field population $LC_{50}$ by the concurrent laboratory susceptible reference strain tested under the **identical assay protocol**, the measurement becomes dimensionless and unit-invariant.

### Rule 3: Stratify Bioassay Method as a Categorical Feature
Even though $RR$ is dimensionless, certain testing methods (e.g. leaf-dip vs topical) can have different sensitivities to behavioral avoidance vs cuticular penetration. `bioassay_method` must be preserved as an explicit input covariate.
