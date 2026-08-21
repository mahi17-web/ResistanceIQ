import urllib.request
import json
import ssl
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_URL = "http://localhost:8000/api/v1"

def test_api():
    print("=== Testing Expanded REST API Endpoints with Authentication ===")
    
    # 0. Register a unique researcher
    unique_ts = int(time.time())
    email = f"bio.curator.{unique_ts}@resistanceiq.org"
    reg_data = json.dumps({
        "first_name": "Bio",
        "last_name": "Curator",
        "email": email,
        "organization_name": "Global Resistance Institute",
        "password": "BioCurator#2026!",
        "confirm_password": "BioCurator#2026!"
    }).encode()
    
    reg_req = urllib.request.Request(
        f"{BASE_URL}/auth/register",
        data=reg_data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(reg_req, context=ctx) as res:
        reg_res = json.loads(res.read().decode())
        token = reg_res["access_token"]
        print(f"0. Registered & Authenticated as {email} (Token Length: {len(token)})")

    auth_headers = {"Authorization": f"Bearer {token}"}

    # 1. Crops Endpoint
    req = urllib.request.Request(f"{BASE_URL}/crops?limit=50", headers=auth_headers)
    with urllib.request.urlopen(req, context=ctx) as res:
        crops = json.loads(res.read().decode())
        print(f"\n1. GET /crops -> {len(crops)} crops returned (Status {res.status})")
        print(f"   Sample crops:")
        for c in crops[:5]:
            print(f"   - [{c['crop_code']}] {c['common_name']} ({c['scientific_name']}) | Family: {c['family']} | Status: {c['taxonomy_status']}")

    # 2. Crop Threats Endpoint (Tomato)
    req = urllib.request.Request(f"{BASE_URL}/crops/crop_fao_0121_tomato/threats", headers=auth_headers)
    with urllib.request.urlopen(req, context=ctx) as res:
        threats = json.loads(res.read().decode())
        print(f"\n2. GET /crops/crop_fao_0121_tomato/threats -> {len(threats)} threats returned (Status {res.status})")
        for t in threats:
            print(f"   - {t['common_name']} ({t['organism_name']}) | Level: {t['evidence_level']} | Source: {t['source']}")

    # 3. Targets Endpoint
    req = urllib.request.Request(f"{BASE_URL}/targets", headers=auth_headers)
    with urllib.request.urlopen(req, context=ctx) as res:
        targets = json.loads(res.read().decode())
        print(f"\n3. GET /targets -> {len(targets)} targets returned (Status {res.status})")
        for tgt in targets:
            print(f"   - [{tgt.get('moa_scheme', 'N/A')}] {tgt['name']} | Class: {tgt.get('target_class', 'N/A')} | Mech: {tgt.get('resistance_mechanism', 'N/A')}")

    # 4. Target Structures Endpoint
    req = urllib.request.Request(f"{BASE_URL}/targets/tgt_ache1_01/structures", headers=auth_headers)
    with urllib.request.urlopen(req, context=ctx) as res:
        structures = json.loads(res.read().decode())
        print(f"\n4. GET /targets/tgt_ache1_01/structures -> {len(structures)} structures returned (Status {res.status})")
        for s in structures:
            print(f"   - PDB {s.get('pdb_id') or 'AlphaFold'} (Chain {s.get('chain_id')}) | Method: {s.get('experimental_method')} | Evidence: {s.get('mapping_evidence')}")

    print("\nAll Expanded REST API tests passed with 100% success!")

if __name__ == "__main__":
    test_api()
