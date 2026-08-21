"""
ResistanceIQ — Step 5 Comprehensive ML Test Suite & Data Leakage Audit
"""

import sys
import os
import tempfile
import joblib
import numpy as np
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from ml.features.builder import FeaturePipeline
from ml.features.preprocessing import IsolatedStandardScaler
from ml.features.categorical import CategoricalOneHotEncoder
from ml.features.chemistry import ChemistryFeatureExtractor
from ml.features.temporal import TemporalFeatureExtractor
from ml.features.genetics import GeneticFeatureExtractor
from ml.training.dataset import DatasetLoader
from ml.training.baselines import GlobalMeanBaseline, SpeciesMoAGroupMeanBaseline
from ml.training.configuration import TrainingConfig
from ml.training.train import ModelTrainer
from ml.training.evaluate import EvaluationEngine
from ml.evaluation.metrics import ModelMetrics
from ml.evaluation.uncertainty import ConformalIntervalCalibrator
from ml.evaluation.ood_detector import DomainApplicabilityDetector
from ml.registry.model_registry import ModelRegistry
from ml.inference import ResistanceModelService


@pytest.fixture
def sample_records():
    return [
        {
            "pesticide": {"active_ingredient": "Imidacloprid", "smiles": "C1CN(C(=N1)NC(=O)N)CC2=CN=C(C=C2)Cl", "irac_moa_group": "4A"},
            "organism": {"canonical_name": "Myzus persicae", "order": "Hemiptera"},
            "bioassay_method": "Leaf-Dip",
            "resistance_ratio": 14.5,
            "resistance_year": 1998,
        },
        {
            "pesticide": {"active_ingredient": "Permethrin", "smiles": "CC1(C(C1C(=O)OCC2=CC(=CC=C2)OC3=CC=CC=C3)C=C(Cl)Cl)C", "irac_moa_group": "3A"},
            "organism": {"canonical_name": "Plutella xylostella", "order": "Lepidoptera"},
            "bioassay_method": "Leaf-Dip",
            "resistance_ratio": 65.0,
            "resistance_year": 1978,
        },
        {
            "pesticide": {"active_ingredient": "Chlorantraniliprole", "smiles": "CC1=CC(=CC(=C1C(=O)NC2=CC(=CC(=C2C(=O)NC)Cl)C)Cl)N3N=C(C=N3)C4=NC=CC=C4Cl", "irac_moa_group": "28"},
            "organism": {"canonical_name": "Plutella xylostella", "order": "Lepidoptera"},
            "bioassay_method": "Leaf-Dip",
            "resistance_ratio": 84.0,
            "resistance_year": 2011,
        },
    ]


def test_1_feature_generation(sample_records):
    pipeline = FeaturePipeline()
    pipeline.fit(sample_records[:2])
    assert pipeline.is_fitted is True

    X, y = pipeline.transform(sample_records)
    assert X.shape[0] == 3
    assert X.shape[1] > 1030
    assert len(y) == 3
    assert abs(y[0] - float(np.log10(14.5))) < 1e-4


def test_2_preprocessing_scaler():
    train_data = np.array([[10.0, 100.0], [20.0, 200.0], [30.0, 300.0]], dtype=np.float32)
    scaler = IsolatedStandardScaler()
    scaler.fit(train_data)
    
    assert abs(scaler.means[0] - 20.0) < 1e-4
    assert scaler.is_fitted is True

    # Transform test outlier
    test_outlier = np.array([[1000.0, 5000.0]], dtype=np.float32)
    scaled = scaler.transform(test_outlier)
    assert scaled[0, 0] > 0.0
    # Strict isolation check: fit statistics on train remain completely unchanged
    assert abs(scaler.means[0] - 20.0) < 1e-4


def test_3_temporal_split(sample_records):
    train, val, test = DatasetLoader.temporal_split(
        sample_records, train_year_cutoff=2000, val_year_cutoff=2010
    )
    assert len(train) == 2  # 1998, 1978 <= 2000
    assert len(val) == 0
    assert len(test) == 1   # 2011 > 2010


def test_4_baselines(sample_records):
    y_train = np.array([np.log10(14.5), np.log10(65.0)], dtype=np.float32)
    
    global_b = GlobalMeanBaseline()
    global_b.fit(y_train)
    preds_g = global_b.predict(np.zeros((2, 10)))
    assert preds_g.shape == (2,)
    assert abs(preds_g[0] - np.mean(y_train)) < 1e-4

    group_b = SpeciesMoAGroupMeanBaseline()
    group_b.fit(sample_records[:2], y_train)
    preds_grp = group_b.predict(sample_records)
    assert len(preds_grp) == 3


def test_5_model_training_and_evaluation(sample_records):
    with tempfile.TemporaryDirectory() as tmpdir:
        config = TrainingConfig(
            train_year_cutoff=2000,
            val_year_cutoff=2010,
            model_type="RIDGE",
            storage_dir=tmpdir,
        )
        trainer = ModelTrainer(config=config)
        summary = trainer.train_and_evaluate(sample_records)

        assert summary["model_type"] == "RIDGE"
        assert summary["dataset_split"]["train_count"] == 2
        assert summary["dataset_split"]["test_count"] == 1
        assert "global_mean_baseline" in summary["metrics"]
        assert os.path.exists(summary["artifact_path"])


def test_6_evaluation_metrics():
    y_true = np.array([1.0, 2.0, 3.0])
    y_pred = np.array([1.1, 1.9, 3.2])
    m = ModelMetrics.evaluate_regression(y_true, y_pred)
    assert m["mae_log10"] > 0
    assert m["rmse_log10"] > 0
    assert m["spearman_rho"] > 0.9


def test_7_conformal_uncertainty():
    calibrator = ConformalIntervalCalibrator(alpha=0.10)
    y_true = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    y_pred = np.array([1.1, 1.9, 3.1, 3.8, 5.2])
    calibrator.calibrate(y_true, y_pred)

    assert calibrator.is_calibrated is True
    assert calibrator.q_hat > 0.0

    preds, lower, upper = calibrator.predict_intervals(np.array([2.5]))
    assert lower[0] < preds[0] < upper[0]


def test_8_ood_detector(sample_records):
    detector = DomainApplicabilityDetector()
    detector.fit(sample_records)
    assert detector.is_fitted is True

    # In-domain candidate (same MoA 4A and Order Hemiptera)
    res_in = detector.assess_candidate(
        smiles="C1CN(C(=N1)NC(=O)N)CC2=CN=C(C=C2)Cl",
        irac_moa="4A",
        pest_order="Hemiptera",
    )
    assert res_in["domain_status"] in ["IN_DOMAIN", "LOW_SUPPORT"]

    # Out-of-domain candidate (novel MoA and novel Order)
    res_out = detector.assess_candidate(
        smiles="CCCCCCCCC",
        irac_moa="NOVEL_999",
        pest_order="NOVEL_ORDER",
    )
    assert res_out["domain_status"] == "OUT_OF_DOMAIN"


def test_9_serialization_and_registry(sample_records):
    with tempfile.TemporaryDirectory() as tmpdir:
        config = TrainingConfig(storage_dir=tmpdir)
        trainer = ModelTrainer(config=config)
        summary = trainer.train_and_evaluate(sample_records)

        registry = ModelRegistry(storage_dir=tmpdir)
        models = registry.list_models()
        assert len(models) == 1

        loaded = registry.load_model(summary["model_version"])
        assert loaded["model_type"] == "RIDGE"


def test_10_api_inference_service(sample_records):
    with tempfile.TemporaryDirectory() as tmpdir:
        config = TrainingConfig(storage_dir=tmpdir)
        trainer = ModelTrainer(config=config)
        summary = trainer.train_and_evaluate(sample_records)

        service = ResistanceModelService(model_version=summary["model_version"], storage_dir=tmpdir)
        res = service.predict(
            chemical_name="Imidacloprid",
            smiles="C1CN(C(=N1)NC(=O)N)CC2=CN=C(C=C2)Cl",
            irac_moa_group="4A",
            pest_name="Myzus persicae",
            pest_order="Hemiptera",
        )
        assert res["status"] in ["COMPLETED", "SUCCESS"]
        assert "predicted_log10_rr" in res["predictions"]
        assert "conformal_90pct_interval" in res["predictions"]


def test_11_data_leakage_regression_test(sample_records):
    """
    REGRESSION TEST FOR DATA LEAKAGE:
    Ensures that test set labels and feature distributions never leak into training transformers,
    scalers, or encoders.
    """
    train_recs = [sample_records[0]]  # 1998
    test_recs = [sample_records[2]]   # 2011 (has novel MoA 28)

    pipeline = FeaturePipeline()
    pipeline.fit(train_recs)

    # Train vocabulary for MoA must NOT contain '28'
    assert "28" not in pipeline.moa_encoder.vocab_to_idx

    # Transforming test recs must use UNKNOWN bucket for MoA '28'
    X_test, y_test = pipeline.transform(test_recs)
    unknown_col_idx = len(pipeline.moa_encoder.vocabulary)
    moa_offset = 6  # 6 numerical features
    assert X_test[0, moa_offset + unknown_col_idx] == 1.0
