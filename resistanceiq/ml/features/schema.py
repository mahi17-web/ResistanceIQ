"""
ResistanceIQ — Feature Schema & Definitions
"""

from typing import List, Dict, Any
from dataclasses import dataclass, field


@dataclass
class FeatureDefinition:
    name: str
    feature_type: str  # "numerical", "categorical", "fingerprint"
    dimension: int
    source_entity: str
    description: str
    unit: str = "dimensionless"
    leakage_risk: str = "NONE_PRE_EVENT"


# Canonical feature specification
CANONICAL_FEATURES: List[FeatureDefinition] = [
    # 1. Chemical Structure Features
    FeatureDefinition(
        name="ecfp4_fingerprints",
        feature_type="fingerprint",
        dimension=1024,
        source_entity="Molecule / CanonicalPesticide",
        description="1024-bit Morgan circular fingerprints (radius 2) encoding molecular subgraphs.",
        unit="binary_bit_vector",
    ),
    FeatureDefinition(
        name="molecular_weight",
        feature_type="numerical",
        dimension=1,
        source_entity="Molecule / RDKit",
        description="Calculated molecular mass of active ingredient.",
        unit="g/mol",
    ),
    FeatureDefinition(
        name="logp",
        feature_type="numerical",
        dimension=1,
        source_entity="Molecule / RDKit",
        description="Octanol-water partition coefficient (lipophilicity).",
        unit="log_ratio",
    ),
    FeatureDefinition(
        name="tpsa",
        feature_type="numerical",
        dimension=1,
        source_entity="Molecule / RDKit",
        description="Topological polar surface area.",
        unit="angstroms_squared",
    ),
    FeatureDefinition(
        name="hbd_count",
        feature_type="numerical",
        dimension=1,
        source_entity="Molecule / RDKit",
        description="Hydrogen bond donor count.",
        unit="count",
    ),
    FeatureDefinition(
        name="hba_count",
        feature_type="numerical",
        dimension=1,
        source_entity="Molecule / RDKit",
        description="Hydrogen bond acceptor count.",
        unit="count",
    ),
    # 2. Mode of Action & Target Site Features
    FeatureDefinition(
        name="irac_moa_group",
        feature_type="categorical",
        dimension=1,
        source_entity="CanonicalPesticide / IRAC",
        description="IRAC primary biochemical Mode of Action code (e.g. 1A, 1B, 3A, 4A, 6, 28).",
        unit="category_code",
    ),
    # 3. Pest Demographics & Taxonomy Features
    FeatureDefinition(
        name="pest_order",
        feature_type="categorical",
        dimension=1,
        source_entity="CanonicalOrganism / NCBI",
        description="Taxonomic order of pest species (Hemiptera, Lepidoptera, Diptera, Trombidiformes).",
        unit="taxonomic_rank",
    ),
    FeatureDefinition(
        name="pest_family",
        feature_type="categorical",
        dimension=1,
        source_entity="CanonicalOrganism / NCBI",
        description="Taxonomic family of pest species.",
        unit="taxonomic_rank",
    ),
    # 4. Assay Protocol Context
    FeatureDefinition(
        name="bioassay_method",
        feature_type="categorical",
        dimension=1,
        source_entity="ResistanceCase / APRD",
        description="Experimental bioassay protocol (Topical, Leaf-Dip, Diet-Incorporation).",
        unit="protocol_type",
    ),
]
