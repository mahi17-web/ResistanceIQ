# ResistanceIQ — Step 28 Production Security & Performance Smoke Test

**Environment**: Live Cloud (Render + Vercel + Supabase)  
**Methodology**: Automated API testing against public HTTPS endpoints  

---

## 1. Security & Edge Hardening Smoke Tests

### Test 1: Unauthenticated API Access
```bash
curl -i -X GET "https://<YOUR-RENDER-API>.onrender.com/api/v1/auth/me"
# Expected: HTTP 401 Unauthorized
# Expected Header: WWW-Authenticate: Bearer
# Expected Body: {"error_code":"HTTP_401","message":"Not authenticated"}
```

### Test 2: Cryptographic Model Health & Readiness
```bash
curl -i -X GET "https://<YOUR-RENDER-API>.onrender.com/health/ready"
# Expected: HTTP 200 OK
# Expected Body: {
#   "status": "ready",
#   "database": "ok",
#   "model": "ok",
#   "model_version": "v2.0.0-gbrt-ecfp4",
#   "model_status": "REQUIRES_VALIDATION",
#   "email": "configured"
# }
```

### Test 3: Anti-Enumeration Email Security
```bash
curl -i -X POST "https://<YOUR-RENDER-API>.onrender.com/api/v1/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent_user_random_9876@example.com"}'
# Expected: HTTP 200 OK (Identical generic response to prevent user enumeration)
```

---

## 2. Performance Baseline Targets

| Endpoint | Target Latency | Status Code |
|---|---|---|
| `GET /health` | $< 100\text{ ms}$ | `200 OK` |
| `GET /health/ready` | $< 250\text{ ms}$ | `200 OK` |
| `POST /api/v1/auth/login` | $< 400\text{ ms}$ | `200 OK` |
| `POST /api/v1/forecast/predict` | $< 600\text{ ms}$ | `200 OK` |
| `POST /api/v1/reports/generate` | $< 1200\text{ ms}$ | `200 OK` |
