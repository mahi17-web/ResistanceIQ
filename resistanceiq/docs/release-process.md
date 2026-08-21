# ResistanceIQ — Production Release & Versioning Process

## 1. Dual Versioning Strategy

To guarantee scientific auditability, ResistanceIQ maintains separate version tracks for application software and machine learning models:

1. **Application Software Version** (e.g. `v0.3.0` $\to$ `v1.0.0`):
   - Covers UI components, FastAPI endpoints, database schemas, and authentication logic.
2. **ML Model Version** (e.g. `v1.0.0-ridge-ecfp4`):
   - Covers trained coefficients, feature pipelines, conformal bounds, and SHA-256 binary checksums.

---

## 2. Standard Release Lifecycle

```text
[ Feature Branch ]
        │
        ▼
[ Pull Request to 'staging' ]
        │
        ▼
[ Automated CI Pipeline (Lint + Full Test Suite) ]
        │
        ▼
[ Staging Deployment & Automated Smoke Tests ]
        │
        ▼
[ Scientific Review & Manual Approval ]
        │
        ▼
[ Production Release & Blue/Green Switch ]
```

---

## 3. Step-by-Step Production Deployment Procedure

1. **Tag Release in Git**:
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0 — Step 9 Production Deployment"
   git push origin v1.0.0
   ```

2. **Execute Database Migrations**:
   ```bash
   docker compose exec backend alembic upgrade head
   ```

3. **Verify Frozen ML Model Artifacts**:
   ```bash
   docker compose exec backend python -c "from ml.inference.loader import ModelLoader; art = ModelLoader().load_model('v1.0.0-ridge-ecfp4'); print('Model SHA-256:', art['artifact_sha256'])"
   ```

4. **Execute Post-Deployment Smoke Verification**:
   ```bash
   docker compose exec backend python -m pytest tests/test_step8_production_qa.py -v
   ```

---

## 4. Rollback Procedure

- **Frontend / Backend**: Roll back Docker image tags to previous stable SHA (`git checkout <PREVIOUS_TAG> && docker compose up -d --build`).
- **Database**: Run `alembic downgrade -1` if migration introduced incompatible schema.
- **ML Model**: Set `DEFAULT_MODEL_VERSION` in environment; historical forecasts remain immutable in PostgreSQL.
