"""
ResistanceIQ — Biological Targets & Protein Structure API Router
================================================================
Fast REST endpoints for querying biological receptors, Swiss-Prot UniProt
records, and macromolecular PDB / AlphaFold structures.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models import Target, ProteinRecord, ProteinStructure, Pest, CropThreat
from app.schemas import TargetRead, ProteinRecordRead, ProteinStructureRead

router = APIRouter()


@router.get("", response_model=List[TargetRead])
def list_targets(
    search: Optional[str] = Query(None, description="Search by target name, gene, or UniProt accession"),
    pest_id: Optional[str] = Query(None, description="Filter targets by pest / organism ID"),
    organism_id: Optional[str] = Query(None, description="Filter targets by organism ID"),
    db: Session = Depends(get_db),
):
    """
    Lists biological targets with fast local search over verified receptors.
    """
    query = db.query(Target)

    target_organism = pest_id or organism_id
    if target_organism:
        # Check if organism corresponds to a Pest species name or ID
        pest = db.query(Pest).filter(or_(Pest.id == target_organism, Pest.species_name == target_organism)).first()
        if pest:
            query = query.filter(
                or_(
                    Target.organism_id == pest.id,
                    Target.organism == pest.species_name,
                    Target.organism == pest.common_name,
                )
            )
        else:
            query = query.filter(
                or_(
                    Target.organism_id == target_organism,
                    Target.organism.ilike(f"%{target_organism}%"),
                )
            )

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Target.name.ilike(term),
                Target.gene_name.ilike(term),
                Target.uniprot_id.ilike(term),
                Target.protein_name.ilike(term),
            )
        )

    return query.order_by(Target.name.asc()).all()


@router.get("/threat/{organism_id}", response_model=List[TargetRead])
def list_targets_for_threat(organism_id: str, db: Session = Depends(get_db)):
    """
    Retrieves validated biological targets specifically linked to a threat organism.
    """
    pest = db.query(Pest).filter(or_(Pest.id == organism_id, Pest.species_name == organism_id)).first()
    if pest:
        targets = db.query(Target).filter(
            or_(
                Target.organism_id == pest.id,
                Target.organism == pest.species_name,
                Target.organism == pest.common_name,
            )
        ).all()
        return targets

    targets = db.query(Target).filter(
        or_(
            Target.organism_id == organism_id,
            Target.organism.ilike(f"%{organism_id}%"),
        )
    ).all()
    return targets


@router.get("/{target_id}", response_model=TargetRead)
def get_target(target_id: str, db: Session = Depends(get_db)):
    """
    Retrieves detailed biological target record with linked protein record and structures.
    """
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target record not found")
    return target


@router.get("/{target_id}/protein", response_model=ProteinRecordRead)
def get_target_protein(target_id: str, db: Session = Depends(get_db)):
    """
    Retrieves the authoritative UniProtKB protein record, complete amino acid sequence,
    and catalytic/active site annotations for the target.
    """
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target record not found")

    prot = db.query(ProteinRecord).filter(
        or_(
            ProteinRecord.target_id == target_id,
            ProteinRecord.uniprot_accession == target.uniprot_id,
        )
    ).first()

    if not prot:
        raise HTTPException(
            status_code=404,
            detail=f"No UniProt protein record found for target '{target.name}' ({target.uniprot_id})",
        )
    return prot


@router.get("/{target_id}/structures", response_model=List[ProteinStructureRead])
def get_target_structures(target_id: str, db: Session = Depends(get_db)):
    """
    Retrieves macromolecular 3D structures prioritized by:
    1. Experimental structures (X-ray, Cryo-EM, NMR)
    2. Validated computed models (AlphaFold DB / ESMFold)
    3. Unavailable marker
    """
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target record not found")

    structures = (
        db.query(ProteinStructure)
        .filter(
            or_(
                ProteinStructure.target_id == target_id,
                ProteinStructure.uniprot_accession == target.uniprot_id,
            )
        )
        .all()
    )

    if not structures:
        # Return structured unavailable representation
        return [
            ProteinStructureRead(
                id=f"str_unavailable_{target.uniprot_id.lower()}",
                target_id=target.id,
                uniprot_accession=target.uniprot_id,
                pdb_id=None,
                chain_id="A",
                structure_type="UNAVAILABLE",
                structure_source="NONE",
                experimental_method=None,
                resolution=None,
                structure_url=None,
            )
        ]

    # Sort: EXPERIMENTAL first, then lowest resolution
    def sort_prio(s: ProteinStructure):
        prio = 1 if s.structure_type == "EXPERIMENTAL" else 2 if s.structure_type == "COMPUTED" else 3
        res = s.resolution or 999.0
        return (prio, res)

    return sorted(structures, key=sort_prio)
