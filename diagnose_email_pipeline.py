"""
Diagnostic Script: Reproduce and trace the forgot-password email delivery pipeline.
"""

import os
import sys
import uuid
import socket
import logging
from datetime import datetime, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("resistanceiq/backend"))

from app.core.config import settings
from app.core.database import SessionLocal
from app.models import User, PasswordResetCode
from app.services.email_service import email_service
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("diagnosis")

def run_diagnostics():
    print("\n" + "=" * 60)
    print("RESISTANCEIQ EMAIL PIPELINE DIAGNOSTIC REPORT")
    print("=" * 60)

    # 1. Environment Configuration
    print("\n[1] RUNTIME ENVIRONMENT CONFIGURATION:")
    print(f"  APP_ENV:            {settings.APP_ENV}")
    print(f"  EMAIL_PROVIDER:     {settings.EMAIL_PROVIDER}")
    print(f"  SMTP_HOST:          {'CONFIGURED (' + settings.SMTP_HOST + ')' if settings.SMTP_HOST else 'NOT CONFIGURED'}")
    print(f"  SMTP_PORT:          {settings.SMTP_PORT}")
    print(f"  SMTP_USERNAME:      {'CONFIGURED' if settings.SMTP_USERNAME else 'NOT CONFIGURED'}")
    print(f"  SMTP_PASSWORD:      {'CONFIGURED' if settings.SMTP_PASSWORD else 'NOT CONFIGURED'}")
    print(f"  SMTP_FROM_EMAIL:    {settings.SMTP_FROM_EMAIL}")
    print(f"  SMTP_FROM_NAME:     {settings.SMTP_FROM_NAME}")
    print(f"  SMTP_USE_TLS:       {settings.SMTP_USE_TLS}")
    print(f"  DEV_EMAIL_INBOX_DIR:{settings.DEV_EMAIL_INBOX_DIR} -> Absolute: {os.path.abspath(settings.DEV_EMAIL_INBOX_DIR)}")

    # 2. Check Storage Directories
    print("\n[2] STORAGE DIRECTORY AUDIT:")
    paths_to_check = [
        os.path.abspath("./storage/dev_emails"),
        os.path.abspath("./resistanceiq/storage/dev_emails"),
        os.path.abspath(settings.DEV_EMAIL_INBOX_DIR),
    ]
    for p in set(paths_to_check):
        exists = os.path.exists(p)
        writable = os.access(p, os.W_OK) if exists else "N/A"
        print(f"  Path: {p}")
        print(f"    Exists: {exists}, Writable: {writable}")
        if exists:
            files = os.listdir(p)
            print(f"    Files ({len(files)}): {files[:5]}")

    # 3. Check Database for Existing Users
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.is_active == True).first()
        if not user:
            print("\n[3] No active user found in DB to test.")
            return
        
        print(f"\n[3] ACTIVE TEST USER FOUND: {user.email} (ID: {user.id})")

        # 4. Trigger Forgot Password via HTTP API
        print("\n[4] SENDING FORGOT PASSWORD REQUEST VIA HTTP:")
        try:
            with httpx.Client(base_url="http://127.0.0.1:8000") as client:
                res = client.post("/api/v1/auth/forgot-password", json={"email": user.email})
                print(f"  HTTP Status: {res.status_code}")
                print(f"  Response Body: {res.json()}")
        except Exception as http_err:
            print(f"  HTTP Request Failed: {http_err}")

        # 5. Check Database PasswordResetCode
        print("\n[5] CHECKING DATABASE RESET CODES:")
        latest_code = (
            db.query(PasswordResetCode)
            .filter(PasswordResetCode.user_id == user.id)
            .order_by(PasswordResetCode.created_at.desc())
            .first()
        )
        if latest_code:
            print(f"  Latest Code ID:    {latest_code.id}")
            print(f"  Request ID:        {latest_code.request_id}")
            print(f"  Code Hash:         {latest_code.code_hash[:16]}...")
            print(f"  Created At:        {latest_code.created_at}")
            print(f"  Expires At:        {latest_code.expires_at}")
            print(f"  Attempt Count:     {latest_code.attempt_count}")
        else:
            print("  No PasswordResetCode record found for user!")

        # 6. Check Dev Mailbox Contents
        print("\n[6] CHECKING DEV MAILBOX AFTER REQUEST:")
        inbox_dir = os.path.abspath(settings.DEV_EMAIL_INBOX_DIR)
        if os.path.exists(inbox_dir):
            files = sorted(os.listdir(inbox_dir), reverse=True)
            print(f"  Found {len(files)} files in {inbox_dir}:")
            for f in files[:3]:
                print(f"    - {f}")
                with open(os.path.join(inbox_dir, f), "r", encoding="utf-8") as fp:
                    content = fp.read()
                    print(f"      Size: {len(content)} bytes")
                    # Preview first 3 lines
                    print("      Snippet: " + "\n      ".join(content.splitlines()[:4]))

    finally:
        db.close()

if __name__ == "__main__":
    run_diagnostics()
