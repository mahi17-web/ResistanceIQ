# ResistanceIQ — Step 26 Security Audit & Vulnerability Assessment

## 1. Executive Summary
This document provides a comprehensive security assessment of the ResistanceIQ platform as part of Step 26 Production Hardening. The audit validates that authentication, role-based access control, cryptographic key management, email dispatch, tenant isolation, and machine learning model integrity meet rigorous enterprise security standards with zero mock fallbacks.

---

## 2. Authentication & Session Security

### 2.1 JWT Verification & Algorithms
- **Algorithm**: `HS256` HMAC-SHA256 signature verification.
- **Production Isolation**: Fail-closed configuration check prevents default placeholder keys in production (`APP_ENV=production`). Minimum key length is enforced at 32 characters.
- **Session Tokens**: Access tokens expire in 480 minutes (8 hours) with refresh token rotation.
- **Token Use Claims**: Access tokens (`token_use: access`) and refresh tokens (`token_use: refresh`) are segregated. Refresh tokens cannot be used to access protected API endpoints.

### 2.2 Password Complexity Policy
- **Minimum Length**: 8 characters.
- **Complexity Requirements**: At least 1 uppercase letter (`[A-Z]`), 1 lowercase letter (`[a-z]`), 1 numerical digit (`[0-9]`), and 1 special symbol (`[!@#$%^&*(),.?":{}|<>]`).
- **Hashing**: Salted bcrypt hashing with industry-standard work factors. Plaintext passwords are never logged, persisted, or echoed.

### 2.3 Role-Based Access Control (RBAC)
- **Roles Defined**: `ADMIN`, `RESEARCHER`, `ANALYST`, `VIEWER`.
- **Enforcement Layer**: FastAPI dependency injection (`require_role([...])`) validates role claims on every protected mutation and administrative resource.
- **Matrix**:
  - `ADMIN`: User management, team invitations, system telemetry, diagnostics, and project creation.
  - `RESEARCHER`: Forecast job creation, molecule ingestion, report generation.
  - `ANALYST`: Candidate screening, exploratory analysis, read-only forecasts.
  - `VIEWER`: Read-only access to existing organization forecasts.

---

## 3. Multi-Tenant Organization Isolation

- **Boundary Enforcement**: Every database query on `projects`, `molecules`, `forecasts`, and `activity_logs` joins against or filters by `organization_id == current_user.organization_id`.
- **Zero Cross-Tenant Leakage**: Attempting to read or mutate resources of another organization results in HTTP `404 Not Found` or `403 Forbidden`.

---

## 4. Anti-Enumeration & Single-Use OTP Protection

- **Forgot Password Workflow**: When an unknown email address is supplied, the system returns a generic HTTP `200` response (`"If an account exists with this email address, password reset instructions have been dispatched."`) to prevent user enumeration attacks.
- **OTP Codes**: Cryptographically secure 6-digit numeric OTPs generated via `secrets.randbelow(1000000)`.
- **Hashing**: OTPs are hashed using SHA-256 before database insertion (`PasswordResetCode.code_hash`). Plaintext OTPs exist only in memory during dispatch.
- **Attempt Throttling**: 5 failed OTP verification attempts lock the reset session immediately.
- **Expiration**: OTP codes expire in 10 minutes.
- **Single-Use Authorization**: Reset tokens issued upon OTP verification are invalidated immediately upon first password reset. Replay attempts return HTTP `400 Bad Request`.

---

## 5. Network & HTTP Security Headers

The following production HTTP security headers are injected globally:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (enforced when `APP_ENV=production`)

---

## 6. Secret Scrubbing & Error Sanitization

- **Production Error Masking**: Unhandled server exceptions return sanitized JSON with `request_id` and generic error descriptions without stack traces or SQL snippets.
- **Diagnostic Safety**: The `/api/v1/diagnostics/email-config` and `/health/ready` endpoints explicitly mask passwords, secrets, and API tokens.
- **Git Security**: `.env`, `.env.*.local`, `*.db`, `storage/dev_emails/`, and test artifacts are strictly excluded via `.gitignore`.
