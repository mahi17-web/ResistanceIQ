from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models import Project, Forecast, User, UserRole
from app.schemas import ProjectCreate, ProjectRead
from app.auth.dependencies import get_current_user, require_role

router = APIRouter()


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


@router.get("", response_model=List[ProjectRead])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = (
        db.query(Project)
        .filter(Project.organization_id == current_user.organization_id)
        .order_by(Project.created_at.desc())
        .all()
    )
    result = []
    for p in projects:
        fc = db.query(Forecast).filter(Forecast.project_id == p.id).count()
        avg = db.query(func.avg(Forecast.durability_score)).filter(Forecast.project_id == p.id).scalar() or 0.0
        p_read = ProjectRead.model_validate(p)
        p_read.forecast_count = fc
        p_read.avg_durability = round(float(avg), 2)
        result.append(p_read)
    return result


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.RESEARCHER])),
):
    project = Project(
        organization_id=current_user.organization_id,
        name=payload.name,
        description=payload.description,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    p_read = ProjectRead.model_validate(project)
    p_read.forecast_count = 0
    p_read.avg_durability = 0.0
    return p_read


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    fc = db.query(Forecast).filter(Forecast.project_id == project.id).count()
    avg = db.query(func.avg(Forecast.durability_score)).filter(Forecast.project_id == project.id).scalar() or 0.0
    p_read = ProjectRead.model_validate(project)
    p_read.forecast_count = fc
    p_read.avg_durability = round(float(avg), 2)
    return p_read


@router.patch("/{project_id}", response_model=ProjectRead)
@router.put("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.RESEARCHER])),
):
    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    db.commit()
    db.refresh(project)
    fc = db.query(Forecast).filter(Forecast.project_id == project.id).count()
    avg = db.query(func.avg(Forecast.durability_score)).filter(Forecast.project_id == project.id).scalar() or 0.0
    p_read = ProjectRead.model_validate(project)
    p_read.forecast_count = fc
    p_read.avg_durability = round(float(avg), 2)
    return p_read


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    db.delete(project)
    db.commit()
    return None
