import os
import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models import (
    ResistanceCase,
    CanonicalOrganism,
    CanonicalPesticide,
    DataSource,
    DatasetVersion,
    IngestionRun,
)

router = APIRouter()


@router.get("/search")
def search_resistance_cases(
    organism: Optional[str] = Query(None, description="Search organism name or genus"),
    active_ingredient: Optional[str] = Query(None, description="Search pesticide active ingredient"),
    moa_group: Optional[str] = Query(None, description="IRAC MoA group code e.g. 4A"),
    country: Optional[str] = Query(None, description="Country filter"),
    min_year: Optional[int] = Query(None, description="Minimum resistance year"),
    max_year: Optional[int] = Query(None, description="Maximum resistance year"),
    source_id: Optional[str] = Query(None, description="Source registry ID e.g. APRD"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = (
        db.query(ResistanceCase)
        .join(CanonicalOrganism, ResistanceCase.organism_id == CanonicalOrganism.id)
        .join(CanonicalPesticide, ResistanceCase.pesticide_id == CanonicalPesticide.id)
    )

    if organism:
        query = query.filter(
            (CanonicalOrganism.canonical_name.ilike(f"%{organism}%"))
            | (CanonicalOrganism.common_name.ilike(f"%{organism}%"))
        )
    if active_ingredient:
        query = query.filter(CanonicalPesticide.active_ingredient.ilike(f"%{active_ingredient}%"))
    if moa_group:
        query = query.filter(CanonicalPesticide.irac_moa_group == moa_group)
    if country:
        query = query.filter(ResistanceCase.country.ilike(f"%{country}%"))
    if min_year:
        query = query.filter(ResistanceCase.resistance_year >= min_year)
    if max_year:
        query = query.filter(ResistanceCase.resistance_year <= max_year)
    if source_id:
        query = query.filter(ResistanceCase.source_id == source_id)

    total = query.count()
    cases = query.order_by(ResistanceCase.resistance_year.desc().nullslast()).offset(offset).limit(limit).all()

    results = []
    for c in cases:
        results.append({
            "id": c.id,
            "source_id": c.source_id,
            "source_record_id": c.source_record_id,
            "organism": {
                "id": c.organism.id,
                "canonical_name": c.organism.canonical_name,
                "common_name": c.organism.common_name,
                "ncbi_taxid": c.organism.ncbi_taxid,
            },
            "pesticide": {
                "id": c.pesticide.id,
                "active_ingredient": c.pesticide.active_ingredient,
                "cas_number": c.pesticide.cas_number,
                "irac_moa_group": c.pesticide.irac_moa_group,
                "chemical_class": c.pesticide.chemical_class,
            },
            "resistance_year": c.resistance_year,
            "publication_year": c.publication_year,
            "country": c.country,
            "location": c.location,
            "resistance_type": c.resistance_type,
            "resistance_ratio": c.resistance_ratio,
            "bioassay_method": c.bioassay_method,
            "reference": c.reference,
            "is_duplicate_candidate": c.is_duplicate_candidate,
            "dataset_version_id": c.dataset_version_id,
            "ingestion_run_id": c.ingestion_run_id,
        })

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "cases": results,
    }


@router.get("/filters")
def get_explorer_filters(db: Session = Depends(get_db)):
    organisms = (
        db.query(CanonicalOrganism.canonical_name)
        .distinct()
        .order_by(CanonicalOrganism.canonical_name)
        .all()
    )
    pesticides = (
        db.query(CanonicalPesticide.active_ingredient)
        .distinct()
        .order_by(CanonicalPesticide.active_ingredient)
        .all()
    )
    moa_groups = (
        db.query(CanonicalPesticide.irac_moa_group)
        .filter(CanonicalPesticide.irac_moa_group.isnot(None))
        .distinct()
        .order_by(CanonicalPesticide.irac_moa_group)
        .all()
    )
    countries = (
        db.query(ResistanceCase.country)
        .filter(ResistanceCase.country.isnot(None))
        .distinct()
        .order_by(ResistanceCase.country)
        .all()
    )
    year_bounds = db.query(
        func.min(ResistanceCase.resistance_year),
        func.max(ResistanceCase.resistance_year),
    ).first()

    return {
        "organisms": [o[0] for o in organisms if o[0]],
        "pesticides": [p[0] for p in pesticides if p[0]],
        "moa_groups": [m[0] for m in moa_groups if m[0]],
        "countries": [c[0] for c in countries if c[0]],
        "min_year": year_bounds[0] if year_bounds else None,
        "max_year": year_bounds[1] if year_bounds else None,
    }


@router.get("/provenance/{case_id}")
def get_case_provenance(case_id: str, db: Session = Depends(get_db)):
    case = db.query(ResistanceCase).filter(ResistanceCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Resistance case record not found")

    return {
        "case_id": case.id,
        "source": {
            "source_id": case.source.id,
            "source_name": case.source.name,
            "organization": case.source.organization,
            "source_url": case.source.url,
            "license": case.source.license,
        },
        "source_record_id": case.source_record_id,
        "dataset_version": {
            "version_id": case.dataset_version.id,
            "version_tag": case.dataset_version.version,
            "checksum_sha256": case.dataset_version.checksum,
            "retrieved_at": case.dataset_version.retrieved_at,
        },
        "ingestion_run": {
            "run_id": case.ingestion_run.id,
            "started_at": case.ingestion_run.started_at,
            "completed_at": case.ingestion_run.completed_at,
            "log_location": case.ingestion_run.log_location,
        },
        "original_entity_names": {
            "organism_original_name": case.organism.original_name,
            "pesticide_original_name": case.pesticide.original_name,
        },
        "citation_reference": case.reference,
    }


@router.get("/sources")
def list_data_sources(db: Session = Depends(get_db)):
    sources = db.query(DataSource).all()
    results = []
    for s in sources:
        runs = db.query(IngestionRun).join(DatasetVersion).filter(DatasetVersion.data_source_id == s.id).all()
        results.append({
            "id": s.id,
            "name": s.name,
            "organization": s.organization,
            "url": s.url,
            "license": s.license,
            "access_method": s.access_method,
            "source_type": s.source_type,
            "version_count": len(s.versions),
            "ingestion_runs_count": len(runs),
        })
    return results


@router.get("/quality-report")
def get_quality_report():
    profile_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/metadata/data_profile.json"))
    if os.path.exists(profile_path):
        with open(profile_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"message": "No data profile generated yet. Run ingestion to profile dataset."}
