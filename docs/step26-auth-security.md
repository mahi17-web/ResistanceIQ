# ResistanceIQ — Step 26 Authentication & RBAC Security Specification

## 1. Authentication Lifecycle

### 1.1 User Registration (`POST /api/v1/auth/register`)
- Registers organization and initial primary administrator.
- Enforces password complexity, email uniqueness, and auto-provisions a default workspace project.
- Returns access token, refresh token, and sanitized `UserRead` model.

### 1.2 User Authentication (`POST /api/v1/auth/login`)
- Verifies credentials using constant-time bcrypt verification.
- Updates `last_login_at` timestamp.
- Rejects deactivated (`is_active=False`) accounts with HTTP `403 Forbidden`.
- Returns access token (`exp=480m`) and refresh token (`exp=30d`).

### 1.3 Token Refresh (`POST /api/v1/auth/refresh`)
- Accepts refresh token, validates signature, ensures user account is active, and issues a new access token.
- Refresh tokens cannot be used as Bearer tokens on resource endpoints.

### 1.4 Admin User Invitation (`POST /api/v1/auth/invite`)
- Restricted to users with `ADMIN` role.
- Generates cryptographically secure invitation token (`expires_at = now + 7 days`).
- Creates user account with initial temporary password and `email_verified=False`.

### 1.5 Accept Invitation (`POST /api/v1/auth/accept-invite`)
- Verifies invitation token validity and expiration.
- Validates password complexity policy.
- Sets personal password, marks `is_active=True` and `email_verified=True`, and clears invitation token.

---

## 2. RBAC Enforcement Matrix

| Endpoint | Method | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth/invite` | POST | ADMIN | Invite new organization member |
| `/api/v1/settings/team` | GET | ADMIN, RESEARCHER, ANALYST | List team members |
| `/api/v1/settings/users/{id}/role` | PATCH | ADMIN | Update user role |
| `/api/v1/projects` | POST | ADMIN, RESEARCHER | Create research project |
| `/api/v1/molecules` | POST | ADMIN, RESEARCHER | Ingest candidate molecule |
| `/api/v1/forecasts` | POST | ADMIN, RESEARCHER, ANALYST | Execute durability forecast |
| `/api/v1/forecasts/{id}` | GET | ADMIN, RESEARCHER, ANALYST, VIEWER | Read forecast record |
| `/api/v1/admin/operational-status` | GET | ADMIN | System telemetry and diagnostics |
