# Step 21 — Target Formulation & Measurement Comparability Audit

This document investigates whether the current machine learning target formulation, $\log_{10}(RR)$, is scientifically sound and evaluates alternative target representations across ResistanceIQ Dataset v4.0 (`aprd-resistance-v4`).

---

## 1. Target Harmonization & Comparability Audit

Each observation in Dataset v4 ($N=89$) was audited for susceptible baseline rigor, bioassay protocol standardization, and measurement comparability:

| Comparability Class | Definition & Scientific Criteria | Observation Count | % of Dataset | Scientific Assessment |
| :--- | :--- | :---: | :---: | :--- |
| **HIGH_COMPARABILITY** | Documented certified susceptible reference lab colony + standard probit $\text{LC}_{50}$ (Leaf-dip, Topical micro-application, Diet incorporation). | **71** | **79.8%** | **Rigorous**: Direct ratio of certified susceptible baseline to field population $\text{LC}_{50}$. |
| **MEDIUM_COMPARABILITY**| Pre-commercial regional baseline + standard spray/immersion protocol (Foliar pot spray, Rice stem immersion, Microtiter $\text{EC}_{50}$). | **18** | **20.2%** | **Acceptable**: Valid field dose-response curves with pre-treatment historical baselines. |
| **LOW_COMPARABILITY** | Unstandardized qualitative dips or non-probit slope estimates. | **0** | **0.0%** | Excluded from canonical dataset. |
| **UNRESOLVED** | Missing baseline or unconvertible units. | **0** | **0.0%** | Quarantined in raw ingestion gate. |

---

## 2. Evaluation of Candidate Target Representations

| Candidate Target Representation | Mathematical Formulation | Scientific Interpretation | Data Availability | Label Consistency | Key Advantages | Key Limitations |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **Target A: $\log_{10}(RR)$ (Current)** | $y = \log_{10}(\text{LC}_{50,\text{field}} / \text{LC}_{50,\text{base}})$ | Continuous order-of-magnitude resistance shift. | **100.0% (89/89)** | High | Preserves exact quantitative dose-response ratios; normalizes skewed multipliers. | Heteroscedastic residual variance across extreme outliers ($RR > 100\times$). |
| **Target B: Ordinal Risk Categories** | $y \in \{\text{Susceptible}, \text{Low}, \text{Moderate}, \text{High}\}$ | Discrete operational resistance tiers ($RR < 5, 5–10, 10–100, \ge 100$). | **100.0% (89/89)** | High | Directly aligns with agricultural advisory action thresholds. | Discards continuous variance; boundaries are heuristic rather than biological step-functions. |
| **Target C: Binary Field Resistance** | $y \in \{0, 1\}$ ($RR \ge 10\times$) | Binary operational control failure flag. | **100.0% (89/89)** | High | High statistical power on smaller sample sizes. | Loss of granular resistance severity; ignores distinction between $15\times$ and $500\times$. |
| **Target D: Longitudinal Hazard / Time-to-Event** | $T = t_{\text{failure}} - t_{\text{launch}}$ | Years from commercial launch to resistance threshold. | **15.7% (14/89)** | Moderate | Directly answers durability question. | Severely data-constrained ($N=14$ series); right-censoring complicates small samples. |

---

## 3. Target Formulation Conclusion

> **Conclusion**: **$\log_{10}(RR)$ is confirmed as the most scientifically defensible continuous regression target.**
>
> 100% of canonical records support $\log_{10}(RR)$, with 79.8% meeting `HIGH_COMPARABILITY` standards. Rather than replacing the target, the modeling methodology must incorporate **hierarchical chemical-family grouping and localized heteroscedastic uncertainty**.
