# ResistanceIQ — Production Configuration Reference

## 1. Environment Variables Reference

| Variable | Type | Default (Dev) | Production Requirement | Description |
|---|---|---|---|---|
| `APP_ENV` | String | `development` | `production` | Enables strict authentication, HTTPS headers, and disables dev endpoints. |
| `DEBUG` | Boolean | `true` | `false` | Disables verbose exception traces and Swagger in public routes. |
| `DATABASE_URL` | String | SQLite local | PostgreSQL DSN | Connection string: `postgresql://user:pass@host:5432/dbname`. |
| `JWT_SECRET` | String | Dev placeholder | High-entropy 64-char hex | Symmetric secret used to sign session access tokens. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Integer | `480` | `480` (8 hours) | Token lifespan before requiring re-authentication. |
| `BACKEND_CORS_ORIGINS` | JSON Array | `["http://localhost:5173"]` | Strict domain list | Explicit list of trusted frontend origins. |
| `MODEL_REGISTRY_PATH` | String | `../storage/models` | `/opt/resistanceiq/models` | Absolute directory path containing frozen joblib model artifacts. |
| `ALLOW_DEV_SEEDING` | Boolean | `true` | `false` | Disables automated test fixture injection. |
| `ALLOW_DEV_FALLBACK_AUTH` | Boolean | `true` | `false` | Enforces mandatory HTTP Bearer tokens on all protected routes. |
| `RATE_LIMIT_PER_MINUTE` | Integer | `1000` | `120` | Maximum requests per minute per IP address. |

---

## 2. Infrastructure Hardening Checklist
- Run FastAPI behind a production ASGI server (e.g. `uvicorn` with `gunicorn` process manager, 4+ worker processes).
- Place behind an SSL-terminating reverse proxy (Nginx or AWS ALB / Cloudflare).
- Enable PostgreSQL connection pooling (e.g. PgBouncer) with SSL mode `require` or `verify-full`.
