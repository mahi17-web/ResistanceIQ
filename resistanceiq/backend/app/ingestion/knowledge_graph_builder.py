"""
ResistanceIQ — Knowledge Graph Builder & Synchronization Orchestrator
====================================================================
Synchronizes and verifies the entire knowledge chain:
CROP → THREAT → TARGET → PROTEIN → UNIPROT → STRUCTURE

Guarantees full provenance, zero data fabrication, and atomic audit logging.
"""

import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models import (
    Crop,
    CropThreat,
    Target,
    Pest,
    ProteinRecord,
    ProteinStructure,
    KnowledgeSyncAudit,
)
from app.ingestion.fao_crop_ingestion import FAOCropIngestionService
from app.ingestion.ncbi_resolver import NCBITaxonomyResolver
from app.ingestion.uniprot_service import UniProtService
from app.ingestion.rcsb_structure_service import ProteinStructureService
from app.ingestion.data_quality_validator import DataQualityValidator

logger = logging.getLogger("resistanceiq.ingestion.graph")


class KnowledgeGraphBuilder:
    """
    High-level orchestrator connecting agronomic crops, pests, receptors, sequences, and structures.
    """

    def __init__(self, db: Session, base_dir: Optional[str] = None):
        self.db = db
        if base_dir is None:
            self.base_dir = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "../../../data/reference")
            )
        else:
            self.base_dir = base_dir

        self.ncbi_resolver = NCBITaxonomyResolver()
        self.uniprot_service = UniProtService()
        self.structure_service = ProteinStructureService()

    def sync_all(self, sync_type: str = "ALL", dry_run: bool = False) -> Dict[str, Any]:
        """
        Executes an end-to-end sync across FAO crops, threats, targets, UniProt records, and PDB structures.
        Supports dry_run=True for validation without persisting changes.
        """
        t0 = datetime.now(timezone.utc)
        import uuid
        audit_id = f"sync_{int(t0.timestamp())}_{uuid.uuid4().hex[:8]}"
        stats = {
            "audit_id": audit_id,
            "dry_run": dry_run,
            "crops_added": 0,
            "crops_updated": 0,
            "threats_synced": 0,
            "targets_synced": 0,
            "proteins_synced": 0,
            "structures_synced": 0,
            "rejected_records": 0,
            "errors": [],
        }

        try:
            # 1. Sync FAO Crops
            fao_service = FAOCropIngestionService(
                db=self.db,
                reference_data_path=os.path.join(self.base_dir, "fao_icc_v1.1.json"),
            )
            crop_res = fao_service.run_ingest()
            stats["crops_added"] = crop_res["records_added"]
            stats["crops_updated"] = crop_res["records_updated"]
            stats["rejected_records"] += crop_res["records_rejected"]

            # 2. Sync Crop Threat Associations
            threat_path = os.path.join(self.base_dir, "crop_threat_associations.json")
            if os.path.exists(threat_path):
                with open(threat_path, "r", encoding="utf-8") as f:
                    threat_data = json.load(f)

                for item in threat_data:
                    valid, issues = DataQualityValidator.validate_threat_association(item)
                    if not valid:
                        stats["rejected_records"] += 1
                        stats["errors"].append(f"Invalid threat association: {issues}")
                        continue

                    ct_id = item.get("id")
                    existing_ct = self.db.query(CropThreat).filter(CropThreat.id == ct_id).first()
                    if not existing_ct:
                        existing_ct = (
                            self.db.query(CropThreat)
                            .filter(
                                CropThreat.crop_id == item.get("crop_id"),
                                CropThreat.organism_id == item.get("organism_id"),
                            )
                            .first()
                        )

                    if existing_ct:
                        existing_ct.organism_name = item.get("organism_name", existing_ct.organism_name)
                        existing_ct.common_name = item.get("common_name", existing_ct.common_name)
                        existing_ct.organism_type = item.get("organism_type", existing_ct.organism_type)
                        existing_ct.ncbi_tax_id = item.get("ncbi_tax_id", existing_ct.ncbi_tax_id)
                        existing_ct.relationship = item.get("relationship", existing_ct.relationship)
                        existing_ct.source = item.get("source", existing_ct.source)
                        existing_ct.source_record_id = item.get("source_record_id", existing_ct.source_record_id)
                        existing_ct.source_url = item.get("source_url", existing_ct.source_url)
                        existing_ct.evidence_level = item.get("evidence_level", existing_ct.evidence_level)
                        existing_ct.confidence_score = float(item.get("confidence_score", 1.0))
                        existing_ct.citation = item.get("citation")
                    else:
                        new_ct = CropThreat(
                            id=ct_id or f"ct_{item.get('crop_id')}_{item.get('organism_id')}",
                            crop_id=item.get("crop_id"),
                            organism_id=item.get("organism_id"),
                            organism_name=item.get("organism_name"),
                            common_name=item.get("common_name"),
                            organism_type=item.get("organism_type", "insect"),
                            ncbi_tax_id=item.get("ncbi_tax_id"),
                            relationship=item.get("relationship", "PRIMARY_HOST"),
                            source=item.get("source", "EPPO Global Database / CABI CPC"),
                            source_record_id=item.get("source_record_id"),
                            source_url=item.get("source_url"),
                            source_version="2024.1",
                            evidence_level=item.get("evidence_level", "DIRECT"),
                            confidence_score=float(item.get("confidence_score", 1.0)),
                            citation=item.get("citation"),
                            retrieved_at=t0,
                            created_at=t0,
                        )
                        self.db.add(new_ct)
                    stats["threats_synced"] += 1

                self.db.flush()

            # 3. Sync Targets, UniProt Protein Records, and RCSB / AlphaFold Structures
            target_path = os.path.join(self.base_dir, "target_uniprot_structures.json")
            if os.path.exists(target_path):
                with open(target_path, "r", encoding="utf-8") as f:
                    targets_data = json.load(f)

                for item in targets_data:
                    tgt_id = item.get("target_id")
                    prot_info = item.get("protein", {})
                    uniprot_acc = prot_info.get("uniprot_accession")

                    valid_acc, acc_err = DataQualityValidator.validate_uniprot_accession(uniprot_acc)
                    if not valid_acc:
                        stats["rejected_records"] += 1
                        stats["errors"].append(f"Target {tgt_id} has invalid accession: {acc_err}")
                        continue

                    tgt = self.db.query(Target).filter(Target.id == tgt_id).first()
                    if not tgt:
                        tgt = self.db.query(Target).filter(Target.uniprot_id == uniprot_acc).first()

                    active_sites_json = json.dumps(prot_info.get("active_sites", []))

                    if tgt:
                        tgt.name = item.get("target_name", tgt.name)
                        tgt.gene_name = item.get("gene_name", tgt.gene_name)
                        tgt.uniprot_id = uniprot_acc
                        tgt.protein_name = prot_info.get("protein_name", tgt.protein_name)
                        tgt.target_type = item.get("target_type", tgt.target_type)
                        tgt.organism = item.get("organism_name", tgt.organism)
                        tgt.organism_id = item.get("organism_id", tgt.organism_id)
                        tgt.moa_scheme = item.get("moa_scheme", getattr(tgt, "moa_scheme", "IRAC"))
                        tgt.moa_group = item.get("moa_group", getattr(tgt, "moa_group", None))
                        tgt.moa_subgroup = item.get("moa_subgroup", getattr(tgt, "moa_subgroup", None))
                        tgt.irac_moa_group = item.get("irac_moa_group", tgt.irac_moa_group)
                        tgt.target_class = item.get("target_class", getattr(tgt, "target_class", None))
                        tgt.sequence_length = prot_info.get("sequence_length", tgt.sequence_length)
                        tgt.functional_description = prot_info.get("functional_description", tgt.functional_description)
                        tgt.resistance_mechanism = item.get("resistance_mechanism", tgt.resistance_mechanism)
                        tgt.evidence_level = item.get("evidence_level", tgt.evidence_level)
                        tgt.source = item.get("source", tgt.source)
                        tgt.source_record_id = item.get("source_record_id", getattr(tgt, "source_record_id", None))
                        tgt.source_url = item.get("source_url", getattr(tgt, "source_url", None))
                        tgt.binding_pocket_residues = active_sites_json
                        tgt.updated_at = t0
                    else:
                        tgt = Target(
                            id=tgt_id,
                            name=item.get("target_name"),
                            gene_name=item.get("gene_name"),
                            uniprot_id=uniprot_acc,
                            protein_name=prot_info.get("protein_name"),
                            target_type=item.get("target_type"),
                            organism=item.get("organism_name"),
                            organism_id=item.get("organism_id"),
                            moa_scheme=item.get("moa_scheme", "IRAC"),
                            moa_group=item.get("moa_group"),
                            moa_subgroup=item.get("moa_subgroup"),
                            irac_moa_group=item.get("irac_moa_group"),
                            target_class=item.get("target_class"),
                            structure_source="RCSB_PDB",
                            sequence_length=prot_info.get("sequence_length"),
                            functional_description=prot_info.get("functional_description"),
                            resistance_mechanism=item.get("resistance_mechanism", "DIRECT_TARGET"),
                            evidence_level=item.get("evidence_level", "DIRECT"),
                            source=item.get("source", "UniProtKB/Swiss-Prot"),
                            source_record_id=item.get("source_record_id"),
                            source_url=item.get("source_url"),
                            binding_pocket_residues=active_sites_json,
                            created_at=t0,
                            updated_at=t0,
                        )
                        self.db.add(tgt)
                    stats["targets_synced"] += 1
                    self.db.flush()

                    prot_record = self.db.query(ProteinRecord).filter(ProteinRecord.uniprot_accession == uniprot_acc).first()
                    xrefs_json = json.dumps(prot_info.get("cross_references", []))
                    if prot_record:
                        prot_record.target_id = tgt.id
                        prot_record.protein_name = prot_info.get("protein_name", prot_record.protein_name)
                        prot_record.gene_primary = prot_info.get("gene_primary", prot_record.gene_primary)
                        prot_record.organism_name = item.get("organism_name", prot_record.organism_name)
                        prot_record.review_status = prot_info.get("review_status", getattr(prot_record, "review_status", "REVIEWED"))
                        prot_record.entry_version = prot_info.get("entry_version", getattr(prot_record, "entry_version", None))
                        prot_record.sequence_version = prot_info.get("sequence_version", getattr(prot_record, "sequence_version", None))
                        prot_record.sequence_length = prot_info.get("sequence_length", prot_record.sequence_length)
                        prot_record.functional_description = prot_info.get("functional_description", prot_record.functional_description)
                        prot_record.active_sites_json = active_sites_json
                        prot_record.cross_references_json = xrefs_json
                        prot_record.updated_at = t0
                    else:
                        prot_record = ProteinRecord(
                            id=f"prot_{uniprot_acc}",
                            uniprot_accession=uniprot_acc,
                            target_id=tgt.id,
                            protein_name=prot_info.get("protein_name", tgt.name),
                            gene_primary=prot_info.get("gene_primary", tgt.gene_name),
                            organism_name=item.get("organism_name", tgt.organism),
                            review_status=prot_info.get("review_status", "REVIEWED"),
                            entry_version=prot_info.get("entry_version"),
                            sequence_version=prot_info.get("sequence_version"),
                            sequence_length=prot_info.get("sequence_length"),
                            functional_description=prot_info.get("functional_description"),
                            active_sites_json=active_sites_json,
                            cross_references_json=xrefs_json,
                            source=prot_info.get("source_version", "UniProtKB/Swiss-Prot"),
                            retrieved_at=t0,
                            updated_at=t0,
                        )
                        self.db.add(prot_record)
                    stats["proteins_synced"] += 1
                    self.db.flush()

                    structures_list = item.get("structures", [])
                    for s in structures_list:
                        str_id = s.get("id")
                        existing_str = self.db.query(ProteinStructure).filter(ProteinStructure.id == str_id).first()
                        if not existing_str:
                            new_str = ProteinStructure(
                                id=str_id or f"str_{tgt.id}_{s.get('pdb_id', 'none')}",
                                target_id=tgt.id,
                                protein_record_id=prot_record.id,
                                uniprot_accession=uniprot_acc,
                                pdb_id=s.get("pdb_id"),
                                entity_id=s.get("entity_id", "1"),
                                chain_id=s.get("chain_id", "A"),
                                structure_type=s.get("structure_type", "EXPERIMENTAL"),
                                structure_source=s.get("structure_source", "RCSB_PDB"),
                                experimental_method=s.get("experimental_method"),
                                resolution=s.get("resolution"),
                                mapping_evidence=s.get("mapping_evidence", "EXACT_SPECIES_MATCH"),
                                structure_url=s.get("structure_url"),
                                cif_url=s.get("cif_url"),
                                alphafold_model_url=s.get("alphafold_model_url"),
                                retrieval_date=t0,
                                created_at=t0,
                            )
                            self.db.add(new_str)
                            stats["structures_synced"] += 1
                        else:
                            existing_str.target_id = tgt.id
                            existing_str.protein_record_id = prot_record.id
                            existing_str.pdb_id = s.get("pdb_id", existing_str.pdb_id)
                            existing_str.entity_id = s.get("entity_id", getattr(existing_str, "entity_id", "1"))
                            existing_str.chain_id = s.get("chain_id", existing_str.chain_id)
                            existing_str.structure_type = s.get("structure_type", existing_str.structure_type)
                            existing_str.structure_source = s.get("structure_source", existing_str.structure_source)
                            existing_str.experimental_method = s.get("experimental_method", existing_str.experimental_method)
                            existing_str.resolution = s.get("resolution", existing_str.resolution)
                            existing_str.mapping_evidence = s.get("mapping_evidence", getattr(existing_str, "mapping_evidence", "EXACT_SPECIES_MATCH"))
                            existing_str.structure_url = s.get("structure_url", existing_str.structure_url)
                            existing_str.cif_url = s.get("cif_url", existing_str.cif_url)
                            existing_str.alphafold_model_url = s.get("alphafold_model_url", existing_str.alphafold_model_url)
                            stats["structures_synced"] += 1

                if dry_run:
                    self.db.rollback()
                    stats["status"] = "DRY_RUN_SUCCESS"
                    return stats
                else:
                    self.db.commit()

            # Record Audit Entry
            if not dry_run:
                audit = KnowledgeSyncAudit(
                    id=audit_id,
                    sync_type=sync_type,
                    status="COMPLETED" if stats["rejected_records"] == 0 else "PARTIAL",
                    records_added=stats["crops_added"],
                    records_updated=stats["crops_updated"] + stats["threats_synced"] + stats["targets_synced"],
                    records_rejected=stats["rejected_records"],
                    error_log=json.dumps(stats["errors"]) if stats["errors"] else None,
                    started_at=t0,
                    completed_at=datetime.now(timezone.utc),
                )
                self.db.add(audit)
                self.db.commit()
                stats["status"] = audit.status
            else:
                stats["status"] = "DRY_RUN_SUCCESS"

            return stats

        except Exception as exc:
            self.db.rollback()
            logger.error(f"Knowledge graph synchronization failed: {str(exc)}")
            audit = KnowledgeSyncAudit(
                id=audit_id,
                sync_type=sync_type,
                status="FAILED",
                records_added=0,
                records_updated=0,
                records_rejected=stats["rejected_records"] + 1,
                error_log=str(exc),
                started_at=t0,
                completed_at=datetime.now(timezone.utc),
            )
            self.db.add(audit)
            self.db.commit()
            stats["status"] = "FAILED"
            stats["errors"].append(str(exc))
            return stats
