# ResistanceIQ — Production Backend Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

# Set working directory
WORKDIR /app

# Install system dependencies (build-essential for C extensions)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt ./backend-requirements.txt
RUN pip install --upgrade pip && pip install -r ./backend-requirements.txt

# Build-time verification: ensure critical runtime dependencies exist in the image
RUN python -c "import matplotlib; import email_validator; from pydantic import EmailStr; print('BUILD VERIFY: matplotlib and pydantic email validation installed successfully (matplotlib=' + matplotlib.__version__ + ')')"

# Copy application source code
COPY backend ./backend
COPY ml ./ml
COPY storage ./storage

# Create non-privileged service user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || curl -f http://localhost:8000/api/v1/system/health || exit 1

EXPOSE 8000

# Start production ASGI server with Uvicorn workers
WORKDIR /app/backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--proxy-headers"]
