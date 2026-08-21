import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models import Project, Forecast, BacktestCase, User
from app.schemas import DashboardSummary, ProjectRead, ForecastRead
from app.auth.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        # Total projects
        projects_query = db.query(Project).filter(
            Project.organization_id == current_user.organization_id
        )
        total_projects = projects_query.count()
        active_projects_list = projects_query.order_by(Project.created_at.desc()).limit(10).all()

        # Total forecasts & average durability
        forecasts_query = db.query(Forecast).join(Project).filter(
            Project.organization_id == current_user.organization_id
        )
        total_forecasts = forecasts_query.count()

        avg_durability_val = forecasts_query.with_entities(
            func.avg(Forecast.durability_score)
        ).scalar() or 0.0

        recent_forecasts_list = forecasts_query.order_by(Forecast.created_at.desc()).limit(8).all()

        # Validated historical backtest benchmark count
        validated_cases_count = db.query(BacktestCase).count()

        # Format project reads with computed stats
        formatted_projects = []
        for p in active_projects_list:
            p_fc = db.query(Forecast).filter(Forecast.project_id == p.id).count()
            p_avg = db.query(func.avg(Forecast.durability_score)).filter(Forecast.project_id == p.id).scalar() or 0.0
            p_read = ProjectRead.model_validate(p)
            p_read.forecast_count = p_fc
            p_read.avg_durability = round(float(p_avg), 2)
            formatted_projects.append(p_read)

        return DashboardSummary(
            total_projects=total_projects,
            total_forecasts=total_forecasts,
            avg_durability_score=round(float(avg_durability_val), 2),
            validated_cases_count=validated_cases_count,
            active_projects=formatted_projects,
            recent_forecasts=[ForecastRead.model_validate(f) for f in recent_forecasts_list],
        )
    except Exception as e:
        logger.error(f"Error loading dashboard summary for user {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load dashboard data. Please try again or contact an administrator.",
        )
