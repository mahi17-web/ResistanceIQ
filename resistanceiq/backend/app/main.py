import sys
import os
import logging

# Ensure both backend/ and resistanceiq/ are in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
root_dir = os.path.abspath(os.path.join(backend_dir, ".."))
for p in [backend_dir, root_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, status, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.core.telemetry import CorrelationIdMiddleware
from app.api.v1.router import api_router

logger = logging.getLogger("resistanceiq")


def log_safe_email_configuration():
    has_credentials = bool(settings.SMTP_USERNAME and settings.SMTP_PASSWORD) or bool(settings.EMAIL_API_KEY)
    is_provider_configured = bool(settings.SMTP_HOST) or bool(settings.EMAIL_API_KEY)

    logger.info("=" * 60)
    logger.info("RESISTANCEIQ — EMAIL SUBSYSTEM CONFIGURATION")
    logger.info("=" * 60)
    logger.info(f"APP_ENV:                 {settings.APP_ENV}")
    logger.info(f"EMAIL_PROVIDER:          {settings.EMAIL_PROVIDER}")
    logger.info(f"SMTP_HOST:               {settings.SMTP_HOST or 'NOT CONFIGURED'}")
    logger.info(f"SMTP_PORT:               {settings.SMTP_PORT}")
    logger.info(f"SMTP_USE_TLS:            {settings.SMTP_USE_TLS}")
    logger.info(f"SMTP_FROM_EMAIL:         {settings.SMTP_FROM_EMAIL}")
    logger.info(f"SMTP_FROM_NAME:          {settings.SMTP_FROM_NAME}")
    logger.info(f"SMTP credentials config: {'YES' if bool(settings.SMTP_USERNAME and settings.SMTP_PASSWORD) else 'NO'}")
    logger.info(f"Email provider config:   {'YES' if is_provider_configured else 'NO'}")
    logger.info("=" * 60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and ensure seed records are loaded
    from app.db.seed import seed_development_data
    seed_development_data()
    log_safe_email_configuration()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Scientific intelligence platform for pesticide resistance forecasting.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

# ─── 1. Correlation ID & Latency Telemetry Middleware ─────────────────────────
app.add_middleware(CorrelationIdMiddleware)

# ─── 2. Security Headers Middleware ──────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.APP_ENV == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# ─── 3. Global Standardized Exception Handlers ────────────────────────────────
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    req_id = getattr(request.state, "request_id", None) or request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:8]}"
    error_code = (
        getattr(exc, "error_code", None)
        or (exc.headers.get("X-Error-Code") if exc.headers else None)
        or (f"HTTP_{exc.status_code}")
    )
    stage = (
        getattr(exc, "stage", None)
        or (exc.headers.get("X-Stage") if exc.headers else None)
        or "API_EXECUTION"
    )
    retryable = (
        (exc.headers.get("X-Retryable") == "true")
        if exc.headers and "X-Retryable" in exc.headers
        else (exc.status_code in [429, 503, 504])
    )

    headers = dict(exc.headers or {})
    headers["X-Request-ID"] = req_id

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": error_code,
            "stage": stage,
            "request_id": req_id,
            "message": str(exc.detail),
            "detail": exc.detail,
            "retryable": retryable,
        },
        headers=headers,
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", None) or request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:8]}"
    logger.error(f"[{req_id}] Unhandled Exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    if settings.DEBUG:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error_code": "INTERNAL_SERVER_ERROR",
                "stage": "SERVER_EXECUTION",
                "request_id": req_id,
                "message": f"Internal Server Error: {str(exc)}",
                "detail": f"Internal Server Error: {str(exc)}",
                "type": exc.__class__.__name__,
                "retryable": False,
            },
            headers={"X-Request-ID": req_id},
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error_code": "INTERNAL_SERVER_ERROR",
            "stage": "SERVER_EXECUTION",
            "request_id": req_id,
            "message": "An internal server error occurred. Please contact support.",
            "detail": "An internal server error occurred. Please contact support.",
            "retryable": False,
        },
        headers={"X-Request-ID": req_id},
    )


# ─── 4. Configure CORS for Frontend ──────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ─── 5. Include v1 API Router ────────────────────────────────────────────────
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": "v2.0.0",
        "api": settings.API_V1_STR,
        "status": "ONLINE",
        "governance_status": "REQUIRES_VALIDATION",
    }


@app.get("/health")
def health():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": "v2.0.0",
        "environment": settings.APP_ENV,
        "governance_status": "REQUIRES_VALIDATION",
    }


@app.get("/health/ready")
def health_ready(response: Response, db = Depends(get_db)):
    from app.api.v1.system import readiness_check
    return readiness_check(response=response, db=db)

