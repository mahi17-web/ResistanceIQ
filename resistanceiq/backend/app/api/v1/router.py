from fastapi import APIRouter
from app.api.v1 import (
    auth,
    dashboard,
    projects,
    molecules,
    crops,
    targets,
    pests,
    forecasts,
    backtests,
    reports,
    settings_api,
    system,
    explorer,
    admin,
    models_api,
)

api_router = APIRouter()

api_router.include_router(system.router, prefix="/system", tags=["System"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(explorer.router, prefix="/explorer", tags=["Data Explorer"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(crops.router, prefix="/crops", tags=["Crops & Threats"])
api_router.include_router(molecules.router, prefix="/molecules", tags=["Molecules"])
api_router.include_router(targets.router, prefix="/targets", tags=["Targets"])
api_router.include_router(pests.router, prefix="/pests", tags=["Pests"])
api_router.include_router(forecasts.router, prefix="/forecasts", tags=["Forecasts"])
api_router.include_router(models_api.router, prefix="/models", tags=["Model Registry"])
api_router.include_router(backtests.router, prefix="/backtests", tags=["Model Validation"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(settings_api.router, prefix="/settings", tags=["Settings"])
api_router.include_router(admin.router, prefix="/admin", tags=["Operations & Telemetry"])
