from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import BacktestCase
from app.schemas import BacktestAccuracySummary, BacktestCaseRead

router = APIRouter()


def build_accuracy_summary(db: Session) -> BacktestAccuracySummary:
    cases = db.query(BacktestCase).order_by(BacktestCase.deployment_year.asc()).all()
    total = len(cases)

    if total == 0:
        return BacktestAccuracySummary(
            total_cases=0,
            mean_absolute_error=0.0,
            within_1yr_pct=0.0,
            within_3yr_pct=0.0,
            within_5yr_pct=0.0,
            model_version="v0.3-mvp",
            cases=[],
        )

    mae = sum(abs(c.error_margin) for c in cases) / total
    w1 = sum(1 for c in cases if abs(c.error_margin) <= 1.0) / total * 100
    w3 = sum(1 for c in cases if abs(c.error_margin) <= 3.0) / total * 100
    w5 = sum(1 for c in cases if abs(c.error_margin) <= 5.0) / total * 100

    return BacktestAccuracySummary(
        total_cases=total,
        mean_absolute_error=round(mae, 2),
        within_1yr_pct=round(w1, 1),
        within_3yr_pct=round(w3, 1),
        within_5yr_pct=round(w5, 1),
        model_version="v0.3-mvp",
        cases=[BacktestCaseRead.model_validate(c) for c in cases],
    )


@router.get("", response_model=BacktestAccuracySummary)
def get_backtest_summary(db: Session = Depends(get_db)):
    return build_accuracy_summary(db)


@router.get("/accuracy", response_model=BacktestAccuracySummary)
def get_backtest_accuracy(db: Session = Depends(get_db)):
    return build_accuracy_summary(db)


@router.get("/cases", response_model=List[BacktestCaseRead])
def get_backtest_cases(db: Session = Depends(get_db)):
    cases = db.query(BacktestCase).order_by(BacktestCase.deployment_year.asc()).all()
    return [BacktestCaseRead.model_validate(c) for c in cases]


@router.get("/cases/{case_id}", response_model=BacktestCaseRead)
def get_backtest_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(BacktestCase).filter(BacktestCase.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Backtest benchmark case not found",
        )
    return BacktestCaseRead.model_validate(case)
