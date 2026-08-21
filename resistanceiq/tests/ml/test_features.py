import sys
import os
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from ml.features.chemistry import ChemistryFeatureExtractor
from ml.features.categorical import CategoricalOneHotEncoder
from ml.features.preprocessing import IsolatedStandardScaler
from ml.features.builder import FeaturePipeline


def test_chemistry_extractor():
    desc = ChemistryFeatureExtractor.extract_features("Imidacloprid")
    assert desc["is_valid_structure"] is True
    assert desc["molecular_weight"] > 200.0
    assert len(desc["ecfp4"]) == 1024
    assert np.sum(desc["ecfp4"]) > 0  # At least some bits set


def test_categorical_one_hot_with_unknown():
    enc = CategoricalOneHotEncoder("moa")
    enc.fit(["4A", "1B", "3A"])
    assert enc.is_fitted is True

    # Transform known and unknown
    mat = enc.transform(["4A", "UNKNOWN_NEW_MOA"])
    assert mat.shape == (2, 4)  # 3 known + 1 unknown column
    assert mat[0, enc.vocab_to_idx["4A"]] == 1.0  # Known mapped to index 2 ('4A')
    assert mat[1, 3] == 1.0     # Unknown mapped to last column


def test_isolated_standard_scaler_leakage():
    # Train data: [10, 20, 30] -> Mean = 20, Std = 8.16
    train_data = np.array([[10.0], [20.0], [30.0]])
    test_data = np.array([[100.0]])  # Extreme test outlier

    scaler = IsolatedStandardScaler()
    scaler.fit(train_data)
    assert scaler.means[0] == 20.0

    # Transforming test data must use train mean (20.0), NOT update scaler with 100.0
    scaled_test = scaler.transform(test_data)
    assert scaled_test[0, 0] > 0.0
    assert scaler.means[0] == 20.0  # Training mean remains strictly unchanged


def test_feature_pipeline_builder():
    records = [
        {
            "pesticide": {"active_ingredient": "Imidacloprid", "irac_moa_group": "4A"},
            "organism": {"canonical_name": "Myzus persicae", "order": "Hemiptera"},
            "bioassay_method": "Leaf-Dip",
            "resistance_ratio": 14.5,
            "resistance_year": 1998,
        },
        {
            "pesticide": {"active_ingredient": "Permethrin", "irac_moa_group": "3A"},
            "organism": {"canonical_name": "Plutella xylostella", "order": "Lepidoptera"},
            "bioassay_method": "Leaf-Dip",
            "resistance_ratio": 65.0,
            "resistance_year": 1978,
        },
    ]
    pipeline = FeaturePipeline()
    pipeline.fit(records)
    assert pipeline.is_fitted is True

    X, y = pipeline.transform(records)
    assert X.shape[0] == 2
    assert X.shape[1] > 1000
    assert len(y) == 2
    assert y[0] == float(np.log10(14.5))
