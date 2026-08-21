import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from app.ingestion.pipeline import IngestionPipeline
from app.core.database import SessionLocal, Base, engine


def test_full_pipeline_with_rejections(tmp_path):
    # CSV with 2 valid and 2 invalid records
    test_csv = """Record ID,Genus,Species,Common Name,Compound,Class,MoA,Country,State,First Reported,Pub Year,Type,RR,Baseline LC50,Method,Citation
TEST-01,Myzus,persicae,Green Peach Aphid,Imidacloprid,Neonicotinoid,4A,Spain,Murcia,1998,2000,Field Resistance,14.5,0.03,Leaf-Dip,Citation 1
TEST-02,Plutella,xylostella,Diamondback Moth,Permethrin,Pyrethroid,3A,Taiwan,Changhua,1978,1980,Field Resistance,65.0,0.5,Leaf-Dip,Citation 2
TEST-03,,,,Imidacloprid,Neonicotinoid,4A,United States,California,2005,2007,Field Resistance,10.0,0.1,Leaf-Dip,Citation 3
TEST-04,Tetranychus,urticae,Two-Spotted Spider Mite,Abamectin,Avermectin,6,United States,Florida,2015,2017,Field Resistance,-5.0,0.02,Leaf-Dip,Citation 4
"""
    pipeline = IngestionPipeline(data_dir=str(tmp_path))
    result = pipeline.run_aprd_ingestion(
        raw_csv_content=test_csv,
        version_tag="TEST-1.0",
        dataset_name="Test Ingestion Dataset",
    )

    assert result["status"] == "COMPLETED"
    assert result["records_seen"] == 4
    assert result["records_accepted"] == 2
    assert result["records_rejected"] == 2
    assert os.path.exists(result["quality_report_path"])


def test_explorer_api(client):
    res = client.get("/api/v1/explorer/search")
    assert res.status_code == 200
    data = res.json()
    assert "total" in data
    assert "cases" in data

    filters_res = client.get("/api/v1/explorer/filters")
    assert filters_res.status_code == 200
    fdata = filters_res.json()
    assert "organisms" in fdata
    assert "pesticides" in fdata
    assert "moa_groups" in fdata

    sources_res = client.get("/api/v1/explorer/sources")
    assert sources_res.status_code == 200
    assert len(sources_res.json()) >= 1
