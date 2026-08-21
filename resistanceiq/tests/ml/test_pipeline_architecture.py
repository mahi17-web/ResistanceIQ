import sys
import os

# Put ml root on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../ml")))

from data.validation import ScientificDatasetValidator
from preprocessing.smiles_cleaner import clean_smiles, compute_basic_descriptors
from registry.model_card import ModelCard, ResistanceInferencePipeline


def test_smiles_cleaning():
    valid_smiles = "CC1=CC(=O)N(C1=O)C2=CC=C(C=C2)OC3=NC=C(C=C3)C(F)(F)F"
    assert clean_smiles(valid_smiles) == valid_smiles

    # Unbalanced brackets should be rejected
    assert clean_smiles("CC1=CC(=O)N(C1=O") is None


def test_dataset_validator():
    valid_meta = {
        "dataset_name": "APRD_Empirical_Field_Cases",
        "source_organization": "Michigan State University / IRAC",
        "provenance_url": "https://www.pesticideresistance.org",
        "version": "2026.1",
        "retrieved_at_utc": "2026-08-18T12:00:00Z",
        "license": "CC-BY-4.0",
    }
    assert ScientificDatasetValidator.validate_metadata(valid_meta) is True


def test_model_card_and_pipeline():
    card = ModelCard(
        version="v0.3-mvp",
        architecture="RidgeBaseline + WrightFisher",
        training_dataset_provenance="APRD-2026.1",
        training_date_utc="2026-08-18",
        target_protein_coverage=["AChE1", "GluCl", "VGSC", "RyR"],
        pest_species_coverage=["Myzus persicae", "Tetranychus urticae", "Plutella xylostella"],
        is_production_ready=False,
    )
    pipeline = ResistanceInferencePipeline(card)
    result = pipeline.predict_durability("CC1=CC(=O)N(C1=O)", "Q9BMJ1", 10)
    assert result["status"] == "COMPLETED"
    assert result["is_calibrated"] is False
