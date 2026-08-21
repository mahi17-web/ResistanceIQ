import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from app.ingestion.validators.schema_validator import SchemaValidator
from app.ingestion.normalizers.taxonomy_normalizer import TaxonomyNormalizer
from app.ingestion.normalizers.pesticide_normalizer import PesticideNormalizer
from app.ingestion.deduplicators.deduplicator import Deduplicator


def test_schema_validator_valid():
    valid_record = {
        "source_record_id": "APRD-001",
        "scientific_name": "Plutella xylostella",
        "active_ingredient": "Permethrin",
        "resistance_year": 1985,
        "resistance_ratio": 25.0,
        "country": "United States",
    }
    result = SchemaValidator.validate_resistance_record(valid_record)
    assert result.is_valid is True
    assert len(result.errors) == 0


def test_schema_validator_invalid_rejection():
    # Negative resistance ratio and future year
    invalid_record = {
        "source_record_id": "APRD-ERR",
        "scientific_name": "Myzus persicae",
        "active_ingredient": "Imidacloprid",
        "resistance_year": 2099,
        "resistance_ratio": -4.5,
    }
    result = SchemaValidator.validate_resistance_record(invalid_record)
    assert result.is_valid is False
    codes = [e.error_code for e in result.errors]
    assert "ERR_INVALID_RESISTANCE_YEAR" in codes
    assert "ERR_IMPOSSIBLE_RATIO" in codes


def test_taxonomy_normalization():
    norm = TaxonomyNormalizer.normalize("green peach aphid")
    assert norm["canonical_name"] == "Myzus persicae"
    assert norm["ncbi_taxid"] == 7070
    assert norm["original_name"] == "green peach aphid"


def test_pesticide_normalization():
    norm = PesticideNormalizer.normalize("imidacloprid")
    assert norm["active_ingredient"] == "Imidacloprid"
    assert norm["irac_moa_group"] == "4A"
    assert norm["cas_number"] == "138261-41-3"
    assert norm["original_name"] == "imidacloprid"


def test_deduplicator():
    records = [
        {
            "source": "APRD",
            "source_record_id": "REC-01",
            "canonical_organism": {"canonical_name": "Myzus persicae"},
            "canonical_pesticide": {"active_ingredient": "Imidacloprid"},
            "resistance_year": 2000,
            "country": "Spain",
        },
        {
            "source": "APRD",
            "source_record_id": "REC-01",  # Exact duplicate
            "canonical_organism": {"canonical_name": "Myzus persicae"},
            "canonical_pesticide": {"active_ingredient": "Imidacloprid"},
            "resistance_year": 2000,
            "country": "Spain",
        },
        {
            "source": "APRD",
            "source_record_id": "REC-02",  # Biological candidate duplicate (different source ID, same bio parameters)
            "canonical_organism": {"canonical_name": "Myzus persicae"},
            "canonical_pesticide": {"active_ingredient": "Imidacloprid"},
            "resistance_year": 2000,
            "country": "Spain",
        },
    ]
    res = Deduplicator.process_batch(records)
    assert res.exact_duplicates_count == 1
    assert res.duplicate_candidates_count == 1
    assert len(res.unique_records) == 2
    assert res.unique_records[1]["is_duplicate_candidate"] is True
