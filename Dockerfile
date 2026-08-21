# ResistanceIQ — Production Backend Dockerfile
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000 \
    APP_ENV=production \
    PYTHONPATH=/app:/app/resistanceiq

# Install system runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user and application directory
RUN groupadd -g 1001 riqgroup && \
    useradd -u 1001 -g riqgroup -s /bin/bash -m riquser

WORKDIR /app

# Copy dependency definition and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Build-time verification: ensure critical runtime dependencies exist in the image
RUN python -c "import matplotlib; import email_validator; from pydantic import EmailStr; print('BUILD VERIFY: matplotlib and pydantic email validation installed successfully (matplotlib=' + matplotlib.__version__ + ')')"

# Copy backend source code, ML packages, data manifests, and locked model artifacts
COPY resistanceiq/ ./resistanceiq/

# Ensure directory permissions for non-root execution
RUN chown -R riquser:riqgroup /app

# Switch to non-root user
USER riquser

# Expose backend API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Launch production ASGI server
CMD ["uvicorn", "resistanceiq.backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
