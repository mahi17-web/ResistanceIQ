"""
ResistanceIQ — Safe PostgreSQL & Supabase Connection Diagnostic Tool
Validates DNS, TCP socket reachability, psycopg2 driver authentication,
and SQLAlchemy engine execution without exposing secrets or passwords in logs.
"""

import os
import sys
import socket
from urllib.parse import urlparse, unquote

def run_diagnostic():
    raw_url = os.getenv("DATABASE_URL")
    if not raw_url:
        print("[FAIL] DATABASE_URL environment variable is NOT set.")
        print("Usage: $env:DATABASE_URL=\"postgresql://...\" ; python scripts/test_postgres_connection.py")
        sys.exit(1)

    # Normalize dialect for parsing if needed
    normalized_url = raw_url
    if normalized_url.startswith("postgres://"):
        normalized_url = normalized_url.replace("postgres://", "postgresql://", 1)

    if normalized_url.startswith("sqlite"):
        print("[INFO] DATABASE_URL is configured for SQLite.")
        print(f"Path: {normalized_url}")
        sys.exit(0)

    try:
        parsed = urlparse(normalized_url)
    except Exception as e:
        print(f"[FAIL] Could not parse DATABASE_URL: {e}")
        sys.exit(1)

    scheme = parsed.scheme
    hostname = parsed.hostname
    port = parsed.port or 5432
    username = parsed.username
    dbname = parsed.path.lstrip("/") or "postgres"
    query = parsed.query

    # Parse SSL mode
    sslmode = "require"
    if "sslmode=" in query:
        for param in query.split("&"):
            if param.startswith("sslmode="):
                sslmode = param.split("=")[1]

    # Redacted safe display
    print("=" * 70)
    print("RESISTANCEIQ — POSTGRESQL CONNECTION DIAGNOSTIC")
    print("=" * 70)
    print(f"SCHEME:      {scheme}")
    print(f"HOSTNAME:    {hostname}")
    print(f"PORT:        {port}")
    print(f"USERNAME:    {username}")
    print(f"DATABASE:    {dbname}")
    print(f"SSLMODE:     {sslmode}")
    print(f"PASSWORD:    [REDACTED] (Length: {len(parsed.password) if parsed.password else 0} chars)")
    print("=" * 70)

    # Step 1: DNS Resolution Test
    print("\n[STEP 1/4] Testing DNS Resolution...")
    try:
        host_info = socket.gethostbyname_ex(hostname)
        ips = host_info[2]
        print(f"  -> DNS RESOLUTION: PASS (Resolved to {', '.join(ips)})")
    except Exception as dnse:
        print(f"  -> DNS RESOLUTION: FAIL ({dnse})")
        sys.exit(1)

    # Step 2: TCP Socket Test
    print("\n[STEP 2/4] Testing TCP Port Reachability...")
    try:
        sock = socket.create_connection((hostname, port), timeout=8)
        sock.close()
        print(f"  -> TCP CONNECT ({hostname}:{port}): PASS")
    except Exception as tcpe:
        print(f"  -> TCP CONNECT ({hostname}:{port}): FAIL ({tcpe})")
        sys.exit(1)

    # Step 3: psycopg2 Direct Authentication Test
    print("\n[STEP 3/4] Testing psycopg2 DB-API Authentication & SELECT 1...")
    try:
        import psycopg2
        raw_password = unquote(parsed.password) if parsed.password else ""
        conn = psycopg2.connect(
            host=hostname,
            port=port,
            user=username,
            password=raw_password,
            dbname=dbname,
            sslmode=sslmode,
            connect_timeout=10,
        )
        cur = conn.cursor()
        cur.execute("SELECT 1")
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row and row[0] == 1:
            print("  -> PSYCOPG2 AUTH & SELECT 1: PASS")
        else:
            print(f"  -> PSYCOPG2 UNEXPECTED RESULT: {row}")
    except Exception as dbe:
        print(f"  -> PSYCOPG2 AUTH / QUERY: FAIL")
        print(f"     Error Type: {type(dbe).__name__}")
        clean_err = str(dbe).replace(raw_password, "[REDACTED]") if parsed.password else str(dbe)
        print(f"     Details:    {clean_err.strip()}")
        
        # Diagnostic guidance
        if "tenant/user" in clean_err and "not found" in clean_err:
            print("\n  [DIAGNOSTIC HINT]")
            print("  Supabase Pooler reported: tenant/user not found.")
            print("  Causes:")
            print("  1. The project reference in the username (postgres.<project_ref>) does not match a project in this region.")
            print("  2. Check your Supabase Dashboard -> Project Settings -> Database -> Connection String.")
            print("  3. Check if the project is in 'aws-0-ap-northeast-1' or another region (e.g. ap-south-1, us-east-1).")
        elif "password authentication failed" in clean_err:
            print("\n  [DIAGNOSTIC HINT]")
            print("  Password authentication failed.")
            print("  1. Verify your database password in Supabase Dashboard -> Project Settings -> Database -> Reset database password.")
            print("  2. If using the pooler, ensure username is 'postgres.<project_ref>'.")
            print("  3. If connecting directly to db.<project_ref>.supabase.co:5432, username is 'postgres'.")
        sys.exit(1)

    # Step 4: SQLAlchemy Engine Test
    print("\n[STEP 4/4] Testing SQLAlchemy Engine & Session Execution...")
    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(normalized_url, pool_pre_ping=True)
        with engine.connect() as sqla_conn:
            result = sqla_conn.execute(text("SELECT 1")).scalar()
            if result == 1:
                print("  -> SQLALCHEMY ENGINE & SELECT 1: PASS")
            else:
                print(f"  -> SQLALCHEMY UNEXPECTED RESULT: {result}")
        engine.dispose()
    except Exception as sqla_e:
        print(f"  -> SQLALCHEMY ENGINE: FAIL")
        clean_sqla_err = str(sqla_e).replace(raw_password, "[REDACTED]") if parsed.password else str(sqla_e)
        print(f"     Details: {clean_sqla_err.strip()}")
        sys.exit(1)

    print("\n" + "=" * 70)
    print("ALL POSTGRESQL CONNECTION & SQLALCHEMY TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_diagnostic()
