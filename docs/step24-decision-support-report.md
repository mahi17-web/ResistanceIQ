# Step 24 — Final Candidate Ranking, Evidence-Aware Forecasting & Decision Support Report

This report documents the results of Step 24: Candidate Ranking, Pairwise Evaluation, Top-$K$ Prioritization, Uncertainty Overlap Handling, Unified Evidence-Aware Forecast Payloads, and Historical Backtest Simulations on ResistanceIQ Dataset v4.0 (`aprd-resistance-v4`).

---

## 1. Executive Summary & Core Scientific Findings

> [!IMPORTANT]
> **Core Finding**:
> 1. **Candidate Ranking Utility**: While continuous absolute resistance forecasting on novel chemistry remains bounded by chemical distance, **ResistanceIQ achieves a Pairwise Ranking Accuracy of 59.4% (Test) and 58.9% (Historical Backtest), with a Top-3 Candidate Prioritization Precision of 66.7% and Top-5 Precision of 80.0%**.
> 2. **Uncertainty Overlap Policy**: When candidate prediction intervals overlap substantially ($|y_A - y_B| < 0.5(w_A + w_B)$), the platform formally labels candidates as **`NOT CLEARLY DISTINGUISHABLE`**, preventing forced or misleading artificial distinctions.
> 3. **Unified Evidence-Aware Forecast Object**: Replaced opaque point estimates with transparent evidence profiles integrating scaffold status, nearest historical neighbors, assay comparability, and research heuristic disclaimers.

---

## 2. Pairwise Candidate Ranking & Top-$K$ Prioritization Matrix

| Evaluation Benchmark | Partition Evaluated | Total Candidate Pairs | Pairwise Ranking Accuracy | Spearman Rho ($\rho$) | Kendall Tau ($\tau$) | Top-3 Prioritization Precision | Top-5 Prioritization Precision |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Historical Backtest** | Validation Set ($2013–2018, N=34$) | 555 | **58.9%** | **+0.266** | **+0.188** | 66.7% | 60.0% |
| **Held-Out Future Test** | Future Test ($2019–2024, N=15$) | 101 | **59.4%** | **+0.273** | **+0.206** | **66.7%** | **80.0%** |

---

## 3. Evidence-Aware Support Classification Framework

ResistanceIQ enforces transparent, rule-based support scoring:

| Support Classification | Specific Scientific Criteria | Operational Decision Impact |
| :--- | :--- | :--- |
| **`STRONG_SUPPORT`** | $Tanimoto \ge 0.60$, `KNOWN_SCAFFOLD`, MoA seen in $\ge 3$ studies, `HIGH_COMPARABILITY` assay. | Standard research forecast provided with sharp localized uncertainty bounds. |
| **`MODERATE_SUPPORT`** | $0.40 \le Tanimoto < 0.60$, `RELATED_SCAFFOLD`, MoA seen, standard field assay. | Advisory forecast with "Moderate Historical Chemical Support" tag. |
| **`LIMITED_SUPPORT`** | $0.25 \le Tanimoto < 0.40$, `NOVEL_SCAFFOLD`, or single historical observation. | Advisory point estimate accompanied by widened uncertainty bounds and caution banner. |
| **`OUT_OF_DOMAIN`** | $Tanimoto < 0.25$ or completely unseen MoA/Taxonomic Order. | **Point forecast suppressed.** Diagnostic data gap report returned. |

---

## 4. Multi-Candidate Comparison & Uncertainty Overlap Rule

When comparing candidate molecules $A$ and $B$:
- **Condition for Distinguishability**: $|\hat{y}_A - \hat{y}_B| \ge 0.5 (\hat{w}_A + \hat{w}_B)$.
- **Action when Overlapping**: If intervals overlap strongly, display: **`NOT CLEARLY DISTINGUISHABLE (Substantial Uncertainty Overlap)`**.
- **Explanatory Provenance**: Each candidate profile displays nearest historical chemical neighbors, max Tanimoto similarity, and exact DOI literature citations.

---

## 5. Model Promotion & Governance Decision

- **Active Production Benchmark**: **`v2.0-gbrt-ecfp4` is strictly preserved as the immutable production benchmark in the Model Registry.**
- **Candidate Models**: All v6.0 models remain classified as **`REQUIRES VALIDATION`**.
- **Research Heuristics**: Durability metrics ($Horizon = 25/\sqrt{RR}$) remain strictly labeled as **`RESEARCH HEURISTIC`**.
- **FINAL STATUS**: **`READY FOR USER TESTING`**
