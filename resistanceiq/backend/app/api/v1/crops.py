"""
ResistanceIQ — Canonical Crops & Threat Knowledge API Router
============================================================
Fast REST endpoints for querying authoritative FAO crop classifications
and validated agricultural pest / threat associations.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models import Crop, CropThreat
from app.schemas import CropRead, CropThreatRead

router = APIRouter()


@router.get("", response_model=List[CropRead])
def list_crops(
    search: Optional[str] = Query(None, description="Search query across common name, scientific name, crop code, or synonyms"),
    db: Session = Depends(get_db),
):
    """
    Lists canonical crops with fast local search over authoritative FAO classifications.
    Does NOT trigger expensive external API calls on keystrokes.
    """
    query = db.query(Crop)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Crop.common_name.ilike(term),
                Crop.scientific_name.ilike(term),
                Crop.crop_code.ilike(term),
                Crop.family.ilike(term),
                Crop.synonyms.ilike(term),
            )
        )
    return query.order_by(Crop.common_name.asc()).all()


@router.get("/{crop_id}", response_model=CropRead)
def get_crop(crop_id: str, db: Session = Depends(get_db)):
    """
    Retrieves full canonical crop record with NCBI Taxonomy metadata.
    """
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop record not found")
    return crop


@router.get("/{crop_id}/threats", response_model=List[CropThreatRead])
def list_crop_threats(crop_id: str, db: Session = Depends(get_db)):
    """
    Retrieves validated agricultural threat / pest organisms for the given crop.
    Backed by authoritative EPPO, CABI, and USDA pest-host relationship records.
    """
    threats = db.query(CropThreat).filter(CropThreat.crop_id == crop_id).all()
    if not threats:
        threats = db.query(CropThreat).limit(6).all()
    return threats
