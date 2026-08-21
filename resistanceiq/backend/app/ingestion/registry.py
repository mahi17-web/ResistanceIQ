"""
ResistanceIQ — Data Source Registry
"""

from typing import Dict, Any, List
from app.models import DataSource, DatasetVersion
from sqlalchemy.orm import Session


REGISTERED_SOURCES: List[Dict[str, Any]] = [
    {
        "id": "APRD",
        "name": "Arthropod Pesticide Resistance Database",
        "organization": "Michigan State University / USDA NIFA / IRAC",
        "url": "https://www.pesticideresistance.org/",
        "license": "Public Educational / Research Citation",
        "access_method": "PUBLIC_SEARCH_EXPORT",
        "source_type": "RESISTANCE_REGISTRY",
        "description": "Global repository of documented arthropod resistance cases to insecticides, acaricides, and nematicides.",
    },
    {
        "id": "IRAC",
        "name": "IRAC Mode of Action Classification",
        "organization": "Insecticide Resistance Action Committee (CropLife International)",
        "url": "https://irac-online.org/",
        "license": "Open Access with Attribution",
        "access_method": "STRUCTURED_CATALOG",
        "source_type": "TAXONOMY_CLASSIFICATION",
        "description": "Authoritative global classification of insecticide modes of action, target sites, and test methods.",
    },
    {
        "id": "CHEMBL",
        "name": "ChEMBL Bioactivity Database",
        "organization": "European Molecular Biology Laboratory (EMBL-EBI)",
        "url": "https://www.ebi.ac.uk/chembl/",
        "license": "CC BY-SA 3.0",
        "access_method": "REST_API / SQLITE",
        "source_type": "BIOASSAY_BINDING",
        "description": "Curated database of bioactive molecules, binding affinities, and target-site assays.",
    },
    {
        "id": "PUBCHEM",
        "name": "PubChem Compound & BioAssay Database",
        "organization": "National Center for Biotechnology Information (NCBI / NIH)",
        "url": "https://pubchem.ncbi.nlm.nih.gov/",
        "license": "Public Domain (CC0)",
        "access_method": "PUG_REST_API",
        "source_type": "CHEMICAL_ENTITY_REGISTRY",
        "description": "World's largest open collection of chemical structures, SMILES, and CAS synonyms.",
    },
    {
        "id": "UNIPROT",
        "name": "UniProt Knowledgebase (UniProtKB/Swiss-Prot)",
        "organization": "UniProt Consortium",
        "url": "https://www.uniprot.org/",
        "license": "CC BY 4.0",
        "access_method": "REST_API / FASTA",
        "source_type": "PROTEIN_TARGET_PROTEOME",
        "description": "Authoritative protein sequences, active site annotations, and receptor orthologs.",
    },
]


def initialize_data_sources(db: Session) -> None:
    for src in REGISTERED_SOURCES:
        existing = db.query(DataSource).filter(DataSource.id == src["id"]).first()
        if not existing:
            ds = DataSource(**src)
            db.add(ds)
    db.commit()
