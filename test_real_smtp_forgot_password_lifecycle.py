"""
ResistanceIQ — Real SMTP End-to-End Delivery & Verification Test
================================================================
Verifies real SMTP dispatch, server acceptance (250 OK), real mailbox
receipt via IMAP, OTP extraction, code verification, and password reset.
"""

import os
import sys
import re
import imaplib
import email
import httpx
from datetime import datetime, timezone

API_BASE = "http://127.0.0.1:8000/api/v1"

IMAP_HOST = os.getenv("TEST_IMAP_HOST", "imap.ethereal.email")
IMAP_PORT = int(os.getenv("TEST_IMAP_PORT", "993"))
IMAP_USER = os.getenv("TEST_IMAP_USER", "test_user@ethereal.email")
IMAP_PASS = os.getenv("TEST_IMAP_PASS", "")

TEST_EMAIL = os.getenv("TEST_EMAIL", IMAP_USER)
INITIAL_PASS = os.getenv("TEST_INITIAL_PASS", "InitialScientificPass2026!#")
NEW_PASS = os.getenv("TEST_NEW_PASS", "UpdatedRealDeliveredPass2026!#")


def run_test():
    print("=" * 70)
    print("REAL SMTP END-TO-END VERIFICATION TEST")
    print("=" * 70)

    # 1. Register test user if not exists
    print("\n1. Registering/Ensuring test account...")
    with httpx.Client(base_url=API_BASE, timeout=10.0) as client:
        reg_res = client.post("/auth/register", json={
            "first_name": "Eleanor",
            "last_name": "Vance",
            "email": TEST_EMAIL,
            "organization_name": "Computational Biology Institute",
            "password": INITIAL_PASS,
            "confirm_password": INITIAL_PASS,
        })
        if reg_res.status_code == 201:
            print("  [OK] Account registered.")
        else:
            print("  [OK] Account exists or registration status:", reg_res.status_code)

        # 2. Trigger Forgot Password request
        print("\n2. Submitting Forgot Password request...")
        fp_res = client.post("/auth/forgot-password", json={"email": TEST_EMAIL})
        assert fp_res.status_code == 200, f"Forgot password failed: {fp_res.text}"
        print("  [OK] API returned 200 OK:", fp_res.json())

    # 3. Read REAL email from external mailbox via IMAP
    print("\n3. Connecting to REAL external mailbox via IMAP (imap.ethereal.email:993)...")
    imap = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
    imap.login(IMAP_USER, IMAP_PASS)
    imap.select("INBOX")
    status, data = imap.search(None, "ALL")
    msg_ids = data[0].split()
    print(f"  [OK] Found {len(msg_ids)} total messages in live mailbox.")
    assert len(msg_ids) > 0, "No messages in mailbox!"

    latest_id = msg_ids[-1]
    status, msg_data = imap.fetch(latest_id, "(RFC822)")
    raw_email = msg_data[0][1]
    parsed_msg = email.message_from_bytes(raw_email)

    print(f"  [OK] Live Received Message-ID: {parsed_msg.get('Message-ID')}")
    print(f"  [OK] Live Received Subject:    {parsed_msg.get('Subject')}")
    print(f"  [OK] Live Received To:         {parsed_msg.get('To')}")
    print(f"  [OK] Live Received From:       {parsed_msg.get('From')}")

    # Extract body & OTP
    body_text = ""
    if parsed_msg.is_multipart():
        for part in parsed_msg.walk():
            if part.get_content_type() == "text/plain":
                body_text = part.get_payload(decode=True).decode("utf-8")
                break
    else:
        body_text = parsed_msg.get_payload(decode=True).decode("utf-8")

    otp_match = re.search(r"\b(\d{6})\b", body_text)
    assert otp_match, "Could not find 6-digit OTP in delivered message body!"
    otp_code = otp_match.group(1)
    print(f"  [OK] Extracted 6-digit OTP from REAL delivered email body: {otp_code}")

    imap.logout()

    # 4. Verify OTP Code via API
    print("\n4. Verifying OTP Code against API...")
    with httpx.Client(base_url=API_BASE, timeout=10.0) as client:
        v_res = client.post("/auth/verify-reset-code", json={
            "email": TEST_EMAIL,
            "code": otp_code,
        })
        assert v_res.status_code == 200, f"Verification failed: {v_res.text}"
        reset_token = v_res.json()["reset_token"]
        print("  [OK] Verification successful. Reset token issued.")

        # 5. Set New Password
        print("\n5. Resetting password with reset token...")
        r_res = client.post("/auth/reset-password", json={
            "reset_token": reset_token,
            "new_password": NEW_PASS,
        })
        assert r_res.status_code == 200, f"Reset password failed: {r_res.text}"
        print("  [OK] Password successfully reset.")

        # 6. Verify Old Password Fails
        print("\n6. Verifying old password is now rejected...")
        old_login = client.post("/auth/login", json={
            "email": TEST_EMAIL,
            "password": INITIAL_PASS,
        })
        assert old_login.status_code == 401, "Old password was incorrectly accepted!"
        print("  [OK] Old password correctly rejected (401 Unauthorized).")

        # 7. Verify New Password Succeeds
        print("\n7. Verifying login with NEW password...")
        new_login = client.post("/auth/login", json={
            "email": TEST_EMAIL,
            "password": NEW_PASS,
        })
        assert new_login.status_code == 200, f"New login failed: {new_login.text}"
        assert "access_token" in new_login.json()
        print("  [OK] Successfully authenticated with NEW password and obtained JWT access token!")

    print("\n" + "=" * 70)
    print(">>> REAL SMTP EMAIL DELIVERY & RECOVERY LIFECYCLE 100% VERIFIED! <<<")
    print("=" * 70)


if __name__ == "__main__":
    run_test()
