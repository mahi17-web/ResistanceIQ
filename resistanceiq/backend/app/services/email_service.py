"""
ResistanceIQ — Production Transactional Email Service
=====================================================
Handles transactional password reset and verification emails with strict
environment isolation, multi-transport SMTP (STARTTLS / SSL), standard
RFC 822 .eml development mailbox storage, detailed structured diagnostics,
and production fail-closed security.
"""

import os
import re
import ssl
import json
import uuid
import email
import socket
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from app.core.config import settings

logger = logging.getLogger("resistanceiq.email")


# ─── Standard Error Codes ───────────────────────────────────────────────────
class EmailServiceException(Exception):
    def __init__(self, code: str, message: str, request_id: str = ""):
        super().__init__(f"[{code}] {message}")
        self.code = code
        self.message = message
        self.request_id = request_id


class EmailConfigurationError(EmailServiceException):
    def __init__(self, message: str, request_id: str = ""):
        super().__init__("EMAIL_PROVIDER_NOT_CONFIGURED", message, request_id)


class EmailDeliveryError(EmailServiceException):
    def __init__(self, code: str, message: str, request_id: str = ""):
        super().__init__(code, message, request_id)


class EmailService:
    def __init__(self):
        self.app_env = settings.APP_ENV.lower()
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME
        self.use_tls = settings.SMTP_USE_TLS
        
        # Primary and secondary dev mailbox storage directories
        self.dev_inbox_dir = os.path.abspath(settings.DEV_EMAIL_INBOX_DIR)
        
        # In-memory store for instantaneous test assertions
        self._dev_memory_inbox: List[Dict[str, Any]] = []

        if self.app_env in ["development", "test"]:
            self._ensure_dev_mailbox_directories()

    def _ensure_dev_mailbox_directories(self):
        """Ensures all dev email directories exist and are writable."""
        for p in [self.dev_inbox_dir, os.path.abspath("./storage/dev_emails"), os.path.abspath("./resistanceiq/storage/dev_emails")]:
            try:
                os.makedirs(p, exist_ok=True)
            except Exception as e:
                logger.warning(f"Could not create dev email directory {p}: {e}")

    def _extract_domain(self, email_address: str) -> str:
        """Extracts domain for safe non-sensitive diagnostic logging."""
        if "@" in email_address:
            return email_address.split("@", 1)[1].lower()
        return "unknown"

    def _log_diagnostic(self, event_name: str, payload: Dict[str, Any]):
        """Logs structured non-sensitive email diagnostic events."""
        log_entry = {
            "event": event_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **payload,
        }
        logger.info(f"DIAGNOSTIC {json.dumps(log_entry)}")

    def get_runtime_configuration(self) -> Dict[str, Any]:
        """
        Returns safe, non-sensitive runtime configuration parameters.
        NEVER returns passwords, tokens, or API keys.
        """
        return {
            "app_env": self.app_env,
            "email_provider": settings.EMAIL_PROVIDER,
            "smtp_host": self.smtp_host if self.smtp_host else "NOT CONFIGURED",
            "smtp_port": self.smtp_port,
            "smtp_use_tls": self.use_tls,
            "smtp_from_email": self.from_email,
            "smtp_from_name": self.from_name,
            "has_smtp_credentials": bool(self.smtp_user and self.smtp_password),
            "dev_mailbox_enabled": self.app_env in ["development", "test"],
        }

    def check_sender_domain_authentication(self) -> Dict[str, Any]:
        """
        Inspects DNS records for SPF, DKIM, and DMARC on the configured sender domain.
        Returns non-sensitive deliverability status flags.
        """
        import socket
        import subprocess
        sender_domain = self._extract_domain(self.from_email)
        res = {
            "domain": sender_domain,
            "dns_resolvable": False,
            "spf_found": False,
            "dkim_found": False,
            "dmarc_found": False,
            "status": "UNVERIFIED",
            "details": [],
        }

        try:
            # Check domain DNS resolution
            socket.gethostbyname(sender_domain)
            res["dns_resolvable"] = True
            res["details"].append(f"Domain '{sender_domain}' resolves via DNS.")
        except Exception as e:
            res["details"].append(f"Domain '{sender_domain}' DNS resolution failed: {e}")
            return res

        # 1. Check TXT records for SPF
        try:
            txt_output = subprocess.check_output(
                ["nslookup", "-type=TXT", sender_domain],
                stderr=subprocess.STDOUT,
                text=True,
                timeout=4,
            )
            if "v=spf1" in txt_output.lower():
                res["spf_found"] = True
                res["details"].append("SPF record detected.")
        except Exception:
            pass

        # 2. Check DMARC record (_dmarc.<domain>)
        try:
            dmarc_output = subprocess.check_output(
                ["nslookup", "-type=TXT", f"_dmarc.{sender_domain}"],
                stderr=subprocess.STDOUT,
                text=True,
                timeout=4,
            )
            if "v=dmarc1" in dmarc_output.lower():
                res["dmarc_found"] = True
                res["details"].append("DMARC record detected.")
        except Exception:
            pass

        # 3. Check DKIM selectors (common selectors)
        dkim_selectors = ["resend", "s1", "k1", "smtp", "google", "default", "mail"]
        for sel in dkim_selectors:
            try:
                dkim_output = subprocess.check_output(
                    ["nslookup", "-type=TXT", f"{sel}._domainkey.{sender_domain}"],
                    stderr=subprocess.STDOUT,
                    text=True,
                    timeout=3,
                )
                if "v=dkim1" in dkim_output.lower() or "k=rsa" in dkim_output.lower() or "p=" in dkim_output:
                    res["dkim_found"] = True
                    res["details"].append(f"DKIM record detected for selector '{sel}'.")
                    break
            except Exception:
                continue

        if res["spf_found"] and res["dmarc_found"]:
            res["status"] = "AUTHENTICATED"
        elif res["spf_found"] or res["dmarc_found"] or res["dkim_found"]:
            res["status"] = "PARTIALLY_AUTHENTICATED"
        else:
            res["status"] = "SENDER_DOMAIN_NOT_VERIFIED"

        return res

    def verify_smtp_connectivity(self, test_recipient: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes a controlled SMTP connectivity, TLS negotiation, authentication,
        and sender verification test from the runtime environment.
        Never exposes passwords or secret keys.
        """
        import socket

        diag = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "app_env": self.app_env,
            "smtp_host": self.smtp_host,
            "smtp_port": self.smtp_port,
            "dns_resolution": "FAIL",
            "tcp_connection": "FAIL",
            "tls_negotiation": "FAIL",
            "smtp_authentication": "FAIL",
            "sender_acceptance": "FAIL",
            "message_accepted": "FAIL",
            "provider_response": "",
            "message_id": "",
            "error_code": None,
            "safe_error_message": None,
        }

        if not self.smtp_host:
            diag["error_code"] = "EMAIL_PROVIDER_NOT_CONFIGURED"
            diag["safe_error_message"] = "SMTP_HOST is not configured in the active environment."
            return diag

        # 1. DNS Resolution
        try:
            resolved_ips = socket.getaddrinfo(self.smtp_host, self.smtp_port, proto=socket.IPPROTO_TCP)
            diag["dns_resolution"] = "PASS"
            self._log_diagnostic("SMTP_DNS_RESOLVED", {
                "host": self.smtp_host,
                "ip_count": len(resolved_ips),
            })
        except Exception as dns_err:
            diag["error_code"] = "DNS_FAILURE"
            diag["safe_error_message"] = f"DNS resolution failed for host '{self.smtp_host}': {dns_err}"
            return diag

        # 2. TCP & TLS Connection
        server = None
        try:
            ssl_context = ssl.create_default_context()
            if self.smtp_port == 465:
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=12, context=ssl_context)
                diag["tcp_connection"] = "PASS"
                diag["tls_negotiation"] = "PASS"
            else:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=12)
                diag["tcp_connection"] = "PASS"
                if self.use_tls:
                    server.ehlo()
                    server.starttls(context=ssl_context)
                    server.ehlo()
                    diag["tls_negotiation"] = "PASS"
                else:
                    diag["tls_negotiation"] = "NOT_REQUESTED"

            self._log_diagnostic("SMTP_CONNECTION_SUCCESS", {
                "host": self.smtp_host,
                "port": self.smtp_port,
                "tls": diag["tls_negotiation"],
            })

            # 3. SMTP Authentication
            if self.smtp_user and self.smtp_password:
                server.login(self.smtp_user, self.smtp_password)
                diag["smtp_authentication"] = "PASS"
                self._log_diagnostic("SMTP_AUTH_SUCCESS", {
                    "username_domain": self._extract_domain(self.smtp_user),
                })
            else:
                diag["smtp_authentication"] = "SKIPPED_NO_CREDENTIALS"

            # 4. Sender Acceptance Test
            recipient = test_recipient or self.from_email
            test_msg = MIMEMultipart("alternative")
            test_msg["Subject"] = "ResistanceIQ SMTP Delivery Test"
            test_msg["From"] = f"{self.from_name} <{self.from_email}>"
            test_msg["To"] = recipient
            test_msg["Date"] = formatdate(localtime=False, usegmt=True)
            msg_id = make_msgid(domain="resistanceiq.bio")
            test_msg["Message-ID"] = msg_id
            test_msg.attach(MIMEText("This is a real email delivery test from ResistanceIQ.", "plain", "utf-8"))

            diag["message_id"] = msg_id

            # Verify sender via mail() and recipient via rcpt()
            code_mail, resp_mail = server.mail(self.from_email)
            if code_mail in [250, 251, 252]:
                diag["sender_acceptance"] = "PASS"
            else:
                diag["sender_acceptance"] = "FAIL"
                diag["error_code"] = "SENDER_REJECTED"
                diag["safe_error_message"] = f"Sender '{self.from_email}' rejected: {resp_mail}"
                server.quit()
                return diag

            code_rcpt, resp_rcpt = server.rcpt(recipient)
            if code_rcpt not in [250, 251, 252]:
                diag["error_code"] = "PROVIDER_REJECTED"
                diag["safe_error_message"] = f"Recipient '{recipient}' rejected: {resp_rcpt}"
                server.quit()
                return diag

            # Send data
            code_data, resp_data = server.data(test_msg.as_string())
            if code_data in [250, 251]:
                diag["message_accepted"] = "PASS"
                decoded_resp = resp_data.decode("utf-8", errors="ignore") if isinstance(resp_data, bytes) else str(resp_data)
                diag["provider_response"] = f"{code_data} {decoded_resp}"
                # If provider returns a message ID in the data response, capture it
                if decoded_resp and len(decoded_resp.strip()) > 3:
                    diag["message_id"] = decoded_resp.strip()
                self._log_diagnostic("SMTP_MESSAGE_ACCEPTED", {
                    "message_id": diag["message_id"],
                    "provider_response": diag["provider_response"],
                })
            else:
                diag["message_accepted"] = "FAIL"
                diag["error_code"] = "PROVIDER_REJECTED"
                diag["provider_response"] = f"Status {code_data}: {resp_data}"

            server.quit()

        except smtplib.SMTPAuthenticationError as auth_err:
            diag["error_code"] = "AUTHENTICATION_FAILURE"
            diag["safe_error_message"] = "SMTP Authentication failed. Verify SMTP_USERNAME and SMTP_PASSWORD."
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {"error_code": "AUTHENTICATION_FAILURE"})
        except smtplib.SMTPSenderRefused as sender_err:
            diag["error_code"] = "SENDER_REJECTED"
            diag["safe_error_message"] = f"Sender address was refused by the mail server: {sender_err.smtp_error}"
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {"error_code": "SENDER_REJECTED"})
        except smtplib.SMTPRecipientsRefused as recip_err:
            diag["error_code"] = "PROVIDER_REJECTED"
            diag["safe_error_message"] = f"Recipient address was rejected by SMTP host: {recip_err.recipients}"
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {"error_code": "PROVIDER_REJECTED"})
        except (ConnectionRefusedError, smtplib.SMTPConnectError) as conn_err:
            diag["error_code"] = "CONNECTION_REFUSED"
            diag["safe_error_message"] = f"Connection to SMTP host refused: {conn_err}"
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {"error_code": "CONNECTION_REFUSED"})
        except TimeoutError as to_err:
            diag["error_code"] = "TIMEOUT"
            diag["safe_error_message"] = f"Connection to SMTP host timed out: {to_err}"
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {"error_code": "TIMEOUT"})
        except (ssl.SSLError, smtplib.SMTPNotSupportedError) as ssl_err:
            diag["error_code"] = "TLS_FAILURE"
            diag["safe_error_message"] = f"TLS handshake failed: {ssl_err}"
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {"error_code": "TLS_FAILURE"})
        except socket.gaierror as gai_err:
            diag["error_code"] = "DNS_FAILURE"
            diag["safe_error_message"] = f"DNS resolution failed: {gai_err}"
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {"error_code": "DNS_FAILURE"})
        except Exception as ex:
            diag["error_code"] = "PROVIDER_REJECTED"
            diag["safe_error_message"] = f"SMTP dispatch error: {str(ex)}"
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {"error_code": "PROVIDER_REJECTED"})
        finally:
            if server:
                try:
                    server.close()
                except Exception:
                    pass

        return diag

    def send_test_email(self, to_email: str) -> Dict[str, Any]:
        """
        Sends a non-secret test email to verify external email delivery pipeline.
        """
        return self.verify_smtp_connectivity(test_recipient=to_email)

    def _render_password_reset_template(
        self,
        first_name: str,
        code: str,
        expires_minutes: int = 10,
    ) -> Dict[str, str]:
        """
        Renders professional ResistanceIQ branded HTML and plain-text email templates.
        """
        subject = "ResistanceIQ Password Reset Verification Code"
        name_display = first_name.strip() if first_name else "Scientist"

        plain_text = f"""ResistanceIQ
Password Reset Verification

Your verification code:
{code}

This code expires in {expires_minutes} minutes.

If you did not request this password reset, you can safely ignore this email.

ResistanceIQ
Scientific Intelligence Platform
"""

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030609; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F1F5F9;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #030609; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #080D14; border: 1px solid #1E293B; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 28px 36px; border-bottom: 1px solid rgba(255,255,255,0.06); background: linear-gradient(180deg, rgba(11,223,160,0.05) 0%, transparent 100%);">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; vertical-align: middle;">
                      <span style="font-size: 18px; font-weight: 800; letter-spacing: -0.02em; color: #FFFFFF;">
                        Resistance<span style="color: #0BDFA0;">IQ</span>
                      </span>
                      <div style="font-size: 9px; font-weight: 700; color: #7C8A9A; letter-spacing: 0.14em; text-transform: uppercase; margin-top: 2px;">
                        SCIENTIFIC INTELLIGENCE PLATFORM
                      </div>
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; background-color: rgba(11,223,160,0.1); border: 1px solid rgba(11,223,160,0.25); font-family: monospace; font-size: 10px; font-weight: 700; color: #0BDFA0;">
                      SECURITY DISPATCH
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0 0 12px 0; letter-spacing: -0.01em;">
                Password Reset Verification
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #9AACBE; margin: 0 0 24px 0;">
                Hello <strong style="color: #F1F5F9;">{name_display}</strong>,<br>
                We received a request to reset the password for your ResistanceIQ research workspace. Use the one-time verification code below to authorize your password update:
              </p>

              <!-- 6-Digit Code Callout Box -->
              <div style="background-color: #030609; border: 1px solid #1E293B; border-radius: 14px; padding: 22px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 10px; font-family: monospace; font-weight: 700; color: #7C8A9A; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px;">
                  ONE-TIME VERIFICATION CODE
                </div>
                <div style="font-size: 36px; font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace; font-weight: 800; letter-spacing: 10px; color: #0BDFA0; text-shadow: 0 0 20px rgba(11,223,160,0.3);">
                  {code}
                </div>
                <div style="font-size: 11px; color: #64748B; margin-top: 10px;">
                  Expires in <span style="color: #F1F5F9; font-weight: 600;">{expires_minutes} minutes</span> · Single use only
                </div>
              </div>

              <!-- Security Notice -->
              <div style="background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 16px; margin-bottom: 24px;">
                <p style="font-size: 12px; line-height: 1.5; color: #7C8A9A; margin: 0;">
                  <strong style="color: #9AACBE;">Security Advisory:</strong> If you did not initiate this request, you can safely disregard this email. Your existing credentials remain secure and no changes will be made to your account.
                </p>
              </div>

              <p style="font-size: 12px; color: #64748B; margin: 0;">
                Sincerely,<br>
                <strong style="color: #9AACBE;">ResistanceIQ Security Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; border-top: 1px solid rgba(255,255,255,0.04); background-color: rgba(3,6,9,0.5); text-align: center;">
              <p style="font-size: 11px; color: #475569; margin: 0; font-family: monospace;">
                © 2026 ResistanceIQ · Secure Computational Biology Intelligence
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
        return {"subject": subject, "plain": plain_text, "html": html_content}

    def _create_mime_message(
        self,
        to_email: str,
        subject: str,
        plain_text: str,
        html_text: str,
        request_id: str,
    ) -> MIMEMultipart:
        """Constructs a compliant RFC 822 MIME multipart/alternative message."""
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self.from_name} <{self.from_email}>"
        msg["To"] = to_email
        msg["Date"] = formatdate(localtime=False, usegmt=True)
        msg["Message-ID"] = make_msgid(domain="resistanceiq.bio")
        msg["X-Request-ID"] = request_id
        msg["X-ResistanceIQ-Type"] = "password_reset_code"

        part1 = MIMEText(plain_text, "plain", "utf-8")
        part2 = MIMEText(html_text, "html", "utf-8")
        msg.attach(part1)
        msg.attach(part2)
        return msg

    def send_password_reset_code(
        self,
        to_email: str,
        code: str,
        first_name: str = "",
        request_id: str = "",
    ) -> bool:
        """
        Main entry point for dispatching password reset verification codes.
        Adheres to environment gates, structured diagnostics, and fail-closed rules.
        """
        clean_to = to_email.lower().strip()
        recipient_domain = self._extract_domain(clean_to)

        self._log_diagnostic("EMAIL_DISPATCH_STARTED", {
            "request_id": request_id,
            "recipient_domain": recipient_domain,
            "app_env": self.app_env,
        })

        rendered = self._render_password_reset_template(first_name, code)
        mime_msg = self._create_mime_message(
            to_email=clean_to,
            subject=rendered["subject"],
            plain_text=rendered["plain"],
            html_text=rendered["html"],
            request_id=request_id,
        )

        self._log_diagnostic("EMAIL_MESSAGE_CREATED", {
            "request_id": request_id,
            "message_id": mime_msg.get("Message-ID"),
            "subject": rendered["subject"],
        })

        # ── 1. Production Mode: Strictly require real SMTP or Transactional Provider ──
        provider_type = (settings.EMAIL_PROVIDER or "smtp").lower().strip()

        if self.app_env == "production":
            if provider_type == "dev":
                raise EmailConfigurationError("DEV_MAILBOX is strictly prohibited in production.", request_id)

            if provider_type == "transactional" and settings.EMAIL_API_KEY:
                self._log_diagnostic("EMAIL_PROVIDER_SELECTED", {
                    "request_id": request_id,
                    "provider": "HTTP_API",
                })
                return self._deliver_http_api(
                    to_email=clean_to,
                    subject=rendered["subject"],
                    plain_text=rendered["plain"],
                    html_text=rendered["html"],
                    code=code,
                    request_id=request_id,
                    recipient_domain=recipient_domain,
                )

            if self.smtp_host:
                self._log_diagnostic("EMAIL_PROVIDER_SELECTED", {
                    "request_id": request_id,
                    "provider": "SMTP",
                })
                return self._deliver_smtp(
                    to_email=clean_to,
                    mime_msg=mime_msg,
                    code=code,
                    request_id=request_id,
                    recipient_domain=recipient_domain,
                )

            raise EmailConfigurationError(
                "Production environment requires an explicitly configured SMTP host or transactional HTTP API key.",
                request_id=request_id,
            )

        # ── 2. Development / Staging / Test Mode ──
        # If explicitly set to dev mailbox:
        if provider_type == "dev":
            self._log_diagnostic("EMAIL_PROVIDER_SELECTED", {
                "request_id": request_id,
                "provider": "DEV_MAILBOX",
            })
            return self._deliver_to_dev_inbox(
                to_email=clean_to,
                subject=rendered["subject"],
                plain_text=rendered["plain"],
                html_text=rendered["html"],
                mime_msg=mime_msg,
                code=code,
                request_id=request_id,
                recipient_domain=recipient_domain,
            )

        # If transactional API is configured:
        if provider_type == "transactional":
            if settings.EMAIL_API_KEY:
                self._log_diagnostic("EMAIL_PROVIDER_SELECTED", {
                    "request_id": request_id,
                    "provider": "HTTP_API",
                })
                return self._deliver_http_api(
                    to_email=clean_to,
                    subject=rendered["subject"],
                    plain_text=rendered["plain"],
                    html_text=rendered["html"],
                    code=code,
                    request_id=request_id,
                    recipient_domain=recipient_domain,
                )
            elif self.smtp_host:
                self._log_diagnostic("EMAIL_PROVIDER_SELECTED", {
                    "request_id": request_id,
                    "provider": "SMTP",
                })
                return self._deliver_smtp(
                    to_email=clean_to,
                    mime_msg=mime_msg,
                    code=code,
                    request_id=request_id,
                    recipient_domain=recipient_domain,
                )
            else:
                raise EmailConfigurationError("EMAIL_PROVIDER is 'transactional' but neither EMAIL_API_KEY nor SMTP_HOST is configured.", request_id)

        # If SMTP is configured:
        if provider_type == "smtp":
            if not self.smtp_host:
                raise EmailConfigurationError("EMAIL_PROVIDER is 'smtp' but SMTP_HOST is not configured.", request_id)
            self._log_diagnostic("EMAIL_PROVIDER_SELECTED", {
                "request_id": request_id,
                "provider": "SMTP",
            })
            return self._deliver_smtp(
                to_email=clean_to,
                mime_msg=mime_msg,
                code=code,
                request_id=request_id,
                recipient_domain=recipient_domain,
            )

        # Default fallback for unconfigured development environment
        self._log_diagnostic("EMAIL_PROVIDER_SELECTED", {
            "request_id": request_id,
            "provider": "DEV_MAILBOX",
        })
        return self._deliver_to_dev_inbox(
            to_email=clean_to,
            subject=rendered["subject"],
            plain_text=rendered["plain"],
            html_text=rendered["html"],
            mime_msg=mime_msg,
            code=code,
            request_id=request_id,
            recipient_domain=recipient_domain,
        )

    def _deliver_http_api(
        self,
        to_email: str,
        subject: str,
        plain_text: str,
        html_text: str,
        code: str = "",
        request_id: str = "",
        recipient_domain: str = "",
    ) -> bool:
        """
        Dispatches email via HTTPS Transactional API (Resend, SendGrid, Brevo).
        Operates over Port 443, bypassing ISP SMTP port blocks.
        """
        import httpx

        api_key = settings.EMAIL_API_KEY or ""
        msg_id = f"api_{uuid.uuid4().hex[:12]}" if "uuid" in globals() else f"api_{request_id[:12]}"

        self._log_diagnostic("EMAIL_TRANSPORT", {
            "request_id": request_id,
            "transport": "http_api",
            "provider": settings.EMAIL_PROVIDER,
        })

        try:
            # 1. Resend API
            if api_key.startswith("re_") or "resend" in settings.EMAIL_PROVIDER.lower():
                from_sender = self.from_email
                if from_sender.endswith("@resistanceiq.bio"):
                    from_sender = "onboarding@resend.dev"

                payload = {
                    "from": f"{self.from_name} <{from_sender}>",
                    "to": [to_email],
                    "subject": subject,
                    "text": plain_text,
                    "html": html_text,
                }
                resp = httpx.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json=payload,
                    timeout=10.0,
                )
                if resp.status_code in [200, 201]:
                    data = resp.json()
                    msg_id = data.get("id", msg_id)
                elif resp.status_code == 401:
                    raise EmailDeliveryError("AUTHENTICATION_FAILURE", f"Resend API key unauthorized: {resp.text}", request_id)
                elif resp.status_code == 403:
                    raise EmailDeliveryError("SENDER_REJECTED", f"Resend sender or recipient domain restriction: {resp.text}", request_id)
                else:
                    raise EmailDeliveryError("PROVIDER_REJECTED", f"Resend API error: {resp.status_code} {resp.text}", request_id)

            # 2. SendGrid API
            elif api_key.startswith("SG.") or "sendgrid" in settings.EMAIL_PROVIDER.lower():
                payload = {
                    "personalizations": [{"to": [{"email": to_email}]}],
                    "from": {"email": self.from_email, "name": self.from_name},
                    "subject": subject,
                    "content": [
                        {"type": "text/plain", "value": plain_text},
                        {"type": "text/html", "value": html_text},
                    ],
                }
                resp = httpx.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json=payload,
                    timeout=10.0,
                )
                if resp.status_code in [200, 202]:
                    msg_id = resp.headers.get("X-Message-Id", msg_id)
                elif resp.status_code == 401:
                    raise EmailDeliveryError("AUTHENTICATION_FAILURE", f"SendGrid API unauthorized: {resp.text}", request_id)
                elif resp.status_code == 403:
                    raise EmailDeliveryError("SENDER_REJECTED", f"SendGrid sender not verified: {resp.text}", request_id)
                else:
                    raise EmailDeliveryError("PROVIDER_REJECTED", f"SendGrid API error: {resp.status_code} {resp.text}", request_id)

            # 3. Brevo API
            elif api_key.startswith("xkeysib-") or "brevo" in settings.EMAIL_PROVIDER.lower():
                payload = {
                    "sender": {"email": self.from_email, "name": self.from_name},
                    "to": [{"email": to_email}],
                    "subject": subject,
                    "textContent": plain_text,
                    "htmlContent": html_text,
                }
                resp = httpx.post(
                    "https://api.brevo.com/v3/smtp/email",
                    headers={"api-key": api_key, "Content-Type": "application/json"},
                    json=payload,
                    timeout=10.0,
                )
                if resp.status_code in [200, 201]:
                    data = resp.json()
                    msg_id = data.get("messageId", msg_id)
                elif resp.status_code == 401:
                    raise EmailDeliveryError("AUTHENTICATION_FAILURE", f"Brevo API unauthorized: {resp.text}", request_id)
                elif resp.status_code == 403:
                    raise EmailDeliveryError("SENDER_REJECTED", f"Brevo sender not verified: {resp.text}", request_id)
                else:
                    raise EmailDeliveryError("PROVIDER_REJECTED", f"Brevo API error: {resp.status_code} {resp.text}", request_id)

            else:
                raise EmailConfigurationError("Unrecognized EMAIL_API_KEY format.", request_id)

            self._log_diagnostic("HTTP_API_MESSAGE_ACCEPTED", {
                "request_id": request_id,
                "provider": "HTTP_API",
                "recipient_domain": recipient_domain,
                "message_id": msg_id,
            })

            self._log_diagnostic("EMAIL_DISPATCH_SUCCESS", {
                "request_id": request_id,
                "provider": "HTTP_API",
                "recipient_domain": recipient_domain,
                "status": "ACCEPTED",
                "message_id": msg_id,
            })

            return True

        except EmailDeliveryError:
            raise
        except EmailConfigurationError:
            raise
        except Exception as e:
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {
                "request_id": request_id,
                "provider": "HTTP_API",
                "error_code": "PROVIDER_REJECTED",
                "reason": str(e),
            })
            raise EmailDeliveryError("PROVIDER_REJECTED", str(e), request_id)

    def _deliver_smtp(
        self,
        to_email: str,
        mime_msg: MIMEMultipart,
        code: str = "",
        request_id: str = "",
        recipient_domain: str = "",
    ) -> bool:
        """
        Dispatches email via SMTP supporting Port 465 (SSL) and Port 587/25 (STARTTLS).
        Categorizes errors into standard error codes.
        """
        self._log_diagnostic("EMAIL_TRANSPORT", {
            "request_id": request_id,
            "transport": "smtp",
            "host": self.smtp_host,
            "port": self.smtp_port,
        })
        msg_id = mime_msg.get("Message-ID", "")

        try:
            ssl_context = ssl.create_default_context()
            
            # Port 465: Direct SSL
            if self.smtp_port == 465:
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=12, context=ssl_context)
            else:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=12)
                if self.use_tls:
                    server.ehlo()
                    server.starttls(context=ssl_context)
                    server.ehlo()

            self._log_diagnostic("SMTP_CONNECTION_SUCCESS", {
                "request_id": request_id,
                "host": self.smtp_host,
                "port": self.smtp_port,
            })

            if self.smtp_user and self.smtp_password:
                server.login(self.smtp_user, self.smtp_password)
                self._log_diagnostic("SMTP_AUTH_SUCCESS", {
                    "request_id": request_id,
                    "user_domain": self._extract_domain(self.smtp_user),
                })

            send_errs = server.sendmail(self.from_email, [to_email], mime_msg.as_string())
            if isinstance(send_errs, dict) and len(send_errs) > 0:
                try:
                    server.quit()
                except Exception:
                    pass
                raise EmailDeliveryError("PROVIDER_REJECTED", f"SMTP rejected recipients: {send_errs}", request_id)

            server.quit()

            self._log_diagnostic("SMTP_MESSAGE_ACCEPTED", {
                "request_id": request_id,
                "provider": "SMTP",
                "recipient_domain": recipient_domain,
                "message_id": msg_id,
            })

            self._log_diagnostic("EMAIL_PROVIDER_MESSAGE_ID", {
                "request_id": request_id,
                "message_id": msg_id,
            })

            self._log_diagnostic("EMAIL_DISPATCH_SUCCESS", {
                "request_id": request_id,
                "provider": "SMTP",
                "recipient_domain": recipient_domain,
                "status": "SMTP_ACCEPTED",
                "message_id": msg_id,
            })

            return True

        except smtplib.SMTPAuthenticationError as auth_err:
            reason = f"SMTP Authentication failed for user '{self.smtp_user}'. If using Gmail, an App Password is required."
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {
                "request_id": request_id,
                "provider": "SMTP",
                "error_code": "AUTHENTICATION_FAILURE",
                "reason": reason,
            })
            raise EmailDeliveryError("AUTHENTICATION_FAILURE", reason, request_id)

        except smtplib.SMTPSenderRefused as sender_err:
            reason = f"Sender address '{self.from_email}' was rejected by SMTP host: {sender_err.smtp_error}"
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {
                "request_id": request_id,
                "provider": "SMTP",
                "error_code": "SENDER_REJECTED",
                "reason": reason,
            })
            raise EmailDeliveryError("SENDER_REJECTED", reason, request_id)

        except smtplib.SMTPRecipientsRefused as recip_err:
            reason = f"Recipient address '{to_email}' was rejected by SMTP host: {recip_err.recipients}"
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {
                "request_id": request_id,
                "provider": "SMTP",
                "error_code": "PROVIDER_REJECTED",
                "reason": reason,
            })
            raise EmailDeliveryError("PROVIDER_REJECTED", reason, request_id)

        except (ConnectionRefusedError, smtplib.SMTPConnectError) as conn_err:
            reason = f"Failed to connect to SMTP server {self.smtp_host}:{self.smtp_port} ({conn_err})"
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {
                "request_id": request_id,
                "provider": "SMTP",
                "error_code": "CONNECTION_REFUSED",
                "reason": reason,
            })
            raise EmailDeliveryError("CONNECTION_REFUSED", reason, request_id)

        except TimeoutError as to_err:
            reason = f"Connection to SMTP host {self.smtp_host}:{self.smtp_port} timed out ({to_err})"
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {
                "request_id": request_id,
                "provider": "SMTP",
                "error_code": "TIMEOUT",
                "reason": reason,
            })
            raise EmailDeliveryError("TIMEOUT", reason, request_id)

        except (ssl.SSLError, smtplib.SMTPNotSupportedError) as tls_err:
            reason = f"TLS/SSL negotiation failed with SMTP host ({tls_err})"
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {
                "request_id": request_id,
                "provider": "SMTP",
                "error_code": "TLS_FAILURE",
                "reason": reason,
            })
            raise EmailDeliveryError("TLS_FAILURE", reason, request_id)

        except socket.gaierror as gai_err:
            reason = f"DNS resolution failed for host {self.smtp_host} ({gai_err})"
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {
                "request_id": request_id,
                "provider": "SMTP",
                "error_code": "DNS_FAILURE",
                "reason": reason,
            })
            raise EmailDeliveryError("DNS_FAILURE", reason, request_id)

        except EmailDeliveryError:
            raise

        except Exception as e:
            reason = f"Unexpected SMTP error: {str(e)}"
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {
                "request_id": request_id,
                "provider": "SMTP",
                "error_code": "PROVIDER_REJECTED",
                "reason": reason,
            })
            raise EmailDeliveryError("PROVIDER_REJECTED", reason, request_id)

    def _deliver_to_dev_inbox(
        self,
        to_email: str,
        subject: str,
        plain_text: str,
        html_text: str,
        mime_msg: MIMEMultipart,
        code: str,
        request_id: str,
        recipient_domain: str,
    ) -> bool:
        """
        Stores verification email as standard RFC 822 .eml file in development mailbox.
        NEVER executed in production.
        """
        self._log_diagnostic("EMAIL_TRANSPORT", {
            "request_id": request_id,
            "transport": "dev_mailbox",
            "inbox_path": self.dev_inbox_dir,
        })
        try:
            self._ensure_dev_mailbox_directories()

            record = {
                "request_id": request_id,
                "to_email": to_email,
                "subject": subject,
                "plain_text": plain_text,
                "html_text": html_text,
                "verification_code": code,
                "dispatched_at": datetime.now(timezone.utc).isoformat(),
            }

            # 1. In-memory queue
            self._dev_memory_inbox.append(record)

            # 2. File-system persistence: Write standard RFC 822 .eml and .json sidecar
            raw_eml_content = mime_msg.as_string()
            base_filename = f"reset_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{request_id[:8]}"
            eml_filename = f"{base_filename}.eml"
            json_filename = f"{base_filename}.json"

            target_dirs = [
                self.dev_inbox_dir,
                os.path.abspath("./storage/dev_emails"),
                os.path.abspath("./resistanceiq/storage/dev_emails"),
            ]

            for d in set(target_dirs):
                try:
                    os.makedirs(d, exist_ok=True)
                    # Write .eml
                    with open(os.path.join(d, eml_filename), "w", encoding="utf-8") as f:
                        f.write(raw_eml_content)
                    # Write .json
                    with open(os.path.join(d, json_filename), "w", encoding="utf-8") as f:
                        json.dump(record, f, indent=2)
                except Exception as de:
                    logger.warning(f"Could not write dev email to {d}: {de}")

            self._log_diagnostic("EMAIL_DISPATCH_SUCCESS", {
                "request_id": request_id,
                "provider": "DEV_MAILBOX",
                "recipient_domain": recipient_domain,
                "artifact": eml_filename,
            })
            return True

        except Exception as e:
            reason = f"Failed to write email artifact to dev mailbox: {str(e)}"
            self._log_diagnostic("EMAIL_DISPATCH_FAILED", {
                "request_id": request_id,
                "provider": "DEV_MAILBOX",
                "error_code": "DEV_MAILBOX_WRITE_FAILED",
                "reason": reason,
            })
            raise EmailDeliveryError("DEV_MAILBOX_WRITE_FAILED", reason, request_id)

    def get_latest_dev_email(self, recipient: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Helper method strictly for automated test suites to read dispatched test messages.
        Parses both memory and .eml / .json files from storage.
        """
        clean_rec = recipient.lower().strip() if recipient else None
        
        # 1. Check in-memory store first
        for item in reversed(self._dev_memory_inbox):
            if not clean_rec or item["to_email"] == clean_rec:
                return item

        # 2. Check file stores
        check_dirs = [
            self.dev_inbox_dir,
            os.path.abspath("./storage/dev_emails"),
            os.path.abspath("./resistanceiq/storage/dev_emails"),
        ]

        for d in set(check_dirs):
            if not os.path.exists(d):
                continue

            # Check JSON files first
            json_files = sorted([f for f in os.listdir(d) if f.endswith(".json")], reverse=True)
            for fname in json_files:
                try:
                    with open(os.path.join(d, fname), "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if not clean_rec or data.get("to_email") == clean_rec:
                            return data
                except Exception:
                    continue

            # Check .eml files
            eml_files = sorted([f for f in os.listdir(d) if f.endswith(".eml")], reverse=True)
            for fname in eml_files:
                try:
                    with open(os.path.join(d, fname), "r", encoding="utf-8") as f:
                        msg = email.message_from_file(f)
                        to_header = msg.get("To", "").lower()
                        if not clean_rec or clean_rec in to_header:
                            body = ""
                            if msg.is_multipart():
                                for part in msg.walk():
                                    if part.get_content_type() == "text/plain":
                                        body = part.get_payload(decode=True).decode("utf-8")
                                        break
                            else:
                                body = msg.get_payload(decode=True).decode("utf-8")

                            # Extract 6-digit OTP from body
                            otp_match = re.search(r"\b(\d{6})\b", body)
                            otp_code = otp_match.group(1) if otp_match else ""

                            return {
                                "to_email": to_header,
                                "subject": msg.get("Subject", ""),
                                "verification_code": otp_code,
                                "plain_text": body,
                                "message_id": msg.get("Message-ID", ""),
                            }
                except Exception:
                    continue

        return None

    def clear_dev_mailbox(self):
        """Clears test messages between test executions."""
        self._dev_memory_inbox.clear()
        check_dirs = [
            self.dev_inbox_dir,
            os.path.abspath("./storage/dev_emails"),
            os.path.abspath("./resistanceiq/storage/dev_emails"),
        ]
        for d in set(check_dirs):
            if os.path.exists(d):
                for fname in os.listdir(d):
                    if fname.endswith(".json") or fname.endswith(".eml"):
                        try:
                            os.remove(os.path.join(d, fname))
                        except Exception:
                            pass


email_service = EmailService()
