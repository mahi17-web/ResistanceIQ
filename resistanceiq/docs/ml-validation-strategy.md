# ResistanceIQ — ML Validation & Splitting Strategy

## 1. The Core Scientific Challenge: Preventing Generalization Illusion

In pesticide resistance forecasting, naive random cross-validation ($k$-fold) produces **catastrophic optimistic bias**. Randomly partitioning bioassay rows causes the same active ingredient, the same field population, or identical chemical scaffolds to appear in both training and test sets.

**ResistanceIQ mandates rigorous, biologically realistic validation splits.**

---

## 2. Multi-Dimensional Validation Splitting Protocols

```
                               ┌────────────────────────────────────────┐
                               │     ResistanceIQ Splitting Matrix      │
                               └──────────────────┬─────────────────────┘
                                                  │
         ┌────────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                        ▼                                      ▼
┌──────────────────┐                    ┌──────────────────┐                   ┌──────────────────┐
│ A. Temporal Cut  │                    │ B. Bemis-Murcko  │                   │ C. Target / Pest │
│ (Time-Forward)   │                    │ Scaffold Split   │                   │ Group Holdout    │
│ Train: <=2015    │                    │ Train: Scaffolds │                   │ Train: Group 1-3 │
│ Test:  2016-2025 │                    │ Test:  Novel     │                   │ Test:  Group 4A  │
└──────────────────┘                    └──────────────────┘                   └──────────────────┘
```

---

### Protocol A: Temporal Cut (Time-Forward Out-of-Time Validation)
* **Design**: Simulates real-world deployment where a model trained on historical data forecasts future field outcomes.
* **Partitioning**:
  - **Training Set**: Historical bioassays & registrations from $\le 2012$ ($70\%$ of temporal span).
  - **Validation Set**: Field monitoring observations from $2013 - 2018$ ($15\%$).
  - **Holdout Test Set**: Modern field monitoring observations from $2019 - 2025$ ($15\%$).
* **Evaluation Purpose**: Evaluates model performance against evolving agricultural practices, newly registered chemistries, and shifting baseline resistance dynamics.

---

### Protocol B: Bemis-Murcko Scaffold Disjoint Split (Out-of-Distribution Chemistry)
* **Design**: Evaluates the model's ability to generalize to **novel chemical scaffolds** during early discovery.
* **Partitioning**:
  - Group all chemical active ingredients by their Bemis-Murcko core scaffold.
  - Ensure $100\%$ of compounds with a given scaffold are allocated entirely to either Train or Test, never shared across folds.
* **Evaluation Purpose**: Confirms that molecular predictions reflect genuine target interaction and reactivity rather than memorization of known commercial chemical series.

---

### Protocol C: Leave-One-Species-Out / Leave-One-MoA-Out Grouped Cross-Validation
* **Design**: Tests generalization to unobserved pests or novel Mode of Action classes.
* **Partitioning**:
  - Grouped $K$-fold cross-validation grouped on `IRAC_MoA_Group` or `Pest_Family`.
* **Evaluation Purpose**: Verifies the platform does not overfit to over-represented species (e.g. *Myzus persicae*, *Helicoverpa armigera*).

---

## 3. Evaluation Metrics by Task

### 3.1 Continuous Resistance Ratio Regression ($\log_{10}(RR)$)

$$\text{MAE} = \frac{1}{N} \sum_{i=1}^N \left| y_i - \hat{y}_i \right|$$

$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N (y_i - \hat{y}_i)^2}$$

$$\text{Spearman's } \rho = 1 - \frac{6 \sum d_i^2}{N(N^2 - 1)}$$

* **Primary Metric**: **MAE on $\log_{10}(RR)$** (An MAE of $0.30$ means predictions are accurate within a factor of $10^{0.30} \approx 2.0\times$ the actual field resistance ratio).
* **Secondary Metric**: **Spearman Rank Correlation ($\rho$)** (Validates whether relative ranking between discovery candidates is preserved).

---

### 3.2 Categorical Resistance Risk Tiering (Ordinal)

* **Primary Metric**: **Ordinal Weighted Cohen's Kappa ($\kappa$)** (Penalizes classifying a High-Risk compound as Susceptible much more severely than classifying it as Moderate).
* **Secondary Metric**: **Macro-averaged One-vs-Rest ROC-AUC** and **Expected Calibration Error (ECE)**.

---

## 4. Uncertainty Quantification (UQ)

ResistanceIQ will never present a single deterministic point estimate without an explicit confidence interval.

### Implemented UQ Methods:
1. **Conformal Prediction**: Generates distribution-free, mathematically guaranteed prediction intervals:
   $$y \in [\hat{y} - q_{1-\alpha}, \hat{y} + q_{1-\alpha}] \quad \text{with } P \ge 90\%$$
2. **Quantile Regression GBDT**: Trains LightGBM with quantile pinball loss to output the 10th percentile, 50th percentile (median), and 90th percentile predictions.
3. **Application Domain / Out-of-Distribution Warning**: Computes Tanimoto similarity to the training set; flags candidates with max Tanimoto $< 0.40$ as **OUT_OF_DOMAIN** in the UI.
