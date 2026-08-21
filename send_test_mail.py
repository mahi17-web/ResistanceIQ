"""
Send Testing Mail to mahimarketing1701@gmail.com
ResistanceIQ Platform Email Verification
"""

import os
import sys
import ssl
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid
from datetime import datetime, timezone

TARGET_RECIPIENT = os.getenv("TEST_TARGET_EMAIL", "mahimarketing1701@gmail.com")
FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "resistanceiq69@gmail.com")
FROM_NAME = os.getenv("SMTP_FROM_NAME", "ResistanceIQ")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PASS = os.getenv("SMTP_PASSWORD", "")

def send_test_mail(target_email: str = TARGET_RECIPIENT):
    print(f"[1/4] Preparing test email for {target_email}...")
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "ResistanceIQ — System Test Email & Service Verification"
    msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"] = target_email
    msg["Date"] = formatdate(localtime=False, usegmt=True)
    msg["Message-ID"] = make_msgid(domain="resistanceiq.bio")

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    plain_body = f"""ResistanceIQ — System Test Email

Hello,

This is a test email sent from the ResistanceIQ Scientific Intelligence Platform to confirm operational status and email delivery.

Recipient: {target_email}
Sender: {FROM_EMAIL}
Status: Operational & Verified
Timestamp: {now_str}

If you received this message, the ResistanceIQ transactional email delivery service is functioning properly.

Best regards,
ResistanceIQ Engineering Team
"""

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ResistanceIQ Test Mail</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030609; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F1F5F9;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #030609; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #080D14; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.06); background: linear-gradient(180deg, rgba(11,223,160,0.08) 0%, transparent 100%);">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 800; color: #FFFFFF;">
                      Resistance<span style="color: #0BDFA0;">IQ</span>
                    </span>
                    <div style="font-size: 10px; font-weight: 700; color: #7C8A9A; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 2px;">
                      SCIENTIFIC INTELLIGENCE PLATFORM
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; background-color: rgba(11,223,160,0.12); border: 1px solid rgba(11,223,160,0.3); font-family: monospace; font-size: 11px; font-weight: 700; color: #0BDFA0;">
                      DELIVERY TEST
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="font-size: 18px; font-weight: 700; color: #FFFFFF; margin: 0 0 12px 0;">
                Live SMTP Test Email
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #9AACBE; margin: 0 0 20px 0;">
                This email confirms that the <strong style="color: #F1F5F9;">ResistanceIQ</strong> email delivery service is configured and successfully dispatching live messages via Gmail SMTP.
              </p>
              
              <div style="background-color: #030609; border: 1px solid #1E293B; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                <div style="font-size: 12px; color: #7C8A9A; margin-bottom: 8px;"><strong style="color: #F1F5F9;">Recipient:</strong> {target_email}</div>
                <div style="font-size: 12px; color: #7C8A9A; margin-bottom: 8px;"><strong style="color: #F1F5F9;">Status:</strong> <span style="color: #0BDFA0; font-weight: 700;">CONNECTED &amp; DELIVERED</span></div>
                <div style="font-size: 12px; color: #7C8A9A; margin-bottom: 8px;"><strong style="color: #F1F5F9;">Dispatched At:</strong> {now_str}</div>
                <div style="font-size: 12px; color: #7C8A9A;"><strong style="color: #F1F5F9;">Message ID:</strong> {msg['Message-ID']}</div>
              </div>

              <p style="font-size: 12px; line-height: 1.5; color: #7C8A9A; margin-bottom: 20px;">
                If you received this message in your inbox (or spam/junk folder), the email dispatch pipeline is 100% verified and operational.
              </p>

              <p style="font-size: 12px; color: #64748B; margin: 0;">
                Best regards,<br>
                <strong style="color: #9AACBE;">ResistanceIQ Engineering Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.04); background-color: rgba(3,6,9,0.5); text-align: center;">
              <p style="font-size: 11px; color: #475569; margin: 0; font-family: monospace;">
                &copy; 2026 ResistanceIQ &middot; All systems operational
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    msg.attach(MIMEText(plain_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    print(f"[2/4] Connecting to {SMTP_HOST} (STARTTLS on port 587)...")
    
    server = None
    connected = False
    
    # Try Port 587 first, then fall back to 465 if needed
    for port, use_ssl in [(587, False), (465, True)]:
        try:
            print(f"  Attempting port {port} ({'SSL' if use_ssl else 'STARTTLS'})...")
            ssl_ctx = ssl.create_default_context()
            if use_ssl:
                server = smtplib.SMTP_SSL(SMTP_HOST, port, context=ssl_ctx, timeout=20)
            else:
                server = smtplib.SMTP(SMTP_HOST, port, timeout=20)
                server.ehlo()
                server.starttls(context=ssl_ctx)
                server.ehlo()
            
            print(f"[3/4] Authenticating with {FROM_EMAIL}...")
            server.login(FROM_EMAIL, SMTP_PASS)
            print(f"  [OK] Successfully authenticated on port {port}!")
            connected = True
            break
        except Exception as conn_err:
            print(f"  [WARN] Port {port} error: {conn_err}")
            if server:
                try:
                    server.close()
                except Exception:
                    pass
                server = None

    if not connected or not server:
        print("[ERROR] Could not establish authenticated SMTP connection.")
        sys.exit(1)

    print(f"[4/4] Dispatching message to {target_email}...")
    errors = server.sendmail(FROM_EMAIL, [target_email], msg.as_string())
    if not errors:
        print("\n" + "=" * 60)
        print(f" SUCCESS: Test email dispatched successfully to {target_email}!")
        print(f" Message ID: {msg['Message-ID']}")
        print(f" Dispatched at: {now_str}")
        print("=" * 60)
    else:
        print(f"\n[ERROR] Delivery failed for recipients: {errors}")
        sys.exit(1)
        
    try:
        server.quit()
    except Exception:
        pass

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else TARGET_RECIPIENT
    send_test_mail(target)
