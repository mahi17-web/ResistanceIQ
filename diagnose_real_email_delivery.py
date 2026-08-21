"""
ResistanceIQ — Real Email Delivery & SMTP Diagnostic Suite
===========================================================
Executes live non-secret runtime inspections, SMTP socket connections,
TLS negotiation, DNS/SPF/DMARC checks, and real test email sending.
"""

import os
import sys
import json
import httpx
from datetime import datetime, timezone

# Add backend to path
sys.path.insert(0, os.path.abspath("resistanceiq/backend"))

from app.core.config import settings
from app.services.email_service import email_service


def run_live_email_pipeline_diagnosis(test_target_email: str = "security@resistanceiq.bio"):
    print("=" * 70)
    print("RESISTANCEIQ — LIVE EMAIL DELIVERY PIPELINE AUDIT")
    print("=" * 70)

    # 1. Non-Secret Runtime Parameters
    runtime_config = email_service.get_runtime_configuration()
    print("\n[1] ACTIVE EMAIL TRANSPORT CONFIGURATION:")
    for k, v in runtime_config.items():
        print(f"  {k.upper():<25}: {v}")

    # 2. Domain Deliverability & Authentication (SPF / DMARC)
    print("\n[2] SENDER DOMAIN AUTHENTICATION & DNS AUDIT:")
    domain_check = email_service.check_sender_domain_authentication()
    print(f"  Sender Domain            : {domain_check['domain']}")
    print(f"  DNS Resolvable           : {domain_check['dns_resolvable']}")
    print(f"  SPF Record Present       : {domain_check['spf_found']}")
    print(f"  DMARC Record Present     : {domain_check['dmarc_found']}")
    print(f"  Deliverability Status    : {domain_check['status']}")
    for d in domain_check.get("details", []):
        print(f"    - {d}")

    # 3. Controlled SMTP Connectivity Test
    print(f"\n[3] SMTP CONNECTIVITY TEST (Target: {runtime_config['smtp_host']}:{runtime_config['smtp_port']}):")
    smtp_diag = email_service.verify_smtp_connectivity(test_recipient=test_target_email)
    print(f"  DNS Resolution           : {smtp_diag['dns_resolution']}")
    print(f"  TCP Connection           : {smtp_diag['tcp_connection']}")
    print(f"  TLS Negotiation          : {smtp_diag['tls_negotiation']}")
    print(f"  SMTP Authentication      : {smtp_diag['smtp_authentication']}")
    print(f"  Sender Acceptance        : {smtp_diag['sender_acceptance']}")
    print(f"  Message Accepted (Server): {smtp_diag['message_accepted']}")
    if smtp_diag.get("provider_response"):
        print(f"  Provider Response        : {smtp_diag['provider_response']}")
    if smtp_diag.get("message_id"):
        print(f"  Message-ID               : {smtp_diag['message_id']}")
    if smtp_diag.get("error_code"):
        print(f"  Error Code               : {smtp_diag['error_code']}")
        print(f"  Reason                   : {smtp_diag['safe_error_message']}")

    # 4. HTTP API Endpoint Verification
    print("\n[4] VERIFYING FASTAPI DIAGNOSTIC ENDPOINT (/api/v1/auth/diagnostics/email-config):")
    try:
        r = httpx.get("http://127.0.0.1:8000/api/v1/auth/diagnostics/email-config", timeout=5.0)
        print(f"  HTTP Status              : {r.status_code}")
        print(f"  Response                 : {json.dumps(r.json(), indent=2)}")
    except Exception as e:
        print(f"  API Connection Note      : {e}")

    # 5. Production Isolation Gate Test
    print("\n[5] PRODUCTION FAIL-CLOSED SECURITY GATE AUDIT:")
    is_prod = runtime_config["app_env"] == "production"
    has_smtp = bool(settings.SMTP_HOST)
    if is_prod and not has_smtp:
        print("  Status                   : FAIL_CLOSED (Dev mailbox blocked in production)")
    elif not is_prod:
        print(f"  Status                   : ALLOWED_IN_{runtime_config['app_env'].upper()} (Dev mailbox active for local dev)")

    print("\n" + "=" * 70)


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "security@resistanceiq.bio"
    run_live_email_pipeline_diagnosis(target)
