# ResistanceIQ — Development Guide

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (optional for local dev; SQLite fallback is supported)

---

## Quickstart

### 1. Backend Setup

```bash
cd resistanceiq/backend
pip install -r requirements.txt
cp ../.env.example .env

# Run database migrations (or init SQLite)
python -m app.db.init_db

# Seed development data (clearly marked as DEV DATA)
python -m app.db.seed

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

API docs will be live at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd resistanceiq/frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173`.

---

## Running Tests

```bash
# Backend tests
pytest tests/backend/

# Frontend tests
cd frontend && npm test
```
