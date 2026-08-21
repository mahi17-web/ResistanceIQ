"""
ResistanceIQ — FAO Crop Ingestion Service
==========================================
Ingests authoritative crop classifications based on FAO Indicative Crop Classification (ICC) v1.1
and resolves scientific names against NCBI Taxonomy.

Never invents or fabricates crop entries.
"""

import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import Crop
from app.ingestion.ncbi_resolver import NCBITaxonomyResolver

logger = logging.getLogger("resistanceiq.ingestion.fao")


class FAOCropIngestionService:
    """
    Ingestion service for FAO ICC v1.1 crop master catalog.
    """

    def __init__(
        self,
        db: Session,
        reference_data_path: Optional[str] = None,
        ncbi_resolver: Optional[NCBITaxonomyResolver] = None,
    ):
        self.db = db
        if reference_data_path is None:
            self.reference_data_path = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "../../../data/reference/fao_icc_v1.1.json")
            )
        else:
            self.reference_data_path = reference_data_path

        self.ncbi_resolver = ncbi_resolver or NCBITaxonomyResolver()

    def run_ingest(self) -> Dict[str, Any]:
        """
        Executes full or incremental FAO crop ingestion.
        Returns summary report of records added, updated, rejected, and error messages.
        """
        if not os.path.exists(self.reference_data_path):
            raise FileNotFoundError(f"FAO reference dataset not found at {self.reference_data_path}")

        with open(self.reference_data_path, "r", encoding="utf-8") as f:
            raw_crops = json.load(f)

        added = 0
        updated = 0
        rejected = 0
        errors: List[str] = []

        now = datetime.now(timezone.utc)

        for item in raw_crops:
            try:
                crop_id = item.get("id")
                sci_name = item.get("scientific_name", "").strip()
                common_name = item.get("common_name", "").strip()
                crop_code = item.get("crop_code", "").strip()

                if not sci_name or not common_name:
                    rejected += 1
                    errors.append(f"Missing scientific or common name in item: {item}")
                    continue

                # 1. Resolve NCBI Taxonomy if not already provided in record
                if item.get("ncbi_tax_id") and item.get("taxonomy_lineage"):
                    ncbi_tax_id = item.get("ncbi_tax_id")
                    tax_status = item.get("taxonomy_status", "RESOLVED")
                    tax_rank = item.get("taxonomy_rank", "species")
                    tax_lineage = item.get("taxonomy_lineage", [])
                else:
                    tax_info = self.ncbi_resolver.resolve(sci_name)
                    ncbi_tax_id = item.get("ncbi_tax_id") or tax_info.get("ncbi_tax_id")
                    tax_status = item.get("taxonomy_status") or tax_info.get("taxonomy_status", "UNRESOLVED")
                    tax_rank = item.get("taxonomy_rank") or tax_info.get("taxonomy_rank", "species")
                    tax_lineage = item.get("taxonomy_lineage") or tax_info.get("taxonomy_lineage", [])

                # 2. Check if Crop already exists in DB
                existing = self.db.query(Crop).filter(Crop.id == crop_id).first()
                if not existing:
                    existing = self.db.query(Crop).filter(Crop.scientific_name == sci_name).first()

                synonyms_json = json.dumps(item.get("synonyms", []))
                lineage_json = json.dumps(tax_lineage)

                if existing:
                    # Update existing record
                    existing.common_name = common_name
                    existing.scientific_name = sci_name
                    existing.family = item.get("family")
                    existing.genus = item.get("genus")
                    existing.species = item.get("species")
                    existing.crop_code = crop_code
                    existing.ncbi_tax_id = ncbi_tax_id
                    existing.taxonomy_status = tax_status
                    existing.taxonomy_rank = tax_rank
                    existing.taxonomy_lineage = lineage_json
                    existing.synonyms = synonyms_json
                    existing.source = item.get("source", "FAO Indicative Crop Classification (ICC) v1.1")
                    existing.source_version = item.get("source_version", "ICC-1.1-2020")
                    existing.evidence_level = item.get("evidence_level", "OFFICIAL_FAO_CLASSIFICATION")
                    existing.updated_at = now
                    updated += 1
                else:
                    # Insert new Crop record
                    new_crop = Crop(
                        id=crop_id or f"crop_{crop_code}_{sci_name.lower().replace(' ', '_')}",
                        common_name=common_name,
                        scientific_name=sci_name,
                        family=item.get("family"),
                        genus=item.get("genus"),
                        species=item.get("species"),
                        crop_code=crop_code,
                        ncbi_tax_id=ncbi_tax_id,
                        taxonomy_status=tax_status,
                        taxonomy_rank=tax_rank,
                        taxonomy_lineage=lineage_json,
                        synonyms=synonyms_json,
                        source=item.get("source", "FAO Indicative Crop Classification (ICC) v1.1"),
                        source_version=item.get("source_version", "ICC-1.1-2020"),
                        evidence_level=item.get("evidence_level", "OFFICIAL_FAO_CLASSIFICATION"),
                        retrieved_at=now,
                        updated_at=now,
                    )
                    self.db.add(new_crop)
                    added += 1

            except Exception as exc:
                rejected += 1
                errors.append(f"Failed to process crop record {item.get('scientific_name')}: {str(exc)}")

        self.db.commit()

        return {
            "source": "FAO ICC v1.1",
            "records_seen": len(raw_crops),
            "records_added": added,
            "records_updated": updated,
            "records_rejected": rejected,
            "errors": errors,
        }
