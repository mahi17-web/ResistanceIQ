# ResistanceIQ — Production Secrets & Key Management Policy

## 1. Secrets Inventory

| Secret Identifier | Environment Variable | Recommended Store | Rotation Interval |
|---|---|---|---|
| **Database Credentials** | `DATABASE_URL` | AWS Secrets Manager / HashiCorp Vault | 90 Days |
| **JWT Signing Key** | `JWT_SECRET` | Platform Environment Secret (64 hex chars) | 180 Days |
| **Programmatic API Keys** | Generated per tenant | Stored as SHA-256 hash in PostgreSQL | User-managed |

---

## 2. Mandatory Rules

1. **No Hardcoded Secrets**: Never commit `.env` or plain-text credentials to Git.
2. **One-Time Secret Reveal**: Programmatic API keys (`riq_live_...`) are returned in cleartext only once upon creation. Only SHA-256 hashes are stored in the database.
3. **Environment Injection**: Production secrets must be injected at runtime via container orchestrator environment variables (e.g. AWS ECS Task Definition secrets or Kubernetes Secret objects).
