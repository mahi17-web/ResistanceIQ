"""
ResistanceIQ — Step 6 Real Inference Service & API Test Suite
"""

import sys
import os
import time
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.main import app
from ml.inference.loader import ModelLoader
from ml.inference.validator import InputValidator, InferenceRequest
from ml.inference.predictor import ResistancePredictor
from ml.inference.output import PredictionResult

client = TestClient(app)


def test_1_model_loader_and_sha256():
    loader = ModelLoader()
    artifact = loader.load_model("v1.0.0-ridge-ecfp4")
    assert artifact is not None
    assert artifact["model_version"] == "v1.0.0-ridge-ecfp4"
    assert "artifact_sha256" in artifact
    assert len(artifact["artifact_sha256"]) == 64  # Valid SHA-256 hex string

    # Verify cached singleton
    artifact_cached = loader.load_model("v1.0.0-ridge-ecfp4")
    assert artifact is artifact_cached


def test_2_input_validator():
    # Valid SMILES
    valid_payload = {
        "chemical_name": "Imidacloprid",
        "smiles": "C1CN(C(=N1)NC(=O)N)CC2=CN=C(C=C2)Cl",
        "irac_moa_group": "4A",
        "pest_name": "Myzus persicae",
        "pest_order": "Hemiptera",
    }
    req = InputValidator.validate_payload(valid_payload)
    assert req.chemical_name == "Imidacloprid"
    assert req.irac_moa_group == "4A"

    # Invalid SMILES with unbalanced brackets
    with pytest.raises(Exception):
        InputValidator.validate_payload({
            "chemical_name": "BadMolecule",
            "smiles": "C1CN(C(=N1)NC(=O)N",  # Missing closing paren
        })

    # Invalid chemical characters
    with pytest.raises(Exception):
        InputValidator.validate_payload({
            "chemical_name": "BadChars",
            "smiles": "CC1=CC???N",
        })


def test_3_resistance_predictor_execution():
    predictor = ResistancePredictor()
    res: PredictionResult = predictor.predict({
        "chemical_name": "Imidacloprid",
        "smiles": "C1CN(C(=N1)NC(=O)N)CC2=CN=C(C=C2)Cl",
        "irac_moa_group": "4A",
        "pest_name": "Myzus persicae",
        "pest_order": "Hemiptera",
    })

    assert res.status == "COMPLETED"
    assert res.predicted_log10_rr >= 0.0
    assert res.predicted_resistance_ratio >= 1.0
    assert res.estimated_years_to_resistance > 0.0
    assert res.durability_score > 0.0
    assert res.risk_tier in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert res.conformal_interval.rr_lower <= res.predicted_resistance_ratio <= res.conformal_interval.rr_upper
    assert res.domain_applicability.domain_status in ["IN_DOMAIN", "LIMITED_SUPPORT"]


def test_4_out_of_domain_detection():
    predictor = ResistancePredictor()
    # Novel aliphatic chain with unobserved MoA and unobserved pest order
    res: PredictionResult = predictor.predict({
        "chemical_name": "UnknownNovelAliphatic",
        "smiles": "CCCCCCCCCCCCCC",
        "irac_moa_group": "99Z_NOVEL",
        "pest_name": "Alien Organism",
        "pest_order": "NovelTaxonOrder",
    })

    assert res.domain_applicability.domain_status == "OUT_OF_DOMAIN"
    assert res.domain_applicability.confidence_level == "LOW"


def test_5_numerical_reproducibility():
    predictor = ResistancePredictor()
    payload = {
        "chemical_name": "Permethrin",
        "smiles": "CC1(C(C1C(=O)OCC2=CC(=CC=C2)OC3=CC=CC=C3)C=C(Cl)Cl)C",
        "irac_moa_group": "3A",
        "pest_name": "Plutella xylostella",
        "pest_order": "Lepidoptera",
    }
    res1 = predictor.predict(payload)
    res2 = predictor.predict(payload)

    assert res1.predicted_log10_rr == res2.predicted_log10_rr
    assert res1.predicted_resistance_ratio == res2.predicted_resistance_ratio
    assert res1.conformal_interval.rr_lower == res2.conformal_interval.rr_lower
    assert res1.conformal_interval.rr_upper == res2.conformal_interval.rr_upper


def test_6_api_evaluate_endpoint():
    response = client.post(
        "/api/v1/forecasts/evaluate",
        json={
            "chemical_name": "Deltamethrin",
            "smiles": "CC1(C(C1C(=O)OC(C#N)C2=CC(=CC=C2)OC3=CC=CC=C3)C=C(Br)Br)C",
            "irac_moa_group": "3A",
            "pest_name": "Plutella xylostella",
            "pest_order": "Lepidoptera",
            "assay_method": "Leaf-Dip",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert "predicted_log10_rr" in data
    assert "conformal_interval" in data
    assert data["conformal_interval"]["rr_lower"] > 0


def test_7_api_models_endpoint():
    response = client.get("/api/v1/forecasts/models")
    assert response.status_code == 200
    models = response.json()
    assert len(models) >= 1
    assert any(m["version"] == "v1.0.0-ridge-ecfp4" for m in models)


def test_8_inference_latency_benchmark():
    predictor = ResistancePredictor()
    payload = {
        "chemical_name": "Chlorpyrifos",
        "smiles": "CCOP(=S)(OCC)OC1=NC(=C(C=C1Cl)Cl)Cl",
        "irac_moa_group": "1B",
        "pest_name": "Spodoptera frugiperda",
        "pest_order": "Lepidoptera",
    }

    start = time.perf_counter()
    res = predictor.predict(payload)
    latency_ms = (time.perf_counter() - start) * 1000

    assert res.status == "COMPLETED"
    # Latency should be under 50ms for in-memory linear scoring
    assert latency_ms < 50.0
