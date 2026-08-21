# ResistanceIQ — Step 26 Email Delivery & Password Reset Security

## 1. Multi-Transport Architecture
The `EmailService` supports three robust, decoupled delivery mechanisms:
1. **Authenticated SMTP (`provider: smtp`)**:
   - **Port 587**: `STARTTLS` with automatic `EHLO` handshake and modern TLS 1.2+ encryption.
   - **Port 465**: Direct SSL encryption with SSLContext verification.
   - Configured and verified via production Gmail SMTP (`resistanceiq69@gmail.com`).
2. **Transactional HTTP API (`provider: transactional`)**:
   - Direct dispatch via SendGrid / Mailgun / AWS SES HTTP APIs when configured with `EMAIL_API_KEY`.
3. **Development Local Mailbox (`provider: dev`)**:
   - Emits structured RFC 822 `.eml` artifacts containing full MIME headers and HTML/text bodies to `storage/dev_emails/`.
   - Used for test environments (`APP_ENV=test`) to isolate automated suites from external network dependencies.

---

## 2. Environment Isolation & Fail-Closed Policy
- In `APP_ENV=production`:
  - `EMAIL_PROVIDER=dev` is strictly rejected during startup with a fatal configuration error.
  - SMTP credentials (`SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`) are strictly required.
  - If SMTP server is unreachable during reset dispatch, the generated OTP code is immediately invalidated and purged from the database, preventing orphaned reset tokens.

---

## 3. Password Reset OTP Security
- **OTP Generation**: 6-digit cryptographically strong numeric code (`secrets.randbelow(1000000)`).
- **In-Database Storage**: OTPs are hashed using SHA-256 (`code_hash = hash_token(otp_code)`). Raw codes are never stored in the database.
- **Brute-Force Lockout**: 5 failed verification attempts invalidate the reset code immediately.
- **Expiration**: Strict 10-minute expiry window.
- **Single-Use Reset Token**: Once verified, an ephemeral reset authorization token is issued. Upon changing the password, the token is marked `used_at = now` and cannot be replayed.
- **Secret Scrubbing**: Raw OTPs and reset tokens are excluded from all logging and API diagnostic responses.
