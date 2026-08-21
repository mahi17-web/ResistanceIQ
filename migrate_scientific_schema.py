import sqlite3
import glob

def migrate_scientific_schema(db_path):
    print(f"Migrating scientific schema in: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. targets
    cursor.execute("PRAGMA table_info(targets);")
    target_cols = {c[1] for c in cursor.fetchall()}
    new_target_cols = {
        'moa_scheme': "VARCHAR(16) DEFAULT 'IRAC'",
        'moa_group': "VARCHAR(32)",
        'moa_subgroup': "VARCHAR(32)",
        'target_class': "VARCHAR(64)",
        'source_record_id': "VARCHAR(128)",
        'source_url': "VARCHAR(512)",
    }
    for col, col_type in new_target_cols.items():
        if col not in target_cols:
            print(f"  -> Adding {col} ({col_type}) to targets...")
            cursor.execute(f"ALTER TABLE targets ADD COLUMN {col} {col_type};")

    # 2. crop_threats
    cursor.execute("PRAGMA table_info(crop_threats);")
    threat_cols = {c[1] for c in cursor.fetchall()}
    new_threat_cols = {
        'source_record_id': "VARCHAR(128)",
        'source_url': "VARCHAR(512)",
    }
    for col, col_type in new_threat_cols.items():
        if col not in threat_cols:
            print(f"  -> Adding {col} ({col_type}) to crop_threats...")
            cursor.execute(f"ALTER TABLE crop_threats ADD COLUMN {col} {col_type};")

    # 3. protein_records
    cursor.execute("PRAGMA table_info(protein_records);")
    prot_cols = {c[1] for c in cursor.fetchall()}
    new_prot_cols = {
        'review_status': "VARCHAR(32) DEFAULT 'REVIEWED'",
        'entry_version': "INTEGER",
        'sequence_version': "INTEGER",
    }
    for col, col_type in new_prot_cols.items():
        if col not in prot_cols:
            print(f"  -> Adding {col} ({col_type}) to protein_records...")
            cursor.execute(f"ALTER TABLE protein_records ADD COLUMN {col} {col_type};")

    # 4. protein_structures
    cursor.execute("PRAGMA table_info(protein_structures);")
    str_cols = {c[1] for c in cursor.fetchall()}
    new_str_cols = {
        'entity_id': "VARCHAR(16) DEFAULT '1'",
        'mapping_evidence': "VARCHAR(64) DEFAULT 'EXACT_SPECIES_MATCH'",
    }
    for col, col_type in new_str_cols.items():
        if col not in str_cols:
            print(f"  -> Adding {col} ({col_type}) to protein_structures...")
            cursor.execute(f"ALTER TABLE protein_structures ADD COLUMN {col} {col_type};")

    conn.commit()
    conn.close()
    print(f"  Completed migration for {db_path}")

dbs = glob.glob('**/*.db', recursive=True)
for d in dbs:
    migrate_scientific_schema(d)

print("Scientific schema migration complete.")
