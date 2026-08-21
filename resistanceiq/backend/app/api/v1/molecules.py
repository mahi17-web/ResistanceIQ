from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Molecule, User
from app.schemas import (
    MoleculeCreate,
    MoleculeRead,
    ChemicalSearchResponse,
    PubChemCompoundDetail,
    StructureResolveRequest,
    StructureResolveResponse,
)
from app.auth.dependencies import get_current_user
from app.ingestion.pubchem_service import PubChemService

router = APIRouter()


@router.get("/search", response_model=ChemicalSearchResponse)
def search_chemical_compounds(
    query: str = Query(..., min_length=1, description="Chemical name, common name, CID, CAS, or InChIKey"),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """
    Search authoritative chemical database (PubChem PUG REST + local cache)
    by name, common/pesticide name, PubChem CID, CAS number, or InChIKey.
    Handles ambiguous multi-candidate results with structured selection.
    """
    service = PubChemService(db=db)
    try:
        result = service.search_compounds(query, limit=limit)
        return result
    except RuntimeError as re_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(re_err),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chemical resolution error: {str(e)}",
        )


@router.get("/pubchem/{cid}", response_model=PubChemCompoundDetail)
def get_pubchem_compound(
    cid: int,
    db: Session = Depends(get_db),
):
    """
    Retrieve full verified compound record from PubChem by CID,
    including 2D structure SVG, physicochemical properties, and synonyms.
    """
    service = PubChemService(db=db)
    try:
        detail = service.get_compound_by_cid(cid)
        if not detail:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"PubChem compound with CID {cid} not found.",
            )
        return detail
    except RuntimeError as re_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(re_err),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving PubChem record: {str(e)}",
        )


@router.post("/resolve-structure", response_model=StructureResolveResponse)
def resolve_and_standardize_structure(
    payload: StructureResolveRequest,
    db: Session = Depends(get_db),
):
    """
    Validates and standardizes a chemical structure provided as SMILES, InChI,
    MOL block, or SDF text. Checks if known or novel, extracts RDKit descriptors,
    and returns 2D SVG preview.
    """
    service = PubChemService(db=db)
    result = service.resolve_and_validate_structure(
        raw_structure=payload.structure_data,
        input_format=payload.format or "AUTO",
        chemical_name=payload.chemical_name,
    )
    return result


@router.post("/upload", response_model=StructureResolveResponse)
async def upload_structure_file(
    file: UploadFile = File(...),
    chemical_name: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Accepts chemical structure file uploads (.sdf, .mol, .smi, .inchi, .txt),
    parses the contents, validates chemical valence, standardizes structure,
    and extracts physicochemical ML features.
    """
    allowed_extensions = (".sdf", ".mol", ".smi", ".txt", ".inchi")
    filename = file.filename or "uploaded_structure.txt"
    if not any(filename.lower().endswith(ext) for ext in allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension. Allowed formats: {', '.join(allowed_extensions)}",
        )

    try:
        content_bytes = await file.read()
        raw_text = content_bytes.decode("utf-8", errors="replace")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read structure file: {str(e)}",
        )

    service = PubChemService(db=db)
    # Detect format from extension
    fmt = "SDF" if filename.lower().endswith(".sdf") else ("MOL" if filename.lower().endswith(".mol") else "AUTO")
    result = service.resolve_and_validate_structure(
        raw_structure=raw_text,
        input_format=fmt,
        chemical_name=chemical_name or filename.rsplit(".", 1)[0],
    )
    return result


@router.get("", response_model=List[MoleculeRead])
def list_molecules(db: Session = Depends(get_db)):
    return db.query(Molecule).order_by(Molecule.created_at.desc()).all()


@router.get("/{id}", response_model=MoleculeRead)
def get_molecule(id: str, db: Session = Depends(get_db)):
    mol = db.query(Molecule).filter(Molecule.id == id).first()
    if not mol:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Molecule not found")
    return mol


@router.post("", response_model=MoleculeRead, status_code=status.HTTP_201_CREATED)
def create_molecule(
    payload: MoleculeCreate,
    db: Session = Depends(get_db),
):
    if not payload.smiles.strip() and not payload.chemical_name.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Molecule requires either a valid chemical name or SMILES sequence.",
        )

    # Standardize structure if needed
    service = PubChemService(db=db)
    std_res = service.resolve_and_validate_structure(
        raw_structure=payload.smiles,
        input_format="SMILES",
        chemical_name=payload.chemical_name,
    )

    canon_smiles = std_res.get("canonical_smiles") or payload.smiles
    mol_wt = payload.molecular_weight or std_res.get("molecular_weight")
    logp = payload.logp or std_res.get("logp")
    tpsa = payload.tpsa or std_res.get("tpsa")
    hbd = payload.hbd_count or std_res.get("hbd_count")
    hba = payload.hba_count or std_res.get("hba_count")
    rot_bonds = payload.rotatable_bonds or std_res.get("rotatable_bonds")
    formula = payload.molecular_formula or std_res.get("molecular_formula")
    inchikey = payload.inchikey or std_res.get("inchikey")
    inchi = payload.inchi or std_res.get("inchi")
    svg_2d = payload.svg_2d or std_res.get("svg_2d")

    molecule = Molecule(
        chemical_name=payload.chemical_name,
        smiles=canon_smiles,
        pubchem_cid=payload.pubchem_cid or std_res.get("pubchem_cid"),
        iupac_name=payload.iupac_name,
        molecular_formula=formula,
        molecular_weight=mol_wt,
        logp=logp,
        tpsa=tpsa,
        hbd_count=hbd,
        hba_count=hba,
        rotatable_bonds=rot_bonds,
        inchikey=inchikey,
        inchi=inchi,
        is_novel=payload.is_novel if payload.is_novel is not None else std_res.get("is_novel", False),
        standardization_status=payload.standardization_status or "STANDARDIZED",
        resolution_method=payload.resolution_method or "PUBCHEM_NAME_SEARCH",
        source_identifier=payload.source_identifier,
        conformer_3d_available=payload.conformer_3d_available,
        synonyms_json=payload.synonyms_json,
        svg_2d=svg_2d,
        provenance_source=payload.provenance_source or "PUBCHEM",
    )
    db.add(molecule)
    db.commit()
    db.refresh(molecule)
    return molecule
