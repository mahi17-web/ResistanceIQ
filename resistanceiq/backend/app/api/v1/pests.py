from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Pest
from app.schemas import PestRead

router = APIRouter()


@router.get("", response_model=List[PestRead])
def list_pests(db: Session = Depends(get_db)):
    return db.query(Pest).order_by(Pest.common_name.asc()).all()
