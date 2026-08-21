"""
ResistanceIQ — Scientific Data Ingestion Pipeline Orchestrator
"""

import os
import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine, Base
from app.models import (
    DataSource,
    DatasetVersion,
    IngestionRun,
    IngestionStatus,
    CanonicalOrganism,
    CanonicalPesticide,
    ResistanceCase,
    DataQualityRejection,
)
from app.ingestion.registry import initialize_data_sources
from app.ingestion.parsers.aprd_parser import APRDParser
from app.ingestion.parsers.irac_parser import IRACParser
from app.ingestion.validators.schema_validator import SchemaValidator
from app.ingestion.normalizers.taxonomy_normalizer import TaxonomyNormalizer
from app.ingestion.normalizers.pesticide_normalizer import PesticideNormalizer
from app.ingestion.deduplicators.deduplicator import Deduplicator
from app.ingestion.profiler import DataProfiler


class IngestionPipeline:
    """
    Orchestrates the complete RAW -> STAGING -> VALIDATION -> NORMALIZATION -> DEDUPLICATION -> PROCESSED pipeline.
    """

    def __init__(self, db: Optional[Session] = None, data_dir: str = "../data"):
        self.db = db or SessionLocal()
        self.data_dir = data_dir
        self._ensure_directories()

    def _ensure_directories(self):
        for sub in ["raw", "staging", "processed", "rejected", "metadata"]:
            p = os.path.join(self.data_dir, sub)
            os.makedirs(p, exist_ok=True)

    def run_aprd_ingestion(
        self,
        raw_csv_content: str,
        version_tag: str = "2026.1",
        dataset_name: str = "APRD Arthropod Resistance Registry",
    ) -> Dict[str, Any]:
        """
        Executes APRD data ingestion run.
        """
        initialize_data_sources(self.db)

        # 1. Compute checksum
        checksum = hashlib.sha256(raw_csv_content.encode("utf-8")).hexdigest()

        # 2. Register Dataset Version
        version_id = f"APRD-{version_tag}"
        dataset_ver = self.db.query(DatasetVersion).filter(DatasetVersion.id == version_id).first()
        if not dataset_ver:
            dataset_ver = DatasetVersion(
                id=version_id,
                data_source_id="APRD",
                dataset_name=dataset_name,
                version=version_tag,
                checksum=checksum,
                status="ACTIVE",
            )
            self.db.add(dataset_ver)
            self.db.commit()

        # 3. Create Ingestion Run Record
        run = IngestionRun(
            dataset_version_id=dataset_ver.id,
            status=IngestionStatus.RUNNING,
            started_at=datetime.now(timezone.utc),
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)

        # Save Raw File
        raw_path = os.path.join(self.data_dir, "raw", f"aprd_{version_tag}_{run.id[:8]}.csv")
        with open(raw_path, "w", encoding="utf-8") as f:
            f.write(raw_csv_content)

        try:
            # 4. Parse Raw Data -> Staging
            staged_records = [r.to_dict() for r in APRDParser.parse_csv(raw_csv_content)]
            run.records_seen = len(staged_records)

            staging_path = os.path.join(self.data_dir, "staging", f"staged_aprd_{run.id[:8]}.jsonl")
            with open(staging_path, "w", encoding="utf-8") as f:
                for sr in staged_records:
                    f.write(json.dumps(sr) + "\n")

            # 5. Validation Stage
            valid_staged: List[Dict[str, Any]] = []
            rejected_records: List[Dict[str, Any]] = []

            for rec in staged_records:
                res = SchemaValidator.validate_resistance_record(rec)
                if res.is_valid:
                    valid_staged.append(rec)
                else:
                    for err in res.errors:
                        rej = {
                            "ingestion_run_id": run.id,
                            "source_record_id": rec.get("source_record_id"),
                            "raw_payload": rec.get("raw_payload", json.dumps(rec)),
                            "rejection_reason": err.message,
                            "error_code": err.error_code,
                            "stage": "VALIDATION",
                        }
                        rejected_records.append(rej)
                        self.db.add(DataQualityRejection(**rej))

            # Save Rejected File
            rejected_path = os.path.join(self.data_dir, "rejected", f"rejected_aprd_{run.id[:8]}.jsonl")
            with open(rejected_path, "w", encoding="utf-8") as f:
                for rej in rejected_records:
                    f.write(json.dumps(rej) + "\n")

            # 6. Normalization Stage (Taxonomy & Pesticide)
            normalized_records: List[Dict[str, Any]] = []
            for rec in valid_staged:
                norm_org = TaxonomyNormalizer.normalize(
                    raw_scientific=rec.get("scientific_name", ""),
                    raw_common=rec.get("common_name", ""),
                    raw_genus=rec.get("genus", ""),
                    raw_species=rec.get("species", ""),
                )
                norm_pest = PesticideNormalizer.normalize(
                    raw_active=rec.get("active_ingredient", ""),
                    raw_moa=rec.get("mode_of_action", ""),
                )

                rec["canonical_organism"] = norm_org
                rec["canonical_pesticide"] = norm_pest
                normalized_records.append(rec)

            # 7. Deduplication Stage
            dedup_result = Deduplicator.process_batch(normalized_records)
            accepted_records = dedup_result.unique_records

            # Save Processed File
            processed_path = os.path.join(self.data_dir, "processed", f"processed_aprd_{run.id[:8]}.jsonl")
            with open(processed_path, "w", encoding="utf-8") as f:
                for pr in accepted_records:
                    f.write(json.dumps(pr) + "\n")

            # 8. Database Import (Transactional Batch Insertion)
            organism_cache: Dict[str, str] = {}
            pesticide_cache: Dict[str, str] = {}

            # Cache existing
            for org in self.db.query(CanonicalOrganism).all():
                organism_cache[org.canonical_name.lower()] = org.id
            for pest in self.db.query(CanonicalPesticide).all():
                pesticide_cache[pest.active_ingredient.lower()] = pest.id

            for rec in accepted_records:
                org_meta = rec["canonical_organism"]
                org_key = org_meta["canonical_name"].lower()
                if org_key not in organism_cache:
                    new_org = CanonicalOrganism(
                        original_name=org_meta["original_name"],
                        canonical_name=org_meta["canonical_name"],
                        scientific_name=org_meta["scientific_name"],
                        common_name=org_meta["common_name"],
                        genus=org_meta["genus"],
                        species=org_meta["species"],
                        family=org_meta["family"],
                        order=org_meta["order"],
                        ncbi_taxid=org_meta["ncbi_taxid"],
                    )
                    self.db.add(new_org)
                    self.db.flush()
                    organism_cache[org_key] = new_org.id

                pest_meta = rec["canonical_pesticide"]
                pest_key = pest_meta["active_ingredient"].lower()
                if pest_key not in pesticide_cache:
                    new_pest = CanonicalPesticide(
                        original_name=pest_meta["original_name"],
                        active_ingredient=pest_meta["active_ingredient"],
                        cas_number=pest_meta["cas_number"],
                        irac_moa_group=pest_meta["irac_moa_group"],
                        chemical_class=pest_meta["chemical_class"],
                    )
                    self.db.add(new_pest)
                    self.db.flush()
                    pesticide_cache[pest_key] = new_pest.id

                case = ResistanceCase(
                    organism_id=organism_cache[org_key],
                    pesticide_id=pesticide_cache[pest_key],
                    resistance_year=rec.get("resistance_year"),
                    publication_year=rec.get("publication_year"),
                    country=rec.get("country"),
                    location=rec.get("location"),
                    resistance_type=rec.get("resistance_type"),
                    source_id="APRD",
                    source_record_id=rec.get("source_record_id"),
                    reference=rec.get("reference"),
                    bioassay_method=rec.get("bioassay_method"),
                    resistance_ratio=rec.get("resistance_ratio"),
                    susceptible_baseline=rec.get("susceptible_baseline"),
                    is_duplicate_candidate=rec.get("is_duplicate_candidate", False),
                    dataset_version_id=dataset_ver.id,
                    ingestion_run_id=run.id,
                )
                self.db.add(case)

            # 9. Profiling & Reporting
            profile = DataProfiler.generate_profile(
                dataset_name=dataset_name,
                version=version_tag,
                accepted_records=accepted_records,
                rejected_records=rejected_records,
                exact_duplicates=dedup_result.exact_duplicates_count,
                duplicate_candidates=dedup_result.duplicate_candidates_count,
            )

            # Save machine-readable profile & markdown report
            profile_path = os.path.join(self.data_dir, "metadata", "data_profile.json")
            with open(profile_path, "w", encoding="utf-8") as f:
                json.dump(profile, f, indent=2)

            report_md = DataProfiler.format_markdown_report(profile)
            report_path = os.path.join(self.data_dir, "metadata", "quality_report.md")
            with open(report_path, "w", encoding="utf-8") as f:
                f.write(report_md)

            # Update Ingestion Run
            run.status = IngestionStatus.COMPLETED
            run.completed_at = datetime.now(timezone.utc)
            run.records_accepted = len(accepted_records)
            run.records_rejected = len(rejected_records)
            run.error_count = len(rejected_records)
            run.log_location = report_path

            dataset_ver.record_count = len(accepted_records)

            self.db.commit()

            return {
                "status": "COMPLETED",
                "run_id": run.id,
                "version_id": version_id,
                "records_seen": run.records_seen,
                "records_accepted": run.records_accepted,
                "records_rejected": run.records_rejected,
                "duplicate_candidates": dedup_result.duplicate_candidates_count,
                "quality_report_path": report_path,
                "profile": profile,
            }

        except Exception as e:
            self.db.rollback()
            run.status = IngestionStatus.FAILED
            run.completed_at = datetime.now(timezone.utc)
            self.db.commit()
            raise e
        finally:
            if not self.db:
                self.db.close()
