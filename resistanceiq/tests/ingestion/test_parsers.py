import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend")))

from app.ingestion.parsers.aprd_parser import APRDParser
from app.ingestion.parsers.irac_parser import IRACParser


def test_aprd_parser_csv():
    sample_csv = """Record ID,Genus,Species,Common Name,Compound,Class,MoA,Country,State,First Reported,Pub Year,Type,RR,Baseline LC50,Method,Citation
APRD-000001,Myzus,persicae,Green Peach Aphid,Imidacloprid,Neonicotinoid,4A,Spain,Murcia,1998,2000,Field Resistance,14.5,0.03,Leaf-Dip,Nauen et al. 2002
"""
    records = APRDParser.parse_csv(sample_csv)
    assert len(records) == 1
    r = records[0]
    assert r.source_record_id == "APRD-000001"
    assert r.scientific_name == "Myzus persicae"
    assert r.active_ingredient == "Imidacloprid"
    assert r.resistance_year == 1998
    assert r.resistance_ratio == 14.5


def test_irac_parser():
    sample_json = """{
      "moa_groups": [
        {
          "group": "4",
          "subgroup": "4A",
          "target_site": "Nicotinic acetylcholine receptor (nAChR) competitive modulators",
          "chemical_class": "Neonicotinoids",
          "actives": ["Imidacloprid", "Clothianidin", "Thiamethoxam"]
        }
      ]
    }"""
    records = IRACParser.parse_json(sample_json)
    assert len(records) == 1
    assert records[0].irac_group == "4"
    assert records[0].subgroup == "4A"
    assert "Imidacloprid" in records[0].active_ingredients
