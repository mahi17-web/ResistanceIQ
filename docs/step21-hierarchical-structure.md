# Step 21 — Hierarchical Structure & Variance Decomposition Audit

This document presents the hierarchical variance decomposition across Chemical, Taxonomic, Procedural, and Temporal dimensions in ResistanceIQ Dataset v4.0 (`aprd-resistance-v4`).

---

## 1. Hierarchical Variance Decomposition ($\eta^2$ on $\log_{10} RR$)

To understand the fundamental drivers of resistance variation, ANOVA eta-squared ($\eta^2$) effect sizes were computed across nested structural groupings:

| Structural Dimension | Grouping Variable | Group Count | Variance Explained ($\eta^2$) | Scientific Role & Impact |
| :--- | :--- | :---: | :---: | :--- |
| **Chemical Identity** | `active_ingredient` | 43 compounds | **79.3%** | **Primary Driver**: Inherent chemical scaffold, metabolic vulnerability, and target affinity dictate resistance potential. |
| **Mode of Action (MoA)** | `irac_moa_group` | 26 MoA classes | **74.4%** | **Primary Mechanism**: Cross-resistance is strongly conserved within shared molecular receptor families. |
| **Assay Method** | `bioassay_method` | 17 protocols | **39.1%** | **Procedural Variance**: Leaf-dip vs topical vs diet exposure introduces systematic baseline multiplier differences. |
| **Temporal Period** | Epoch ($\le 2009, 2010–2018, 2019+$) | 3 epochs | **21.0%** | **Accumulation Effect**: Field selection intensity increases over chronological time post-launch. |
| **Species Taxonomy** | `scientific_name` | 15 species | **16.0%** | **Biological Baseline**: Generation time, voltinism, and baseline detoxification capacity. |

---

## 2. Species $\times$ Compound Interaction Analysis

- **Interaction Dominance**: Specific high-resistance outcomes are heavily clustered within specific compound $\times$ species pairs (e.g. *P. xylostella* $\times$ Chlorantraniliprole, *M. persicae* $\times$ Imidacloprid, *H. armigera* $\times$ Cypermethrin).
- **Within-Species Variance**: Strains within the same pest species exhibit resistance ratios ranging from $1.1\times$ to $450.0\times$ depending strictly on chemical MoA selection pressure.
- **Hierarchical Modeling Recommendation**:
  - A flat global regression model treating all 89 rows as independently and identically distributed (i.i.d.) fails to capture the strong grouping structure ($\eta^2 \approx 79\%$).
  - Future iterations should utilize **hierarchical random effects** or **chemical-family grouped priors** (estimating compound/MoA baseline effects before individual residual prediction).
