# ResistanceIQ — System Architecture

## Overview

**ResistanceIQ** is an enterprise-grade scientific intelligence platform designed to predict, evaluate, and forecast pesticide resistance evolution before field deployment. The system combines molecular docking conformations, deep in-silico mutagenesis scanning, and Wright-Fisher population genetics simulations.

---

## Architectural Principles

1. **Strict Separation of Concerns**: Frontend, Backend, Database, and ML subsystems operate independently with strict interface boundaries.
2. **Scientific Data Provenance**: Every molecule, assay, docking score, and population metric tracks source origin, version, retrieved timestamp, and license.
3. **No Fabricated Machine Learning**: Clear isolation between development seed data and production-trained ML models. Uncalibrated predictions are explicitly prevented from displaying as validated empirical facts.
4. **Resilient Data Layer**: Uses SQLAlchemy ORM with Alembic migrations, designed for PostgreSQL in production and flexible SQLite support during local testing.

---

## System Topology

```
┌─────────────────────────────────────────────────────────────┐
│                    ResistanceIQ Frontend                    │
│   React 18 + TypeScript + Vite + Tailwind CSS + TanStack   │
│            (Spacious Editorial Workstation UI)              │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / REST + Bearer JWT
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend Core                     │
│    App / Routers / Services / Repositories / Pydantic V2    │
└──────────────┬───────────────────────────────┬──────────────┘
               │ SQLAlchemy ORM                │ Inference Bridge
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│     PostgreSQL Database     │ │     ML Pipeline Engine      │
│   (Alembic Migration Ver.)  │ │ (Scikit-Learn / PyTorch)    │
│  Users, Projects, Forecasts │ │ Preprocess · Train · Infer  │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## Directory Organization

- `frontend/`: Single-page application built on React, TypeScript, and Vite.
- `backend/`: FastAPI application containing business logic, repositories, auth, schemas, and Alembic migrations.
- `ml/`: Model registry, feature engineering, dataset validation, and future inference engines.
- `database/`: SQL schemas, migrations, and development seed fixtures.
- `data/`: Raw, processed, external datasets and dataset schema definitions.
- `storage/`: Persisted model weights, exported PDF/CSV reports, and molecular structure files.
- `tests/`: Automated unit, integration, and API test suites.
- `docs/`: Comprehensive technical documentation.
