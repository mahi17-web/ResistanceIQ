# ResistanceIQ — Step 27 Production Email & SMTP Infrastructure Guide

**Subsystem**: ResistanceIQ Transactional Email & Password Recovery Engine  
**Production Transport**: External Authenticated SMTP (STARTTLS / SSL) / Transactional HTTPS API  
**Primary Project Email**: `resistanceiq69@gmail.com`  
**Security Posture**: Fail-Closed Isolation in Production  

---

## 1. Architecture & Email Dispatch Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User as Researcher
    participant UI as Frontend (React)
    participant API as FastAPI Gateway (/api/v1/auth)
    participant DB as PostgreSQL Database
    participant Mail as EmailService
    participant SMTP as SMTP Gateway (smtp.gmail.com)

    User->>UI: Enter registered email for password recovery
    UI->>API: POST /auth/forgot-password {"email": "..."}
    Note over API: Rate limit check (Max 5 req/min per IP/email)
    API->>API: Generate cryptographically random 6-digit OTP
    API->>API: Hash OTP using SHA-256 (code_hash)
    API->>DB: Store PasswordResetCode (code_hash, expires_in=15m, attempts=0)
    API->>Mail: dispatch_password_reset_email(to_email, otp_code)
    
    alt APP_ENV == "production"
        Mail->>SMTP: Connect via STARTTLS (port 587) / SSL (port 465)
        Mail->>SMTP: Authenticate (resistanceiq69@gmail.com, SMTP_PASSWORD)
        Mail->>SMTP: Transmit multipart/alternative (HTML + Plain text)
        SMTP-->>Mail: 250 OK (Accepted for delivery)
        Mail-->>API: Delivery Success (msg_id)
    else APP_ENV == "development" / "test"
        Mail->>DB: If SMTP not provided, save to local dev mailbox
    end

    API-->>UI: 200 OK {"message": "If this email is registered, a code has been sent."}
    Note over UI: Generic anti-enumeration response

    User->>UI: Enter 6-digit OTP code
    UI->>API: POST /auth/verify-reset-code {"email": "...", "code": "..."}
    API->>DB: Query latest active reset code
    Note over API: Verify code_hash matches, not expired, attempts < 5
    API->>API: Generate single-use signed reset_token (JWT, 15m expiry)
    API-->>UI: 200 OK {"reset_token": "..."}

    User->>UI: Submit new password with reset_token
    UI->>API: POST /auth/reset-password {"reset_token": "...", "new_password": "..."}
    API->>DB: Update User hashed_password (Bcrypt/Argon2id), invalidate reset token
    API-->>UI: 200 OK {"message": "Password successfully reset."}
```

---

## 2. Environment Configuration

### Production Settings:
```bash
APP_ENV=production
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=resistanceiq69@gmail.com
SMTP_PASSWORD=your-16-char-gmail-app-password
SMTP_FROM_EMAIL=resistanceiq69@gmail.com
SMTP_FROM_NAME=ResistanceIQ Security
SMTP_USE_TLS=true
```

### Production Security Invariants:
1. **Zero Cleartext Credentials**: `SMTP_PASSWORD` is injected strictly via environment variables; never logged or committed.
2. **Fail-Closed Gate**: If `APP_ENV=production` and SMTP credentials are missing or invalid, email dispatch fails explicitly and dev mailbox storage is rejected.
3. **Anti-Enumeration Protection**: `POST /auth/forgot-password` returns status 200 with identical generic response regardless of whether the email exists in the database.
4. **OTP Brute-Force Rate Limiting**: Max 5 attempts per OTP code before the reset code is permanently invalidated.
5. **Single-Use Authorization**: Reset tokens are cryptographically single-use and expire within 15 minutes.
