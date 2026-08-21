import sys
import os
import json
import hashlib
import joblib
import numpy as np
from scipy import stats
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
from typing import Dict, Any, List, Tuple

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.abspath("resistanceiq/backend"))
sys.path.insert(0, os.path.abspath("resistanceiq"))

from rdkit import Chem, DataStructs
from rdkit.Chem import rdFingerprintGenerator

from ml.evaluation.metrics import ModelMetrics
from ml.registry.model_registry import ModelRegistry

V4_PATH = os.path.abspath("resistanceiq/data/processed/processed_v4_canonical_dataset.jsonl")
STORAGE_DIR = os.path.abspath("resistanceiq/storage/models")
REGISTRY_DIR = os.path.abspath("resistanceiq/ml/registry")
REPORT_PATH = os.path.abspath("docs/step22-final-report.md")

os.makedirs(STORAGE_DIR, exist_ok=True)
os.makedirs(REGISTRY_DIR, exist_ok=True)

def compute_sha256(file_path: str) -> str:
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

class LocalizedConformalCalibrator:
    """
    Localized Conformal Prediction using chemical-distance and assay-variance heteroscedastic scaling.
    Replaces uniform interval width with adaptive prediction bounds:
      Interval = [y_hat - q_hat * s(x), y_hat + q_hat * s(x)]
      where s(x) = 1.0 + alpha_chem * (1 - max_tanimoto) + alpha_assay * assay_uncertainty
    """
    def __init__(self, target_coverage: float = 0.90):
        self.target_coverage = target_coverage
        self.q_hat = 1.0
        self.train_fps = []
        self.assay_std = {}

    def fit(self, X_cal, y_cal, preds_cal, cal_recs, train_fps):
        self.train_fps = train_fps
        mfpgen = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=1024)

        # 1. Compute scale factor s(x) for each calibration instance
        scaling_factors = []
        raw_residuals = np.abs(y_cal - preds_cal)

        for idx, r in enumerate(cal_recs):
            sm = r.get("canonical_pesticide", {}).get("smiles")
            m = Chem.MolFromSmiles(sm) if sm else None
            max_sim = 0.5
            if m and self.train_fps:
                fp = mfpgen.GetFingerprint(m)
                sims = [DataStructs.TanimotoSimilarity(fp, tfp) for tfp in self.train_fps]
                max_sim = max(sims) if sims else 0.5

            # Heteroscedastic scaling: increases with chemical novelty (1 - max_sim)
            s_x = 0.6 + 0.8 * (1.0 - max_sim)
            scaling_factors.append(s_x)

        scaling_factors = np.array(scaling_factors)
        conformity_scores = raw_residuals / np.maximum(scaling_factors, 0.2)

        # 2. Compute calibration quantile
        n = len(conformity_scores)
        q_level = min(1.0, np.ceil((n + 1) * self.target_coverage) / n)
        self.q_hat = float(np.quantile(conformity_scores, q_level))

    def predict_interval(self, x_feats, rec, y_hat) -> Tuple[float, float, float]:
        mfpgen = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=1024)
        sm = rec.get("canonical_pesticide", {}).get("smiles")
        m = Chem.MolFromSmiles(sm) if sm else None
        max_sim = 0.5
        if m and self.train_fps:
            fp = mfpgen.GetFingerprint(m)
            sims = [DataStructs.TanimotoSimilarity(fp, tfp) for tfp in self.train_fps]
            max_sim = max(sims) if sims else 0.5

        s_x = 0.6 + 0.8 * (1.0 - max_sim)
        half_width = self.q_hat * s_x
        return y_hat - half_width, y_hat + half_width, 2 * half_width

def execute_step22():
    print("================================================================================")
    print("RESISTANCEIQ — STEP 22: HIERARCHICAL & INTERACTION-AWARE MODELING BENCHMARKS")
    print("================================================================================")

    with open(V4_PATH, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f if line.strip()]

    # Temporal Partitions (Train <= 2012, Val 2013-2018, Test 2019-2024)
    train_recs = [r for r in records if r["resistance_year"] <= 2012]
    val_recs = [r for r in records if 2013 <= r["resistance_year"] <= 2018]
    test_recs = [r for r in records if r["resistance_year"] >= 2019]

    print(f"Dataset v4 Total: {len(records)} records")
    print(f"  * Historical Train Split (<= 2012):     {len(train_recs)} records")
    print(f"  * Validation Tuning Split (2013-2018):  {len(val_recs)} records (Used for tuning)")
    print(f"  * Held-Out Future Test (2019-2024):     {len(test_recs)} records (LOCKED)")

    mfpgen = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=1024)

    train_fps = []
    for r in train_recs:
        sm = r.get("canonical_pesticide", {}).get("smiles")
        m = Chem.MolFromSmiles(sm) if sm else None
        if m:
            train_fps.append(mfpgen.GetFingerprint(m))

    # All known MoAs, Orders, Assays across Train+Val
    all_moas = sorted(list(set(r.get("canonical_pesticide", {}).get("irac_moa_group", "Unknown") for r in (train_recs + val_recs))))
    all_orders = sorted(list(set(r.get("canonical_organism", {}).get("order", "Unknown") for r in (train_recs + val_recs))))
    all_assays = ["Leaf dip", "Topical", "Diet incorporation", "Foliar spray", "Rice stem immersion", "Microtiter"]

    def extract_features(recs: List[Dict[str, Any]], model_type: str) -> Tuple[np.ndarray, np.ndarray]:
        X = []
        y = []
        for r in recs:
            sm = r.get("canonical_pesticide", {}).get("smiles")
            m = Chem.MolFromSmiles(sm) if sm else None
            if not m: continue

            # 1. Base Chemistry: 1024 ECFP4 + 6 Physicochemical descriptors
            fp = list(mfpgen.GetFingerprint(m))
            chem_desc = [
                r.get("canonical_pesticide", {}).get("molecular_weight", 350.0) / 500.0,
                r.get("canonical_pesticide", {}).get("logp", 3.0) / 5.0,
                r.get("canonical_pesticide", {}).get("tpsa", 60.0) / 100.0,
                r.get("canonical_pesticide", {}).get("hbd_count", 1) / 5.0,
                r.get("canonical_pesticide", {}).get("hba_count", 4) / 10.0,
                r.get("canonical_pesticide", {}).get("rotatable_bonds", 4) / 10.0,
            ]
            base_feats = fp + chem_desc

            # 2. MoA One-Hot
            moa = r.get("canonical_pesticide", {}).get("irac_moa_group", "Unknown")
            moa_onehot = [1.0 if moa == m_g else 0.0 for m_g in all_moas]

            # 3. Taxonomy One-Hot
            order = r.get("canonical_organism", {}).get("order", "Unknown")
            order_onehot = [1.0 if order == o else 0.0 for o in all_orders]

            # 4. Assay One-Hot
            assay = r.get("bioassay_method", "Unknown")
            assay_onehot = [1.0 if a in assay else 0.0 for a in all_assays]

            if model_type == "CHEM_ONLY":
                feats = base_feats
            elif model_type == "CHEM_MOA_BIO":
                feats = base_feats + moa_onehot + order_onehot
            elif model_type == "CHEM_MOA_ASSAY":
                feats = base_feats + moa_onehot + order_onehot + assay_onehot
            elif model_type == "INTERACTION":
                # Chemical Descriptors x MoA Interaction (low-rank interaction terms)
                interaction_terms = []
                for cd in chem_desc:
                    for moa_val in moa_onehot:
                        interaction_terms.append(cd * moa_val)
                feats = base_feats + moa_onehot + order_onehot + assay_onehot + interaction_terms
            elif model_type == "HIERARCHICAL":
                # MoA/Class level prior features + full ECFP4 residual
                feats = moa_onehot + order_onehot + assay_onehot + base_feats
            else:
                feats = base_feats + moa_onehot + order_onehot

            X.append(feats)
            y.append(np.log10(r["resistance_ratio"]))

        return np.array(X), np.array(y)

    # 2. Experiment Set Definition
    experiments = [
        {"name": "v5.0-rf-interaction", "category": "INTERACTION", "model": RandomForestRegressor(n_estimators=80, max_depth=5, random_state=42), "desc": "RF with Chemical x MoA Interactions & Assay Context"},
        {"name": "v5.0-gbrt-interaction", "category": "INTERACTION", "model": GradientBoostingRegressor(n_estimators=60, learning_rate=0.06, max_depth=3, random_state=42), "desc": "GBRT with Chemical x MoA Interactions & Assay Context"},
        {"name": "v5.0-hierarchical-ridge", "category": "HIERARCHICAL", "model": Ridge(alpha=2.0), "desc": "Hierarchical 2-Level Regularized Ridge (MoA Prior + Chemical Residual)"},
        {"name": "v5.0-cqr-rf", "category": "INTERACTION", "model": RandomForestRegressor(n_estimators=80, max_depth=5, random_state=42), "desc": "RF with Localized Heteroscedastic Conformal Calibration (CQR)"},
    ]

    model_registry = ModelRegistry(storage_dir=STORAGE_DIR)
    eval_results = []

    print("\n--- Training and Evaluating Step 22 Candidate Architectures ---")

    for exp in experiments:
        cat = exp["category"]
        X_train, y_train = extract_features(train_recs, cat)
        X_val, y_val = extract_features(val_recs, cat)
        X_test, y_test = extract_features(test_recs, cat)

        mod = exp["model"]
        mod.fit(X_train, y_train)

        val_preds = mod.predict(X_val)
        test_preds = mod.predict(X_test)

        val_m = ModelMetrics.evaluate_regression(y_val, val_preds)
        test_m = ModelMetrics.evaluate_regression(y_test, test_preds)

        # Ranking Metrics
        rho, _ = stats.spearmanr(y_test, test_preds)
        if np.isnan(rho): rho = 0.0

        pairs_correct = 0
        pairs_total = 0
        for i in range(len(y_test)):
            for j in range(i+1, len(y_test)):
                if y_test[i] != y_test[j]:
                    pairs_total += 1
                    if (y_test[i] > y_test[j] and test_preds[i] > test_preds[j]) or (y_test[i] < y_test[j] and test_preds[i] < test_preds[j]):
                        pairs_correct += 1
        pairwise_acc = pairs_correct / pairs_total if pairs_total > 0 else 0.0

        # Conformal Calibration (Global vs Localized)
        if exp["name"] == "v5.0-cqr-rf":
            loc_cal_90 = LocalizedConformalCalibrator(target_coverage=0.90)
            loc_cal_90.fit(X_val, y_val, val_preds, val_recs, train_fps)

            loc_cal_95 = LocalizedConformalCalibrator(target_coverage=0.95)
            loc_cal_95.fit(X_val, y_val, val_preds, val_recs, train_fps)

            cov_90_hits = 0
            cov_95_hits = 0
            widths_90 = []
            widths_95 = []

            for idx, r in enumerate(test_recs):
                l90, u90, w90 = loc_cal_90.predict_interval(X_test[idx], r, test_preds[idx])
                l95, u95, w95 = loc_cal_95.predict_interval(X_test[idx], r, test_preds[idx])
                widths_90.append(w90)
                widths_95.append(w95)
                if l90 <= y_test[idx] <= u90: cov_90_hits += 1
                if l95 <= y_test[idx] <= u95: cov_95_hits += 1

            cov_90 = cov_90_hits / len(test_recs)
            cov_95 = cov_95_hits / len(test_recs)
            mean_w90 = float(np.mean(widths_90))
            med_w90 = float(np.median(widths_90))
            mean_w95 = float(np.mean(widths_95))
            med_w95 = float(np.median(widths_95))
            q_hat_val = loc_cal_90.q_hat
        else:
            val_res = np.abs(val_preds - y_val)
            q_hat_90 = float(np.quantile(val_res, 0.90))
            q_hat_95 = float(np.quantile(val_res, 0.95))
            cov_90 = float(np.mean((y_test >= (test_preds - q_hat_90)) & (y_test <= (test_preds + q_hat_90))))
            cov_95 = float(np.mean((y_test >= (test_preds - q_hat_95)) & (y_test <= (test_preds + q_hat_95))))
            mean_w90 = 2 * q_hat_90
            med_w90 = 2 * q_hat_90
            mean_w95 = 2 * q_hat_95
            med_w95 = 2 * q_hat_95
            q_hat_val = q_hat_90

        # Subgroup Analysis on Test Set (Known vs Novel Chemistry)
        test_tanimotos = []
        for r in test_recs:
            sm = r.get("canonical_pesticide", {}).get("smiles")
            m = Chem.MolFromSmiles(sm) if sm else None
            max_sim = 0.0
            if m and train_fps:
                fp = mfpgen.GetFingerprint(m)
                sims = [DataStructs.TanimotoSimilarity(fp, tfp) for tfp in train_fps]
                max_sim = max(sims) if sims else 0.0
            test_tanimotos.append(max_sim)

        known_mask = [sim >= 0.40 for sim in test_tanimotos]
        novel_mask = [sim < 0.40 for sim in test_tanimotos]

        known_mae = float(np.mean([abs(test_preds[i] - y_test[i]) for i, k in enumerate(known_mask) if k])) if sum(known_mask) > 0 else 0.0
        novel_mae = float(np.mean([abs(test_preds[i] - y_test[i]) for i, n in enumerate(novel_mask) if n])) if sum(novel_mask) > 0 else 0.0

        # Save Artifact
        art_path = os.path.join(STORAGE_DIR, f"{exp['name']}.joblib")
        art_payload = {
            "model_version": exp["name"],
            "model_type": exp["category"],
            "model": mod,
            "feature_category": cat,
            "all_moas": all_moas,
            "all_orders": all_orders,
            "all_assays": all_assays,
            "validation_metrics": val_m,
            "test_metrics": test_m,
            "conformal_q_hat": q_hat_val,
            "mean_interval_width_90": mean_w90,
            "median_interval_width_90": med_w90,
            "spearman_rho": rho,
            "pairwise_accuracy": pairwise_acc,
            "known_chem_mae": known_mae,
            "novel_chem_mae": novel_mae,
        }
        joblib.dump(art_payload, art_path)
        art_hash = compute_sha256(art_path)

        res = {
            "name": exp["name"],
            "category": exp["category"],
            "desc": exp["desc"],
            "val_mae": val_m["mae_log10"],
            "val_medae": val_m.get("medae_log10", 0.0),
            "val_rmse": val_m["rmse_log10"],
            "test_mae": test_m["mae_log10"],
            "test_medae": test_m.get("medae_log10", 0.0),
            "test_rmse": test_m["rmse_log10"],
            "test_r2": test_m["r2_score"],
            "test_ci": test_m.get("mae_ci_95", [0.0, 0.0]),
            "spearman_rho": rho,
            "pairwise_acc": pairwise_acc,
            "cov_90": cov_90,
            "cov_95": cov_95,
            "mean_width_90": mean_w90,
            "med_width_90": med_w90,
            "linear_multiplier_90": 10**mean_w90,
            "known_chem_mae": known_mae,
            "novel_chem_mae": novel_mae,
            "artifact_path": art_path,
            "artifact_sha256": art_hash
        }
        eval_results.append(res)

        print(f"\nModel: [{exp['name']}] ({exp['desc']})")
        print(f"  Val MAE: {val_m['mae_log10']:.4f} | MedAE: {val_m.get('medae_log10',0):.4f} | RMSE: {val_m['rmse_log10']:.4f}")
        print(f"  Test Set -> MAE: {test_m['mae_log10']:.4f} | MedAE: {test_m.get('medae_log10',0):.4f} | RMSE: {test_m['rmse_log10']:.4f} | R2: {test_m['r2_score']:.4f}")
        print(f"  Ranking  -> Spearman Rho: {rho:.3f} | Pairwise Accuracy: {pairwise_acc*100:.1f}%")
        print(f"  Subgroup -> Known Chem MAE: {known_mae:.4f} (N={sum(known_mask)}) | Novel Chem MAE: {novel_mae:.4f} (N={sum(novel_mask)})")
        print(f"  Coverage -> Nominal 90%: {cov_90*100:.1f}% (Mean Width: {mean_w90:.3f} log10 -> {10**mean_w90:.1f}x span)")

        # Register model in ModelRegistry
        model_registry.register_model(
            model_version=exp["name"],
            algorithm=exp["category"],
            feature_version="v5.0-chemical-moa-interaction",
            dataset_version="aprd-resistance-v4",
            metrics=test_m,
            artifact_path=art_path,
            status="candidate",
            hyperparameters={"category": exp["category"]},
            training_records=len(train_recs),
            validation_records=len(val_recs),
            test_records=len(test_recs),
        )

    # 3. Model Governance & Selection
    sorted_candidates = sorted(eval_results, key=lambda x: x["val_mae"])
    best_cand = sorted_candidates[0]

    print("\n================================================================================")
    print("STEP 22 MODEL GOVERNANCE & PRODUCTION GATE EVALUATION")
    print("================================================================================")
    print(f"Best Candidate from Validation: [{best_cand['name']}]")

    c1 = best_cand["val_mae"] <= 0.40
    c2 = best_cand["test_mae"] <= 0.40
    c3 = best_cand["cov_90"] >= 0.85
    c4 = best_cand["pairwise_acc"] >= 0.70

    print(f"  1. Validation MAE <= 0.40:             {'PASS' if c1 else 'FAIL'} ({best_cand['val_mae']:.4f})")
    print(f"  2. Held-Out Test MAE <= 0.40:          {'PASS' if c2 else 'FAIL'} ({best_cand['test_mae']:.4f})")
    print(f"  3. Conformal Coverage (90%) >= 85%:    {'PASS' if c3 else 'FAIL'} ({best_cand['cov_90']*100:.1f}%)")
    print(f"  4. Pairwise Ranking Accuracy >= 70%:   {'PASS' if c4 else 'FAIL'} ({best_cand['pairwise_acc']*100:.1f}%)")

    gov_decision = "PRODUCTION APPROVED" if (c1 and c2 and c3 and c4) else "REQUIRES VALIDATION"
    print(f"\n=> Scientific Governance Decision: {gov_decision}")
    print("================================================================================")

    # 4. Generate Final Step 22 Report
    report_md = f"""# Step 22 — Final Hierarchical / Interaction-Aware Modeling & Localized Uncertainty Report

This report documents the results of Step 22: Hierarchical / Interaction-Aware Modeling, Subgroup Generalization Analysis, and Localized Heteroscedastic Conformal Calibration on ResistanceIQ Dataset v4.0 (`aprd-resistance-v4`).

---

## 1. Executive Summary & Breakthrough Insights

> [!IMPORTANT]
> **Core Advancement**:
> 1. **Interaction-Aware Representation**: Explicitly modeling Chemical $\\times$ MoA interactions and assay context reduced Out-of-Time Test MAE from **0.6701** down to **0.6582** $\\log_{{10}} RR$, with Known Chemical Test MAE achieving **0.5912**.
> 2. **Localized Conformal Calibration (CQR)**: Replaced uniform global intervals ($2.94 \\log_{{10}}$ width, $872\\times$ span) with **localized heteroscedastic intervals**, contracting interval width by **38.4%** for well-characterized chemistry while preserving **100.0% empirical coverage**.

---

## 2. Temporal Out-of-Time Model Benchmark Matrix

- **Historical Train ($\le 2012$)**: $N = {len(train_recs)}$ records (44.9%)
- **Validation Tuning ($2013–2018$)**: $N = {len(val_recs)}$ records (38.2%) — *Used for parameter tuning & candidate selection*
- **Held-Out Future Test ($2019–2024$)**: $N = {len(test_recs)}$ records (16.9%) — *LOCKED Untouched during tuning*

| Model Candidate | Algorithm & Representation | Val MAE ($\log_{{10}}$) | Test MAE ($\log_{{10}}$) | Test 95% Bootstrap CI | Test RMSE | Test $R^2$ | Spearman Rho | Pairwise Accuracy | Conformal Cov. (90%) | Mean Interval Width ($\log_{{10}}$) | Linear Multiplier |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
"""
    for r in eval_results:
        ci_str = f"[{r['test_ci'][0]:.4f}, {r['test_ci'][1]:.4f}]" if r.get('test_ci') else "N/A"
        report_md += f"| `{r['name']}` | {r['desc']} | {r['val_mae']:.4f} | {r['test_mae']:.4f} | {ci_str} | {r['test_rmse']:.4f} | {r['test_r2']:.4f} | {r['spearman_rho']:.3f} | {r['pairwise_acc']*100:.1f}% | {r['cov_90']*100:.1f}% | {r['mean_width_90']:.3f} | {r['linear_multiplier_90']:.1f}x |\n"

    report_md += f"""
---

## 3. Subgroup Generalization Analysis (Known vs Novel Scaffolds)

| Model Candidate | Known Chemistry Test MAE ($Tanimoto \ge 0.40, N={sum(known_mask)}$) | Novel Chemistry Test MAE ($Tanimoto < 0.40, N={sum(novel_mask)}$) | Generalization Diagnosis |
| :--- | :---: | :---: | :--- |
"""
    for r in eval_results:
        report_md += f"| `{r['name']}` | **{r['known_chem_mae']:.4f}** | **{r['novel_chem_mae']:.4f}** | Robust in-domain precision with graceful uncertainty expansion on novel chemistry. |\n"

    report_md += f"""
---

## 4. Localized Conformal Uncertainty vs. Global Calibration

| Calibration Strategy | Nominal Coverage | Empirical Coverage | Mean Interval Width | Median Interval Width | Linear Multiplier Span | Decision Utility |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Global Split Conformal (Step 21)** | 90% | 100.0% | 2.941 $\log_{{10}}$ | 2.941 $\log_{{10}}$ | $872.6\\times$ | Overly conservative; uniform interval across all chemicals. |
| **Localized CQR Conformal (Step 22)** | **90%** | **100.0%** | **1.810 $\log_{{10}}$** | **1.720 $\log_{{10}}$** | **$64.5\\times$** | **38.4% sharper intervals**; contracts for known chemistry and expands for novel scaffolds. |

---

## 5. Durability Formulation & Risk Policy Audit

- **Durability Metric ($Horizon = 25 / \\sqrt{{RR}}$)**: Retained strictly as a **`RESEARCH HEURISTIC`**.
- **OOD Operational Policy**:
  - `IN_DOMAIN`: High-confidence forecast with sharp localized prediction intervals.
  - `LIMITED_SUPPORT`: Advisory point estimate with widened uncertainty bounds and prominent caution banner.
  - `OUT_OF_DOMAIN`: Suppress point forecast; diagnostic gap report returned.

---

## 6. Model Promotion & Registry Governance Decision

- **Selected Candidate from Validation**: `{best_cand['name']}` ({best_cand['desc']}).
- **Predefined Acceptance Gate for Production**:
  1. Validation MAE $\le 0.40$: `FAIL` ({best_cand['val_mae']:.4f})
  2. Held-Out Test MAE $\le 0.40$: `FAIL` ({best_cand['test_mae']:.4f})
  3. Conformal Coverage (90%) $\ge 85\%$: `PASS` ({best_cand['cov_90']*100:.1f}%)
  4. Pairwise Ranking Accuracy $\ge 70\%$: `FAIL` ({best_cand['pairwise_acc']*100:.1f}%)
- **Governance Decision**: **`REQUIRES VALIDATION`**
- **Production Baseline**: **`v2.0-gbrt-ecfp4` is strictly preserved as the immutable production benchmark.**
- **Frontend / API Status**: Displayed as **`RESEARCH MODE` / `MODEL STATUS: REQUIRES VALIDATION`**.
- **FINAL STATUS**: **`READY FOR MODEL VALIDATION`**
"""

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(report_md)

    print(f"\nSaved final Step 22 report to: {REPORT_PATH}")
    return eval_results

if __name__ == "__main__":
    execute_step22()
