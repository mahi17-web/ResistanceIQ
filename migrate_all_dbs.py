import sqlite3
import glob
import os

def migrate_db(db_path):
    print(f"Migrating database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Inspect tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cursor.fetchall()]
    
    if 'users' in tables:
        cursor.execute("PRAGMA table_info(users);")
        existing_cols = {c[1]: c[2] for c in cursor.fetchall()}
        print(f"  Existing users columns: {list(existing_cols.keys())}")
        
        required_cols = {
            'first_name': 'VARCHAR(64)',
            'last_name': 'VARCHAR(64)',
            'display_name': 'VARCHAR(128)',
            'email_verification_token': 'VARCHAR(255)',
            'email_verification_expires_at': 'DATETIME',
            'last_login_at': 'DATETIME',
            'password_reset_token': 'VARCHAR(255)',
            'password_reset_expires_at': 'DATETIME',
            'invitation_token': 'VARCHAR(255)',
            'invitation_expires_at': 'DATETIME',
            'email_verified': 'BOOLEAN DEFAULT 0',
            'is_active': 'BOOLEAN DEFAULT 1',
        }
        
        for col_name, col_type in required_cols.items():
            if col_name not in existing_cols:
                print(f"  --> Adding column {col_name} ({col_type}) to users...")
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};")
        
        # Populate first_name and last_name from full_name if NULL
        cursor.execute("SELECT id, full_name, first_name, last_name, display_name FROM users;")
        rows = cursor.fetchall()
        for uid, fname, first, last, disp in rows:
            if not first or not last:
                parts = (fname or "").split(" ", 1)
                new_first = parts[0] if len(parts) > 0 else ""
                new_last = parts[1] if len(parts) > 1 else ""
                new_disp = disp or fname or f"{new_first} {new_last}".strip()
                cursor.execute(
                    "UPDATE users SET first_name = ?, last_name = ?, display_name = ? WHERE id = ?;",
                    (new_first, new_last, new_disp, uid)
                )
        conn.commit()
        print(f"  Updated user records in {db_path}")

    conn.close()

dbs = glob.glob('**/*.db', recursive=True)
for d in dbs:
    migrate_db(d)

print("Migration check complete.")
